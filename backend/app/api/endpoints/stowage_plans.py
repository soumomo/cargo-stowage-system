from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import StowagePlan
from app.core.schemas import StowagePlan as StowagePlanSchema
from app.core.schemas import StowagePlanCreate, StowagePlanUpdate

router = APIRouter()

@router.get("/", response_model=List[StowagePlanSchema])
def get_stowage_plans(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    """Get all stowage plans"""
    plans = db.query(StowagePlan).offset(skip).limit(limit).all()
    return plans

@router.post("/", response_model=StowagePlanSchema, status_code=status.HTTP_201_CREATED)
def create_stowage_plan(
    plan: StowagePlanCreate, 
    db: Session = Depends(get_db)
):
    """Create a new stowage plan"""
    db_plan = StowagePlan(
        name=plan.name,
        description=plan.description,
        visualization_data=plan.visualization_data,
        space_efficiency_score=0,  # To be calculated
        accessibility_score=0,     # To be calculated
        retrieval_time_score=0,    # To be calculated
        overall_score=0            # To be calculated
    )
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return db_plan

@router.get("/{plan_id}", response_model=StowagePlanSchema)
def get_stowage_plan(
    plan_id: int, 
    db: Session = Depends(get_db)
):
    """Get a specific stowage plan by ID"""
    plan = db.query(StowagePlan).filter(StowagePlan.id == plan_id).first()
    if plan is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stowage plan with id {plan_id} not found"
        )
    return plan

@router.put("/{plan_id}", response_model=StowagePlanSchema)
def update_stowage_plan(
    plan_id: int, 
    plan_update: StowagePlanUpdate, 
    db: Session = Depends(get_db)
):
    """Update a stowage plan"""
    db_plan = db.query(StowagePlan).filter(StowagePlan.id == plan_id).first()
    if db_plan is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stowage plan with id {plan_id} not found"
        )
    
    # Update plan fields if provided
    update_data = plan_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_plan, key, value)
    
    db.commit()
    db.refresh(db_plan)
    return db_plan

@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_stowage_plan(
    plan_id: int, 
    db: Session = Depends(get_db)
):
    """Delete a stowage plan"""
    db_plan = db.query(StowagePlan).filter(StowagePlan.id == plan_id).first()
    if db_plan is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stowage plan with id {plan_id} not found"
        )
    
    db.delete(db_plan)
    db.commit()
    return None 