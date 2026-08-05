# CorpMind

**Role-aware, multi-agent internal knowledge assistant.**

One chat interface, one login, for an entire company — smart enough to
know which department a question belongs to, and who is allowed to see
the answer.

## What It Does

- Employees ask questions in plain English ("what's our leave policy?",
  "can I expense a client dinner?")
- An **Orchestrator agent** classifies the question and routes it to the
  right **specialist agent** (HR / Finance / IT / Legal)
- Specialist agents answer **strictly from the company's own uploaded
  documents**, with citations — no hallucination, no guessing
- Cross-department questions get answers from multiple agents, merged
  into one response
- The same assistant can **draft actions** — a leave application, an
  expense request — and route them to HR for review, instead of the
  employee writing and emailing it manually
- Every employee's chat is completely private, even from admins
- Access control is **structural**: enforced at the database and vector
  search layer, not just as an instruction to the AI

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Backend | FastAPI (Python, async, modular monolith) |
| Relational DB | PostgreSQL (SQLAlchemy async + Alembic migrations) |
| Vector search | Qdrant Cloud — one isolated collection per knowledge domain |
| Embeddings | FastEmbed (local, no per-query API cost) |
| LLM reasoning | Groq API (routing, grounded answering, action drafting) |
| Auth | JWT, role- and branch-scoped |

## Project Structure

\`\`\`
corpmind/
├── backend/
│   ├── app/
│   │   ├── core/              # config, database, security, dependencies
│   │   ├── models/            # SQLAlchemy models (company, branch, user,
│   │   │                      # document, chat, action)
│   │   ├── schemas/           # Pydantic request/response schemas
│   │   ├── modules/           # API routers, one folder per domain:
│   │   │                      # auth, branches, users, documents, chat, actions
│   │   ├── agents/            # orchestrator, specialist agent, action agent
│   │   └── main.py            # FastAPI entrypoint
│   ├── alembic/                # DB migrations
│   ├── scripts/                 # one-off scripts (e.g. Qdrant collection init)
│   ├── storage/                 # uploaded document files (gitignored)
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/                # axios client / API calls
│   │   ├── components/         # shared UI components
│   │   ├── context/             # auth context
│   │   ├── pages/                # route-level pages (Chat, etc.)
│   │   └── main.jsx
│   ├── package.json
│   └── .env.example
├── docker-compose.yml
├── .gitignore
└── README.md
\`\`\`

## User Roles & Hierarchy

\`\`\`
super_admin  →  creates branches, creates branch_admins
branch_admin →  creates HR accounts, creates employee accounts
hr           →  uploads/manages documents, creates employee accounts,
                 reviews action requests (leave/expense drafts)
employee     →  uses the chat assistant, submits action requests
\`\`\`

Every user is scoped to a `role` + `branch_id`. This combination drives
every access-control check in the system — document visibility, chat
history, action requests, and Qdrant retrieval are all filtered by it.

## Local Development Setup

### Prerequisites
- Python 3.11+ (3.13 works, requires flexible dependency versions — see
  `requirements.txt`)
- Node.js
- A PostgreSQL database (local install or hosted)
- A Qdrant Cloud account (free tier) — https://cloud.qdrant.io
- A Groq API key — https://console.groq.com

### Backend

\`\`\`bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\\Scripts\\activate
pip install -r requirements.txt
cp .env.example .env
\`\`\`

Edit `.env` with your actual values:
- `DATABASE_URL` — must use the `postgresql+asyncpg://` scheme (async
  driver required)
- `JWT_SECRET_KEY` — any long random string
- `QDRANT_URL` / `QDRANT_API_KEY` — from your Qdrant Cloud cluster
- `GROK_API_KEY` / `GROK_API_BASE` / `GROK_MODEL` — Groq credentials
  (variable names say "GROK" for historical reasons, but point at Groq's
  OpenAI-compatible endpoint)

Run migrations:
\`\`\`bash
alembic upgrade head
\`\`\`

Initialize Qdrant collections (creates one collection per knowledge
domain + payload index):
\`\`\`bash
python scripts/init_qdrant_collections.py
\`\`\`

Start the server:
\`\`\`bash
uvicorn app.main:app --reload
\`\`\`
API docs available at `http://localhost:8000/docs`.

### Frontend

\`\`\`bash
cd frontend
npm install
cp .env.example .env
npm run dev
\`\`\`
App available at `http://localhost:5173`.

## API Overview

| Endpoint group | Purpose |
|---|---|
| `/api/auth` | signup (creates company + super_admin), login, current user |
| `/api/branches` | branch creation/listing (super_admin) |
| `/api/users` | role-hierarchy-enforced user creation/listing |
| `/api/documents` | HR document upload, listing, soft-delete |
| `/api/chat` | conversations + messages — routes questions through the orchestrator |
| `/api/actions` | HR review (approve/reject) of leave/expense drafts |

Full interactive documentation is available at `/docs` once the backend
is running.

## Data Flow Summary

1. HR uploads a document → text is extracted, chunked, embedded locally
   via FastEmbed, and pushed into the matching domain's Qdrant collection
2. An employee asks a question → the orchestrator classifies intent
   (action vs. question, then domain) using an LLM call
3. For document questions, the relevant domain's Qdrant collection is
   searched (filtered to the employee's branch), and the LLM generates
   an answer strictly from the retrieved passages, with citations
4. For action requests, the LLM drafts the leave/expense text directly
   and it's queued for HR review

## Deployment

- Backend: Docker + Render (see `backend/Dockerfile`)
- Frontend: Vercel
- `docker-compose.yml` is provided for local Postgres if preferred over
  a native install

## Status

Phases 1–8 (backend) complete: scaffolding, database + auth, document
ingestion, multi-agent orchestration, private chat history, and action
requests are all implemented and tested. Frontend UI covers chat; an
admin/HR panel for action requests and document management is in
progress.