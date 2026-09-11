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
  return request('/api/commands/processes');
}

/**
 * Fetch real-time top CPU consumer processes (via top -b -n 1 / htop)
 * @returns {Promise<{ command: string, timestamp: string, raw_output: string, parsed: any, exit_code: number }>}
 */
export async function fetchTop() {
  return request('/api/commands/top');
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
