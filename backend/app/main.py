"""
CorpMind Backend — Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.modules.auth.router import router as auth_router
from app.modules.branches.router import router as branches_router
from app.modules.users.router import router as users_router
from app.modules.documents.router import router as documents_router
from app.modules.chat.router import router as chat_router
from app.modules.actions.router import router as actions_router

app = FastAPI(
    title="CorpMind API",
    description="Role-aware, multi-agent internal knowledge assistant",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(branches_router, prefix="/api/branches", tags=["branches"])
app.include_router(users_router, prefix="/api/users", tags=["users"])
app.include_router(documents_router, prefix="/api/documents", tags=["documents"])
app.include_router(chat_router, prefix="/api/chat", tags=["chat"])
app.include_router(actions_router, prefix="/api/actions", tags=["actions"])


@app.get("/health")
async def health_check():
    """Simple liveness check — frontend calls this to confirm backend is reachable."""
    return {"status": "ok", "service": "corpmind-backend", "environment": settings.ENVIRONMENT}


@app.get("/")
async def root():
    return {"message": "CorpMind API is running. See /docs for API documentation."}