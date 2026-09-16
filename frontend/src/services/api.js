/**
 * WSL System Detective - Centralized API Service Module
 * Wraps all communication with the FastAPI backend.
 * No other component should invoke fetch directly.
 */

export const BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
).replace(/\/$/, '');

/**
 * Standardized request helper that throws normalized errors.
 * Normalized error shape: { message: string, status: number, details?: any }
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      let errorData = null;
      try {
        errorData = await response.json();
      } catch {
        // Non-JSON response body
      }

      const message =
        errorData?.detail ||
        errorData?.message ||
        `HTTP Error ${response.status}: ${response.statusText}`;

      const error = new Error(message);
      error.status = response.status;
      error.details = errorData;
      throw error;
    }

    const data = await response.json();
    return data;
  } catch (err) {
    if (err.status) {
      // Already a normalized HTTP error
      throw err;
    }

    // Network / connection / DNS errors
    const networkError = new Error(
      `Backend unreachable at ${BASE_URL}. Ensure the FastAPI server is running.`
    );
    networkError.status = 0;
    networkError.details = { originalError: err.message };
    throw networkError;
  }
}

/**
 * Transforms the raw output of `ps -eLf` into a JSON array of objects.
 */
function transformProcessData(rawOutput) {
  const lines = rawOutput.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  
  const headerLine = lines[0];
  const headers = headerLine.split(/\s+/);
  const parsed = [];
  
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(/\s+/);
    if (parts.length < headers.length) continue;
    
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      if (headers[j] === 'CMD' && j === headers.length - 1) {
        obj[headers[j]] = parts.slice(j).join(' ');
      } else {
        obj[headers[j]] = parts[j];
      }
    }
    // Map 'C' to 'CPU' for the frontend
    if (obj['C']) obj['CPU'] = obj['C'];
    parsed.push(obj);
  }
  return parsed;
}

/**
 * Transforms the raw output of `top -b -n 1` into a structured object.
 */
function transformTopData(rawOutput) {
  const lines = rawOutput.split('\n').filter(l => l.trim().length > 0);
  const parsed = {
    load_avg: '—',
    tasks: { total: '—', running: '—' },
    processes: []
  };

  let processSection = false;
  let headers = [];

  for (let line of lines) {
    if (line.includes('load average:')) {
      const match = line.match(/load average:\s+(.*)/);
      if (match) parsed.load_avg = match[1];
    } else if (line.startsWith('Tasks:')) {
      const totalMatch = line.match(/(\d+)\s+total/);
      const runningMatch = line.match(/(\d+)\s+running/);
      if (totalMatch) parsed.tasks.total = totalMatch[1];
      if (runningMatch) parsed.tasks.running = runningMatch[1];
    } else if (line.trim().startsWith('PID ') || line.trim().startsWith('PID\t')) {
      processSection = true;
      headers = line.trim().split(/\s+/);
    } else if (processSection) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= headers.length) {
        const obj = {};
        for (let i = 0; i < headers.length; i++) {
          if (headers[i] === 'COMMAND' && i === headers.length - 1) {
            obj[headers[i]] = parts.slice(i).join(' ');
          } else {
            obj[headers[i]] = parts[i];
          }
        }
        parsed.processes.push(obj);
      }
    }
  }
  return parsed;
}

/**
 * Fetch CPU and ISA hardware specifications (via lscpu)
 * @returns {Promise<{ command: string, timestamp: string, raw_output: string, parsed: any, exit_code: number }>}
 */
export async function fetchCpuInfo() {
  return request('/api/commands/lscpu');
}

/**
 * Fetch RAM and Swap memory utilization (via free -h)
 * @returns {Promise<{ command: string, timestamp: string, raw_output: string, parsed: any, exit_code: number }>}
 */
export async function fetchMemoryInfo() {
  return request('/api/commands/memory');
}

/**
 * Fetch detailed thread and process tree (via ps -eLf)
 * @returns {Promise<{ command: string, timestamp: string, raw_output: string, parsed: any, exit_code: number }>}
 */
export async function fetchProcesses() {
  const data = await request('/api/commands/processes');
  if (data.raw_output && !data.parsed) {
    data.parsed = transformProcessData(data.raw_output);
  }
  return data;
}

/**
 * Fetch real-time top CPU consumer processes (via top -b -n 1 / htop)
 * @returns {Promise<{ command: string, timestamp: string, raw_output: string, parsed: any, exit_code: number }>}
 */
export async function fetchTop() {
  const data = await request('/api/commands/top');
  if (data.raw_output && !data.parsed) {
    data.parsed = transformTopData(data.raw_output);
  }
  return data;
}

/**
 * Run system call analysis trace for ls (via strace -c ls) - MANUAL TRIGGER ONLY
 * @returns {Promise<{ command: string, timestamp: string, raw_output: string, parsed: any, exit_code: number }>}
 */
export async function runStrace() {
  return request('/api/commands/strace');
}

/**
 * Fetch cache spatial locality benchmark data (via locality.c)
 * @returns {Promise<{ command?: string, timestamp?: string, raw_output?: string, parsed?: any, exit_code?: number, row_major_time?: number, col_major_time?: number, ratio?: number, runs?: any[] }>}
 */
export async function fetchLocality() {
  return request('/api/locality');
}
