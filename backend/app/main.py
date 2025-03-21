from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.api import api_router
from app.db.session import create_tables

app = FastAPI(
    title="Cargo Stowage Management System",
    description="API for managing cargo stowage on space stations",
    version="0.1.0",
)

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all API routes
app.include_router(api_router, prefix="/api")

@app.on_event("startup")
async def startup_event():
    # Create database tables
    create_tables()

@app.get("/")
async def root():
    return {"message": "Welcome to the Cargo Stowage Management System API"} 