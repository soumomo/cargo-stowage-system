from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Container
from app.core.schemas import Container as ContainerSchema
from app.core.schemas import ContainerCreate, ContainerUpdate

router = APIRouter()

@router.get("/", response_model=List[ContainerSchema])
def get_containers(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    """Get all containers"""
    containers = db.query(Container).offset(skip).limit(limit).all()
    return containers

@router.post("/", response_model=ContainerSchema, status_code=status.HTTP_201_CREATED)
def create_container(
    container: ContainerCreate, 
    db: Session = Depends(get_db)
):
    """Create a new container"""
    db_container = Container(
        name=container.name,
        location=container.location,
        width=container.width,
        height=container.height,
        depth=container.depth,
        max_weight=container.max_weight,
        current_weight=0,
        volume_used=0
    )
    db.add(db_container)
    db.commit()
    db.refresh(db_container)
    return db_container

@router.get("/{container_id}", response_model=ContainerSchema)
def get_container(
    container_id: int, 
    db: Session = Depends(get_db)
):
    """Get a specific container by ID"""
    container = db.query(Container).filter(Container.id == container_id).first()
    if container is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Container with id {container_id} not found"
        )
    return container

@router.put("/{container_id}", response_model=ContainerSchema)
def update_container(
    container_id: int, 
    container_update: ContainerUpdate, 
    db: Session = Depends(get_db)
):
    """Update a container"""
    db_container = db.query(Container).filter(Container.id == container_id).first()
    if db_container is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Container with id {container_id} not found"
        )
    
    # Update container fields if provided
    update_data = container_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_container, key, value)
    
    db.commit()
    db.refresh(db_container)
    return db_container

@router.delete("/{container_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_container(
    container_id: int, 
    db: Session = Depends(get_db)
):
    """Delete a container"""
    db_container = db.query(Container).filter(Container.id == container_id).first()
    if db_container is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Container with id {container_id} not found"
        )
    
    db.delete(db_container)
    db.commit()
    return None 