import json
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Container, Item, StowagePlan
from app.core.schemas import StowagePlan as StowagePlanSchema
from app.core.schemas import ItemPosition
import numpy as np
from ortools.linear_solver import pywraplp
import time

router = APIRouter()

# Connection manager for WebSockets
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_optimization_progress(self, websocket: WebSocket, data: Dict[str, Any]):
        await websocket.send_json(data)

manager = ConnectionManager()

@router.post("/bin-packing", response_model=StowagePlanSchema)
async def optimize_bin_packing(
    container_id: int,
    db: Session = Depends(get_db)
):
    """
    Optimize cargo placement using 3D bin packing algorithm
    This endpoint uses a hybrid approach with heuristics and constraint optimization
    """
    # First, check if the container exists
    container = db.query(Container).filter(Container.id == container_id).first()
    if not container:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Container with id {container_id} not found"
        )

    # Get all unassigned items
    items = db.query(Item).all()
    if not items:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No items found to optimize"
        )

    # Execute optimization algorithm
    start_time = time.time()
    try:
        item_positions = optimize_cargo_placement(container, items)
        optimization_time = time.time() - start_time
        
        # Make sure it doesn't exceed time constraint
        if optimization_time > 1.0:  # 1 second constraint
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Optimization took too long: {optimization_time:.2f} seconds"
            )
            
        # Calculate scores
        space_efficiency = calculate_space_efficiency(container, items, item_positions)
        accessibility = calculate_accessibility(container, items, item_positions)
        retrieval_time = calculate_retrieval_time(container, items, item_positions)
        
        # Calculate overall score
        overall_score = (space_efficiency * 0.4) + (accessibility * 0.3) + (retrieval_time * 0.3)
        
        # Create a stowage plan
        plan_name = f"Optimized Plan for Container {container.name}"
        visualization_data = json.dumps({
            "container": {
                "id": container.id,
                "width": container.width,
                "height": container.height,
                "depth": container.depth
            },
            "item_positions": item_positions
        })
        
        # Create and save stowage plan
        stowage_plan = StowagePlan(
            name=plan_name,
            description=f"Automatically generated plan. Optimization time: {optimization_time:.2f}s",
            space_efficiency_score=space_efficiency,
            accessibility_score=accessibility,
            retrieval_time_score=retrieval_time,
            overall_score=overall_score,
            visualization_data=visualization_data
        )
        db.add(stowage_plan)
        db.commit()
        db.refresh(stowage_plan)
        
        # Update item positions in the database
        for item_pos in item_positions:
            item = db.query(Item).filter(Item.id == item_pos["item_id"]).first()
            if item:
                item.position_x = item_pos["position_x"]
                item.position_y = item_pos["position_y"]
                item.position_z = item_pos["position_z"]
                item.rotation_x = item_pos.get("rotation_x", 0)
                item.rotation_y = item_pos.get("rotation_y", 0)
                item.rotation_z = item_pos.get("rotation_z", 0)
                
                # Add to container if not already there
                if container not in item.containers:
                    item.containers.append(container)
        
        db.commit()
        
        return stowage_plan
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during optimization: {str(e)}"
        )

