from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Item, Container
from app.core.schemas import Item as ItemSchema
from app.core.schemas import ItemCreate, ItemUpdate, ItemPosition

router = APIRouter()

@router.get("/", response_model=List[ItemSchema])
def get_items(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    """Get all items"""
    items = db.query(Item).offset(skip).limit(limit).all()
    return items

@router.post("/", response_model=ItemSchema, status_code=status.HTTP_201_CREATED)
def create_item(
    item: ItemCreate, 
    db: Session = Depends(get_db)
):
    """Create a new item"""
    db_item = Item(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.get("/{item_id}", response_model=ItemSchema)
def get_item(
    item_id: int, 
    db: Session = Depends(get_db)
):
    """Get a specific item by ID"""
    item = db.query(Item).filter(Item.id == item_id).first()
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with id {item_id} not found"
        )
    return item

@router.put("/{item_id}", response_model=ItemSchema)
def update_item(
    item_id: int, 
    item_update: ItemUpdate, 
    db: Session = Depends(get_db)
):
    """Update an item"""
    db_item = db.query(Item).filter(Item.id == item_id).first()
    if db_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with id {item_id} not found"
        )
    
    # Update item fields if provided
    update_data = item_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)
    
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(
    item_id: int, 
    db: Session = Depends(get_db)
):
    """Delete an item"""
    db_item = db.query(Item).filter(Item.id == item_id).first()
    if db_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with id {item_id} not found"
        )
    
    db.delete(db_item)
    db.commit()
    return None

@router.post("/{item_id}/position", response_model=ItemSchema)
def update_item_position(
    item_id: int, 
    position: ItemPosition, 
    db: Session = Depends(get_db)
):
    """Update an item's position within a container"""
    # First check if the item exists
    db_item = db.query(Item).filter(Item.id == item_id).first()
    if db_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with id {item_id} not found"
        )
    
    # Then check if the container exists
    container = db.query(Container).filter(Container.id == position.container_id).first()
    if container is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Container with id {position.container_id} not found"
        )
    
    # Update item position
    db_item.position_x = position.position_x
    db_item.position_y = position.position_y
    db_item.position_z = position.position_z
    db_item.rotation_x = position.rotation_x
    db_item.rotation_y = position.rotation_y
    db_item.rotation_z = position.rotation_z
    
    # Add the item to the container if it's not already in it
    if container not in db_item.containers:
        db_item.containers.append(container)
    
    db.commit()
    db.refresh(db_item)
    return db_item 