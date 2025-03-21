from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

# ---- Container Schemas ----
class ContainerBase(BaseModel):
    name: str
    location: str
    width: float
    height: float
    depth: float
    max_weight: float

class ContainerCreate(ContainerBase):
    pass

class ContainerUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    width: Optional[float] = None
    height: Optional[float] = None
    depth: Optional[float] = None
    max_weight: Optional[float] = None
    current_weight: Optional[float] = None
    volume_used: Optional[float] = None

class ContainerInDB(ContainerBase):
    id: int
    current_weight: float
    volume_used: float
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class Container(ContainerInDB):
    pass

# ---- Item Schemas ----
class ItemBase(BaseModel):
    name: str
    category: str
    width: float
    height: float
    depth: float
    weight: float
    priority: int = 1
    is_fragile: bool = False
    is_hazardous: bool = False

class ItemCreate(ItemBase):
    expiry_date: Optional[datetime] = None

class ItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    width: Optional[float] = None
    height: Optional[float] = None
    depth: Optional[float] = None
    weight: Optional[float] = None
    priority: Optional[int] = None
    expiry_date: Optional[datetime] = None
    is_fragile: Optional[bool] = None
    is_hazardous: Optional[bool] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    position_z: Optional[float] = None
    rotation_x: Optional[float] = None
    rotation_y: Optional[float] = None
    rotation_z: Optional[float] = None

class ItemPosition(BaseModel):
    container_id: int
    position_x: float
    position_y: float
    position_z: float
    rotation_x: float = 0
    rotation_y: float = 0
    rotation_z: float = 0

class ItemInDB(ItemBase):
    id: int
    expiry_date: Optional[datetime] = None
    position_x: float = 0
    position_y: float = 0
    position_z: float = 0
    rotation_x: float = 0
    rotation_y: float = 0
    rotation_z: float = 0
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class Item(ItemInDB):
    pass

# ---- StowagePlan Schemas ----
class StowagePlanBase(BaseModel):
    name: str
    description: Optional[str] = None

class StowagePlanCreate(StowagePlanBase):
    visualization_data: str  # JSON string

class StowagePlanUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    space_efficiency_score: Optional[float] = None
    accessibility_score: Optional[float] = None
    retrieval_time_score: Optional[float] = None
    overall_score: Optional[float] = None
    visualization_data: Optional[str] = None

class StowagePlanInDB(StowagePlanBase):
    id: int
    space_efficiency_score: float
    accessibility_score: float
    retrieval_time_score: float
    overall_score: float
    visualization_data: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class StowagePlan(StowagePlanInDB):
    pass 