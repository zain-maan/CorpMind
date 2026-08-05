<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:4F46E5,100:06B6D4&height=220&section=header&text=CorpMind&fontSize=55&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Role-Aware%20Multi-Agent%20Enterprise%20Knowledge%20Assistant&descAlignY=58" />
</p>

<div align="center">

<p>
  <img src="https://skillicons.dev/icons?i=react,vite,tailwind,py,fastapi,postgres,docker,git,github,vscode" />
</p>

<p>
  <img src="https://img.shields.io/badge/AI-Multi--Agent-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/RAG-Qdrant-success?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Auth-JWT-orange?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-Educational-red?style=for-the-badge" />
</p>

</div>

# 🧠 CorpMind

> **Role-Aware Multi-Agent Enterprise Knowledge Assistant**

A secure AI-powered internal knowledge assistant that enables organizations to search company knowledge, automate workflows, and answer employee questions using only approved internal documents.

---

## ✨ Overview

CorpMind provides a single intelligent chat interface for an entire organization. Instead of searching through emails, PDFs, and policy documents, employees simply ask questions in natural language.

The system intelligently identifies the appropriate department, retrieves relevant information from company documents, and generates grounded responses with citations while enforcing strict access control.

---

## 🚀 Key Features

* 💬 Natural language chat interface
* 🤖 Multi-Agent AI architecture
* 🎯 Intelligent query routing through an Orchestrator Agent
* 👨‍💼 Department-specific specialist agents (HR, Finance, IT, Legal)
* 📄 Retrieval-Augmented Generation (RAG) using company documents
* 📚 Citation-based responses with zero hallucination policy
* 🔐 Role & Branch based access control
* 🏢 Multi-company and multi-branch architecture
* 📝 AI-generated leave and expense request drafting
* 📨 HR approval workflow
* 🔒 Private chat history for every employee
* ⚡ Local embeddings with FastEmbed for low-cost retrieval
* ☁️ Cloud vector search powered by Qdrant

---

## 🏗️ System Workflow

```text
Employee
    │
    ▼
Chat Interface
    │
    ▼
Orchestrator Agent
    │
    ├────────► HR Agent
    ├────────► Finance Agent
    ├────────► IT Agent
    └────────► Legal Agent
              │
              ▼
     Retrieve Company Knowledge
              │
              ▼
     Citation-Based AI Response
```

---

# 🛠 Tech Stack

| Category              | Technology                  |
| --------------------- | --------------------------- |
| 🎨 Frontend           | React + Vite + Tailwind CSS |
| ⚙️ Backend            | FastAPI (Python)            |
| 🗄 Database           | PostgreSQL                  |
| 🔍 Vector Database    | Qdrant Cloud                |
| 🧠 Embeddings         | FastEmbed                   |
| 🤖 LLM                | Groq API                    |
| 🔑 Authentication     | JWT                         |
| 🐳 Containerization   | Docker                      |
| 🔄 Database Migration | Alembic                     |

---

# 📂 Project Structure

```text
corpmind/
│
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   ├── core/
│   │   ├── models/
│   │   ├── modules/
│   │   ├── schemas/
│   │   └── main.py
│   │
│   ├── alembic/
│   ├── scripts/
│   ├── storage/
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── .env.example
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

# 👥 User Roles

```text
Super Admin
      │
      ▼
Branch Admin
      │
      ▼
HR
      │
      ▼
Employee
```

### Responsibilities

* 👑 **Super Admin**

  * Create companies and branches
  * Manage branch administrators

* 🏢 **Branch Admin**

  * Manage HR accounts
  * Manage employee accounts

* 👨‍💼 **HR**

  * Upload company documents
  * Manage knowledge base
  * Review leave & expense requests

* 👤 **Employee**

  * Ask questions
  * Search company knowledge
  * Submit leave & expense requests

---

# ⚙️ Local Development

## Prerequisites

* Python 3.11+
* Node.js
* PostgreSQL
* Qdrant Cloud
* Groq API Key

---

## Backend Setup

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt

cp .env.example .env
```

Update the `.env` file with:

* DATABASE_URL
* JWT_SECRET_KEY
* QDRANT_URL
* QDRANT_API_KEY
* GROQ_API_KEY
* GROQ_MODEL

Run migrations:

```bash
alembic upgrade head
```

Initialize Qdrant:

```bash
python scripts/init_qdrant_collections.py
```

Run the backend:

```bash
uvicorn app.main:app --reload
```

API Documentation:

```
http://localhost:8000/docs
```

---

## Frontend Setup

```bash
cd frontend

npm install

cp .env.example .env

npm run dev
```

Application:

```
http://localhost:5173
```

---

# 🌐 API Modules

| Module       | Description               |
| ------------ | ------------------------- |
| 🔐 Auth      | Authentication & JWT      |
| 👥 Users     | User Management           |
| 🏢 Branches  | Branch Management         |
| 📄 Documents | Upload & Manage Knowledge |
| 💬 Chat      | AI Chat Interface         |
| 📝 Actions   | Leave & Expense Approval  |

---

# 🔄 Data Flow

```text
HR Uploads Documents
        │
        ▼
Text Extraction
        │
        ▼
Chunking
        │
        ▼
FastEmbed Embeddings
        │
        ▼
Qdrant Vector Storage
        │
        ▼
Employee Question
        │
        ▼
Orchestrator Agent
        │
        ▼
Specialist Agent
        │
        ▼
Relevant Retrieval
        │
        ▼
Grounded AI Response + Citations
```
---

# 👨‍💻 Contributors

| Name                    | GitHub                            |
| ----------------------- | --------------------------------- |
| **Zain Ul Abideen**     | https://github.com/zain-maan      |
| **Sara Nadeem**         | https://github.com/Sara407-collab |
| **Abdullah Bin Zubair** | https://github.com/spectre0037    |

---
<p align="center">
Made with ❤️ using FastAPI, React, PostgreSQL, Qdrant & AI
</p>
