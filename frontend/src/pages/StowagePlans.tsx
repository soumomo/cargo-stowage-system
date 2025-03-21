import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchStowagePlans, deleteStowagePlan, optimizeNewPlan } from '../store/stowagePlansSlice';
import { fetchContainers } from '../store/containersSlice';
import { fetchItems } from '../store/itemsSlice';
import { AppDispatch, RootState } from '../store';
import ContainerVisualization from '../3d/ContainerVisualization';
import Modal from '../components/Modal';
import Button from '../components/Button';
import Card from '../components/Card';
import FormGroup from '../components/FormGroup';
import SearchInput from '../components/SearchInput';
import './StowagePlans.css';

interface CreatePlanForm {
  container_id: string;
  selected_item_ids: string[];
  time_constraint: number;
}

const StowagePlans: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { stowagePlans, loading, optimizationStatus, error } = useSelector((state: RootState) => state.stowagePlans);
  const { containers } = useSelector((state: RootState) => state.containers);
  const { items } = useSelector((state: RootState) => state.items);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<typeof stowagePlans[0] | null>(null);
  const [createPlanForm, setCreatePlanForm] = useState<CreatePlanForm>({
    container_id: '',
    selected_item_ids: [],
    time_constraint: 1
  });
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    dispatch(fetchStowagePlans());
    dispatch(fetchContainers());
    dispatch(fetchItems());
  }, [dispatch]);

  const handleCreateClick = () => {
    setCreatePlanForm({
      container_id: containers.length > 0 ? containers[0].id : '',
      selected_item_ids: [],
      time_constraint: 1
    });
    setIsCreateModalOpen(true);
  };

  const handleViewClick = (plan: typeof stowagePlans[0]) => {
    setSelectedPlan(plan);
    setIsViewModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this stowage plan?')) {
      try {
        await dispatch(deleteStowagePlan(id)).unwrap();
      } catch (err) {
        console.error('Failed to delete stowage plan:', err);
      }
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (createPlanForm.selected_item_ids.length === 0) {
      alert('Please select at least one item.');
      return;
    }
    
    try {
      await dispatch(optimizeNewPlan({
        container_id: createPlanForm.container_id,
        item_ids: createPlanForm.selected_item_ids,
        time_constraint: createPlanForm.time_constraint
      })).unwrap();
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error('Failed to create stowage plan:', err);
    }
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === 'time_constraint') {
      setCreatePlanForm({
        ...createPlanForm,
        [name]: parseFloat(value) || 1
      });
    } else {
      setCreatePlanForm({
        ...createPlanForm,
        [name]: value
      });
    }
  };

  const handleItemCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, itemId: string) => {
    const { checked } = e.target;
    if (checked) {
      setCreatePlanForm({
        ...createPlanForm,
        selected_item_ids: [...createPlanForm.selected_item_ids, itemId]
      });
    } else {
      setCreatePlanForm({
        ...createPlanForm,
        selected_item_ids: createPlanForm.selected_item_ids.filter(id => id !== itemId)
      });
    }
  };

  const handleSelectAllItems = () => {
    setCreatePlanForm({
      ...createPlanForm,
      selected_item_ids: items.map(item => item.id)
    });
  };

  const handleDeselectAllItems = () => {
    setCreatePlanForm({
      ...createPlanForm,
      selected_item_ids: []
    });
  };

  // Filter plans by search term
  const filteredPlans = stowagePlans.filter(plan => {
    const containerName = containers.find(c => c.id === plan.container_id)?.name || '';
    return containerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           plan.id.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getItemsCountInPlan = (plan: typeof stowagePlans[0]) => {
    return plan.item_placements.length;
  };

  const getContainerName = (containerId: string) => {
    return containers.find(c => c.id === containerId)?.name || 'Unknown Container';
  };

  const getItemName = (itemId: string) => {
    return items.find(i => i.id === itemId)?.name || 'Unknown Item';
  };

  const getVolumeUtilization = (plan: typeof stowagePlans[0]) => {
    const container = containers.find(c => c.id === plan.container_id);
    if (!container) return 0;
    
    const containerVolume = container.length * container.width * container.height;
    const itemsVolume = plan.item_placements.reduce((total, placement) => {
      const item = items.find(i => i.id === placement.item_id);
      if (!item) return total;
      return total + (item.length * item.width * item.height);
    }, 0);
    
    return (itemsVolume / containerVolume) * 100;
  };

  const formatScore = (score: number) => {
    return score.toFixed(2);
  };

  const createModalFooter = (
    <>
      <Button 
        variant="outline" 
        onClick={() => setIsCreateModalOpen(false)}
      >
        Cancel
      </Button>
      <Button 
        variant="primary" 
        type="submit"
        disabled={optimizationStatus === 'loading' || createPlanForm.selected_item_ids.length === 0}
      >
        {optimizationStatus === 'loading' ? 'Optimizing...' : 'Create & Optimize'}
      </Button>
    </>
  );

  const viewModalFooter = (
    <Button 
      variant="primary" 
      onClick={() => setIsViewModalOpen(false)}
    >
      Close
    </Button>
  );

  if (loading && stowagePlans.length === 0) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading stowage plans...</p>
      </div>
    );
  }

  return (
    <div className="stowage-plans-page">
      <div className="stowage-plans-header">
        <h1>Stowage Plans</h1>
        <div className="stowage-plans-actions">
          <SearchInput
            placeholder="Search plans..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
          <Button 
            variant="primary" 
            onClick={handleCreateClick}
          >
            Create New Plan
          </Button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      
      {optimizationStatus === 'loading' && (
        <div className="optimization-status">
          <div className="spinner"></div>
          <p>Optimizing stowage plan... This may take a moment.</p>
        </div>
      )}

      <div className="stowage-plans-grid">
        {filteredPlans.length === 0 ? (
          <div className="empty-plans-message">
            {searchTerm 
              ? 'No stowage plans match your search.' 
              : 'No stowage plans available. Create your first plan!'}
          </div>
        ) : (
          filteredPlans.map(plan => {
            const cardFooter = (
              <div className="plan-card-actions">
                <Button 
                  variant="primary" 
                  size="small"
                  onClick={() => handleViewClick(plan)}
                >
                  View in 3D
                </Button>
                <Button 
                  variant="danger" 
                  size="small"
                  onClick={() => handleDelete(plan.id)}
                >
                  Delete
                </Button>
                <div className="plan-date">
                  Created: {new Date(plan.created_at).toLocaleDateString()}
                </div>
              </div>
            );

            return (
              <Card
                key={plan.id}
                title={getContainerName(plan.container_id)}
                subtitle={`ID: ${plan.id.substring(0, 8)}...`}
                footer={cardFooter}
                hoverable
                className="stowage-plan-card"
              >
                <div className="plan-metrics">
                  <div className="metric">
                    <span className="metric-label">Items</span>
                    <span className="metric-value">{getItemsCountInPlan(plan)}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Space Used</span>
                    <span className="metric-value">{getVolumeUtilization(plan).toFixed(1)}%</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Overall Score</span>
                    <span className="metric-value">{formatScore(plan.score)}</span>
                  </div>
                </div>
                
                <div className="plan-scores">
                  <div className="score-item">
                    <span className="score-label">Volume</span>
                    <span className="score-value">{formatScore(plan.volume_score)}</span>
                  </div>
                  <div className="score-item">
                    <span className="score-label">Weight</span>
                    <span className="score-value">{formatScore(plan.weight_distribution_score)}</span>
                  </div>
                  <div className="score-item">
                    <span className="score-label">Priority</span>
                    <span className="score-value">{formatScore(plan.priority_score)}</span>
                  </div>
                  <div className="score-item">
                    <span className="score-label">Stability</span>
                    <span className="score-value">{formatScore(plan.stability_score)}</span>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Create Plan Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Stowage Plan"
        footer={createModalFooter}
      >
        <form onSubmit={handleCreateSubmit} className="create-plan-form">
          <FormGroup id="container_id" label="Select Container" required>
            <select
              id="container_id"
              name="container_id"
              value={createPlanForm.container_id}
              onChange={handleFormChange}
              required
            >
              <option value="">-- Select a container --</option>
              {containers.map(container => (
                <option key={container.id} value={container.id}>
                  {container.name} ({container.length}×{container.width}×{container.height}m)
                </option>
              ))}
            </select>
          </FormGroup>
          
          <FormGroup id="time_constraint" label="Time Constraint (seconds)">
            <input
              type="number"
              id="time_constraint"
              name="time_constraint"
              min="0.5"
              step="0.5"
              max="10"
              value={createPlanForm.time_constraint}
              onChange={handleFormChange}
              required
            />
            <span className="input-help">
              Longer time allows for better optimization but takes longer to compute.
            </span>
          </FormGroup>
          
          <div className="form-group items-selection">
            <div className="items-selection-header">
              <label>Select Items to Include</label>
              <div className="select-actions">
                <Button 
                  variant="text" 
                  size="small"
                  onClick={handleSelectAllItems}
                >
                  Select All
                </Button>
                <Button 
                  variant="text" 
                  size="small"
                  onClick={handleDeselectAllItems}
                >
                  Deselect All
                </Button>
              </div>
            </div>
            
            <div className="items-selection-list">
              {items.length === 0 ? (
                <div className="no-items-message">
                  No items available. <Link to="/items">Add items first</Link>.
                </div>
              ) : (
                items.map(item => (
                  <div key={item.id} className="item-checkbox">
                    <label>
                      <input
                        type="checkbox"
                        checked={createPlanForm.selected_item_ids.includes(item.id)}
                        onChange={(e) => handleItemCheckboxChange(e, item.id)}
                      />
                      <span className="item-name">{item.name}</span>
                      <span className="item-dimensions">
                        {item.length}×{item.width}×{item.height}m, {item.weight}kg
                      </span>
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>
        </form>
      </Modal>

      {/* View Plan Modal */}
      <Modal
        isOpen={isViewModalOpen && selectedPlan !== null}
        onClose={() => setIsViewModalOpen(false)}
        title={selectedPlan ? `3D Visualization: ${getContainerName(selectedPlan.container_id)}` : ''}
        footer={viewModalFooter}
        maxWidth="90%"
      >
        {selectedPlan && (
          <>
            <div className="visualization-container">
              <ContainerVisualization 
                container={containers.find(c => c.id === selectedPlan.container_id)!}
                items={selectedPlan.item_placements.map(placement => {
                  const item = items.find(i => i.id === placement.item_id);
                  if (!item) return null;
                  return {
                    ...item,
                    position: {
                      x: placement.position_x,
                      y: placement.position_y,
                      z: placement.position_z
                    },
                    rotation: {
                      x: placement.rotation_x ? 1 : 0,
                      y: placement.rotation_y ? 1 : 0,
                      z: placement.rotation_z ? 1 : 0
                    }
                  };
                }).filter(Boolean) as any[]}
              />
            </div>
            <div className="plan-details">
              <div className="plan-items-list">
                <h3>Items in this plan ({selectedPlan.item_placements.length})</h3>
                <div className="items-table-wrapper">
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th>Item Name</th>
                        <th>Position</th>
                        <th>Rotated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPlan.item_placements.map((placement) => {
                        const item = items.find(i => i.id === placement.item_id);
                        return (
                          <tr key={placement.item_id}>
                            <td>{getItemName(placement.item_id)}</td>
                            <td>
                              ({placement.position_x.toFixed(2)}, 
                              {placement.position_y.toFixed(2)}, 
                              {placement.position_z.toFixed(2)})
                            </td>
                            <td>
                              {placement.rotation_x || placement.rotation_y || placement.rotation_z ? 'Yes' : 'No'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default StowagePlans; 