@router.websocket("/ws/optimization-progress")
async def optimization_progress_websocket(websocket: WebSocket):
    """WebSocket endpoint for real-time optimization progress updates"""
    await manager.connect(websocket)
    try:
        while True:
            # Wait for any message from client (just to keep connection alive)
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Helper functions for optimization logic
def optimize_cargo_placement(container, items):
    """
    Core optimization algorithm using OR-Tools for 3D bin packing
    This is a simplified version. In a real implementation, this would be much more complex.
    """
    # Create solver
    solver = pywraplp.Solver.CreateSolver('SCIP')
    
    # Container dimensions
    container_width = container.width
    container_height = container.height
    container_depth = container.depth
    
    # List to store item positions
    item_positions = []
    
    # Simple greedy algorithm for demonstration
    # In reality, would use more complex bin packing algorithms
    current_x, current_y, current_z = 0, 0, 0
    
    for item in sorted(items, key=lambda x: (-x.priority, x.expiry_date or float('inf'))):
        # Check if item fits in current position
        if current_x + item.width <= container_width:
            # Place item
            position = {
                "item_id": item.id,
                "position_x": current_x,
                "position_y": current_y,
                "position_z": current_z,
                "rotation_x": 0,
                "rotation_y": 0,
                "rotation_z": 0
            }
            item_positions.append(position)
            
            # Update position for next item
            current_x += item.width
        elif current_y + item.height <= container_height:
            # Move to next row
            current_x = 0
            current_y += max([i.height for i in items if i.id in [p["item_id"] for p in item_positions[-5:]]] or [0])
            
            # Place item
            position = {
                "item_id": item.id,
                "position_x": current_x,
                "position_y": current_y,
                "position_z": current_z,
                "rotation_x": 0,
                "rotation_y": 0,
                "rotation_z": 0
            }
            item_positions.append(position)
            
            # Update position for next item
            current_x += item.width
        elif current_z + item.depth <= container.depth:
            # Move to next layer
            current_x = 0
            current_y = 0
            current_z += max([i.depth for i in items if i.id in [p["item_id"] for p in item_positions[-10:]]] or [0])
            
            # Place item
            position = {
                "item_id": item.id,
                "position_x": current_x,
                "position_y": current_y,
                "position_z": current_z,
                "rotation_x": 0,
                "rotation_y": 0,
                "rotation_z": 0
            }
            item_positions.append(position)
            
            # Update position for next item
            current_x += item.width
        else:
            # Container is full
            break
    
    return item_positions

def calculate_space_efficiency(container, items, item_positions):
    """Calculate space efficiency score (0-100)"""
    # Calculate total volume of container
    container_volume = container.width * container.height * container.depth
    
    # Calculate total volume of placed items
    item_volume = 0
    for pos in item_positions:
        item = next((i for i in items if i.id == pos["item_id"]), None)
        if item:
            item_volume += item.width * item.height * item.depth
    
    # Calculate space efficiency
    if container_volume > 0:
        space_efficiency = (item_volume / container_volume) * 100
        return min(space_efficiency, 100)  # Cap at 100
    return 0

def calculate_accessibility(container, items, item_positions):
    """Calculate accessibility score (0-100)"""
    # This is a simplified approach
    # In a real implementation, would consider spatial relationships
    
    total_items = len(item_positions)
    if total_items == 0:
        return 100  # Perfect accessibility if no items
    
    # Count items that are accessible (on the edges)
    accessible_items = 0
    for pos in item_positions:
        # If item is on an edge of the container, consider it accessible
        if (pos["position_x"] == 0 or 
            pos["position_y"] == 0 or 
            pos["position_z"] == 0 or
            pos["position_x"] + next((i.width for i in items if i.id == pos["item_id"]), 0) >= container.width or
            pos["position_y"] + next((i.height for i in items if i.id == pos["item_id"]), 0) >= container.height or
            pos["position_z"] + next((i.depth for i in items if i.id == pos["item_id"]), 0) >= container.depth):
            accessible_items += 1
    
    # Calculate accessibility score
    accessibility = (accessible_items / total_items) * 100
    return accessibility

def calculate_retrieval_time(container, items, item_positions):
    """Calculate retrieval time score (0-100)"""
    # This is a simplified approach
    # In a real implementation, would consider complex paths
    
    # Calculate max distance from entrance
    max_distance = np.sqrt(container.width**2 + container.height**2 + container.depth**2)
    
    # Calculate average distance of high-priority items from entrance
    distances = []
    priority_weights = []
    
    for pos in item_positions:
        item = next((i for i in items if i.id == pos["item_id"]), None)
        if item:
            # Calculate distance from entrance (assume entrance at 0,0,0)
            distance = np.sqrt(pos["position_x"]**2 + pos["position_y"]**2 + pos["position_z"]**2)
            distances.append(distance)
            priority_weights.append(item.priority)
    
    if not distances:
        return 100  # Perfect score if no items
    
    # Weight distances by priority
    weighted_avg_distance = sum(d * w for d, w in zip(distances, priority_weights)) / sum(priority_weights)
    
    # Convert to score (shorter distances = higher score)
    retrieval_score = 100 * (1 - (weighted_avg_distance / max_distance))
    return max(0, min(retrieval_score, 100))  # Ensure between 0-100 