from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from geoalchemy2 import Geometry
from app.db.session import Base

# Association table for many-to-many relationships
container_item_association = Table(
    "container_item_association",
    Base.metadata,
    Column("container_id", Integer, ForeignKey("containers.id")),
    Column("item_id", Integer, ForeignKey("items.id")),
)

class Container(Base):
    """Model for storage containers in the space station"""
    __tablename__ = "containers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    location = Column(String)
    width = Column(Float)
    height = Column(Float)
    depth = Column(Float)
    max_weight = Column(Float)
    current_weight = Column(Float, default=0)
    volume_used = Column(Float, default=0)
    # Geometry column for 3D spatial data
    geometry = Column(Geometry("POLYHEDRALSURFACE", dimension=3, srid=4326))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    items = relationship("Item", secondary=container_item_association, back_populates="containers")

class Item(Base):
    """Model for items stored in containers"""
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String, index=True)
    width = Column(Float)
    height = Column(Float)
    depth = Column(Float)
    weight = Column(Float)
    priority = Column(Integer, default=1)  # Higher number = higher priority
    expiry_date = Column(DateTime(timezone=True), nullable=True)
    is_fragile = Column(Boolean, default=False)
    is_hazardous = Column(Boolean, default=False)
    position_x = Column(Float, default=0)
    position_y = Column(Float, default=0)
    position_z = Column(Float, default=0)
    rotation_x = Column(Float, default=0)
    rotation_y = Column(Float, default=0)
    rotation_z = Column(Float, default=0)
    # Geometry column for 3D spatial data
    geometry = Column(Geometry("POLYHEDRALSURFACE", dimension=3, srid=4326))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    containers = relationship("Container", secondary=container_item_association, back_populates="items")

class StowagePlan(Base):
    """Model for storing different stowage plans/configurations"""
    __tablename__ = "stowage_plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    space_efficiency_score = Column(Float, default=0)
    accessibility_score = Column(Float, default=0)
    retrieval_time_score = Column(Float, default=0)
    overall_score = Column(Float, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # JSON data for visualization
    visualization_data = Column(String)  # Stored as JSON 