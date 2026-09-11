"""
SysSight Backend - Main Entry Point
FastAPI application initialization and core routes.
"""

from fastapi import FastAPI
from services.cpu import get_cpu_info
from services.memory import get_memory_info
from services.process import get_process_info
from services.top import get_top_info
from services.tracing import get_strace_info
from services.locality import get_locality_info

# Initialize FastAPI application instance
app = FastAPI(title="SysSight Backend")


@app.get("/api/health")
def health_check() -> dict:
    """
    Health check endpoint to verify backend connectivity and operational status.
    """
    return {
        "status": "ok",
        "service": "SysSight Backend",
    }


@app.get("/api/commands/lscpu")
def get_cpu_command() -> dict:
    """
    Executes live 'lscpu' command via the CPU service on every request,
    returning real-time processor architecture specifications and raw output.
    """
    return get_cpu_info()


@app.get("/api/commands/memory")
def get_memory_command() -> dict:
    """
    Executes live 'free -h' command via the Memory service on every request,
    returning real-time RAM and Swap utilization metrics and raw output.
    """
    return get_memory_info()


@app.get("/api/commands/processes")
def get_processes_command() -> dict:
    """
    Executes live 'ps -eLf' command via the Process service on every request,
    returning real-time system process and thread details along with raw output.
    """
    return get_process_info()


@app.get("/api/commands/top")
def get_top_command() -> dict:
    """
    Executes live 'top -b -n 1' command via the Top service on every request,
    returning real-time performance summary, tasks, CPU states, and raw output.
    """
    return get_top_info()


@app.get("/api/commands/strace")
def get_strace_command() -> dict:
    """
    Executes live 'strace -c ls' command via the Tracing service on every request,
    intercepting kernel system calls and returning the live strace summary.
    """
    return get_strace_info()


@app.get("/api/locality")
def get_locality_command() -> dict:
    """
    Executes live compiled './locality' executable via the Locality service on every request,
    benchmarking CPU spatial cache locality and returning performance ratios.
    """
    return get_locality_info()


