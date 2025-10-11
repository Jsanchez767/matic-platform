# Matic Platform API

Python FastAPI backend aligned with the new PostgreSQL schema in `001_initial_schema.sql`.

## Prerequisites

- Python 3.9+
- PostgreSQL database matching the schema

## Installation

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

## Environment

Copy `.env.example` to `.env` and update values. The API defaults to `postgresql+asyncpg://postgres:postgres@localhost:5432/matic`.

```
DATABASE_URL=postgresql+asyncpg://username:password@host:5432/database
DEBUG=false
```

## Running the server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Testing

```bash
pytest
```
