from fastapi import APIRouter
from app.api.endpoints import containers, items, stowage_plans, optimization

api_router = APIRouter()

api_router.include_router(containers.router, prefix="/containers", tags=["containers"])
api_router.include_router(items.router, prefix="/items", tags=["items"])
api_router.include_router(stowage_plans.router, prefix="/stowage-plans", tags=["stowage-plans"])
api_router.include_router(optimization.router, prefix="/optimization", tags=["optimization"]) 