# SysSight

### System Monitoring & Performance Analysis Dashboard

**SysSight** is a web-based system monitoring dashboard that collects real-time machine information using Linux system utilities and presents it through an interactive React interface. It combines system-level commands, a FastAPI backend, and automated data refresh to provide a clear view of CPU, memory, processes, system calls, and cache locality.

## ✨ Features

* **CPU Monitoring** — Displays processor architecture, CPU details, and ISA information using `lscpu`.
* **Memory Monitoring** — Tracks system memory and usage using `free -h`.
* **Process Analysis** — Displays running processes and threads with runtime information.
* **Top Process Monitoring** — Identifies resource-intensive processes using `top`.
* **System Call Profiling** — Uses `strace -c` to analyze system-call activity.
* **Cache Locality Analysis** — Compares row-major and column-major memory access performance.
* **Live Command Console** — Provides raw command outputs directly within the dashboard.
* **Auto Refresh** — Automatically updates system information at configurable intervals.
* **Manual Refresh** — Allows users to refresh all monitored metrics on demand.
* **Responsive Dashboard** — Clean and responsive interface for different screen sizes.

## 🏗️ Architecture

```text
                    ┌──────────────────────┐
                    │      React UI        │
                    │   Monitoring Cards   │
                    └──────────┬───────────┘
                               │
                          REST API
                               │
                    ┌──────────▼───────────┐
                    │    FastAPI Backend   │
                    │                      │
                    │ CPU │ Memory │ Proc. │
                    │ Top │ Strace │ Locality
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │    Linux System      │
                    │                      │
                    │ lscpu │ free │ top  │
                    │ ps    │ strace │ etc.│
                    └──────────────────────┘
```

## 🛠️ Tech Stack

**Frontend**

* React
* Vite
* Tailwind CSS
* Lucide React

**Backend**

* Python
* FastAPI
* Uvicorn

**System & Analysis Tools**

* Linux
* `lscpu`
* `free`
* `ps`
* `top`
* `strace`
* C-based memory locality experiment

## 📁 Project Structure

```text
SysSight/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── ...
│   └── ...
│
├── backend/
│   ├── services/
│   │   ├── cpu.py
│   │   ├── memory.py
│   │   ├── process.py
│   │   └── locality.py
│   ├── main.py
│   └── requirements.txt
│
└── README.md
```

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Anishj-tech/SysSight.git
cd SysSight
```

### 2. Start the backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

The API will be available at:

```text
http://127.0.0.1:8000
```

### 3. Start the frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Then open the URL provided by Vite, typically:

```text
http://localhost:5173
```

> **Note:** SysSight is designed to run in a Linux environment because its monitoring and profiling features rely on Linux system utilities.

## 🔄 Auto-Refresh

SysSight uses a custom React `useAutoRefresh` hook to periodically trigger a centralized refresh function. The dashboard can automatically fetch updated CPU, memory, process, top-process, and locality data at configurable intervals.

Users can also pause auto-refresh or trigger a manual refresh whenever required.

## 🎯 Purpose

SysSight demonstrates how low-level operating-system information can be collected through standard Linux utilities, processed by a backend service, and transformed into an accessible real-time monitoring dashboard.

It provides practical exposure to **Operating Systems, system calls, process management, memory behavior, performance analysis, REST APIs, and modern frontend development**.

## 👨‍💻 Author

**Anish Jabras**

Information Technology | PICT

**Atharva Ingle**

Information Technology | PICT

---

⭐ If you find SysSight useful, consider starring the repository.
