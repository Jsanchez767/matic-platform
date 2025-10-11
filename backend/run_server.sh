#!/bin/bash

# Navigate to backend directory
cd "$(dirname "$0")"

# Activate virtual environment
source ../.venv/bin/activate

# Set PYTHONPATH
export PYTHONPATH="$(pwd)"

# Run uvicorn
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
