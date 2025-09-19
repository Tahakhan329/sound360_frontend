#!/usr/bin/env python3
"""
Sound360 FastAPI Backend Startup Script
"""

import sys
import os
import subprocess

# os.environ["PYTORCH_NO_CUDA_MEMORY_CACHING"] = "1"
os.environ["PYTORCH_CUDA_ALLOC_CONF"] = (
    "garbage_collection_threshold:0.6,max_split_size_mb:128"
)
os.environ["CUBLASLT_DISABLE"] = "1"
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
os.environ["HF_HUB_DISABLE_SYMLINKS"] = "1"



def check_dependencies():
    """Check if required dependencies are installed"""
    required_packages = ["fastapi", "uvicorn"]
    missing_packages = []

    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing_packages.append(package)

    if missing_packages:
        print(f"Installing missing packages: {', '.join(missing_packages)}")
        subprocess.check_call(
            [sys.executable, "-m", "pip", "install"] + missing_packages
        )


def main():
    import argparse
    from pathlib import Path

    parser = argparse.ArgumentParser(description="Start Sound360 FastAPI Backend")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind to")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind to")
    parser.add_argument(
        "--reload", action="store_true", help="Enable auto-reload for development"
    )
    parser.add_argument(
        "--workers", type=int, default=1, help="Number of worker processes"
    )

    args = parser.parse_args()

    # Ensure required directories exist
    Path("uploads/audio").mkdir(parents=True, exist_ok=True)
    Path("logs").mkdir(parents=True, exist_ok=True)

    print(f"🚀 Starting Sound360 FastAPI Backend on {args.host}:{args.port}")
    print(f"📊 Admin Dashboard: http://{args.host}:{args.port}")
    print(f"📖 API Documentation: http://{args.host}:{args.port}/api/docs")

    # Check and install dependencies
    check_dependencies()

    # Import uvicorn after ensuring it's installed
    import uvicorn

    uvicorn.run(
        "main:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        workers=args.workers if not args.reload else 1,
        log_level="info",
    )


if __name__ == "__main__":
    main()
