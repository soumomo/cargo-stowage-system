import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { RootState } from '../store';
import { fetchContainers } from '../store/containersSlice';
import { fetchItems } from '../store/itemsSlice';
import { fetchStowagePlans } from '../store/stowagePlansSlice';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const dispatch = useDispatch();
  const { containers, loading: containersLoading } = useSelector((state: RootState) => state.containers);
  const { items, loading: itemsLoading } = useSelector((state: RootState) => state.items);
  const { plans, loading: plansLoading } = useSelector((state: RootState) => state.stowagePlans);

  useEffect(() => {
    dispatch(fetchContainers());
    dispatch(fetchItems());
    dispatch(fetchStowagePlans());
  }, [dispatch]);

  const isLoading = containersLoading || itemsLoading || plansLoading;

  // Calculate statistics
  const totalContainerVolume = containers.reduce((sum, container) => {
    return sum + (container.width * container.height * container.depth);
  }, 0);

  const totalItemVolume = items.reduce((sum, item) => {
    return sum + (item.width * item.height * item.depth);
  }, 0);

  const spaceUtilization = totalContainerVolume > 0 
    ? (totalItemVolume / totalContainerVolume) * 100 
    : 0;

  const upcomingExpiryItems = items
    .filter(item => item.expiry_date)
    .sort((a, b) => {
      if (!a.expiry_date || !b.expiry_date) return 0;
      return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
    })
    .slice(0, 5);

  const bestPlan = plans.length > 0 
    ? plans.sort((a, b) => b.overall_score - a.overall_score)[0]
    : null;

  return (
    <div className="dashboard-page">
      <h1 className="page-title">Dashboard</h1>
      
      {isLoading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading data...</p>
        </div>
      ) : (
        <div className="dashboard-content">
          <div className="dashboard-stats">
            <div className="stat-card">
              <h3 className="stat-title">Containers</h3>
              <p className="stat-value">{containers.length}</p>
              <Link to="/containers" className="stat-link">View all containers</Link>
            </div>
            
            <div className="stat-card">
              <h3 className="stat-title">Items</h3>
              <p className="stat-value">{items.length}</p>
              <Link to="/items" className="stat-link">View all items</Link>
            </div>
            
            <div className="stat-card">
              <h3 className="stat-title">Stowage Plans</h3>
              <p className="stat-value">{plans.length}</p>
              <Link to="/stowage-plans" className="stat-link">View all plans</Link>
            </div>
            
            <div className="stat-card">
              <h3 className="stat-title">Space Utilization</h3>
              <p className="stat-value">{spaceUtilization.toFixed(1)}%</p>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${Math.min(spaceUtilization, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="dashboard-sections">
            <div className="dashboard-section">
              <h2 className="section-title">Items Expiring Soon</h2>
              {upcomingExpiryItems.length > 0 ? (
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Expiry Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingExpiryItems.map(item => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.category}</td>
                        <td>
                          {item.expiry_date 
                            ? new Date(item.expiry_date).toLocaleDateString() 
                            : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="empty-state">No items with expiry dates found.</p>
              )}
            </div>
            
            <div className="dashboard-section">
              <h2 className="section-title">Best Stowage Plan</h2>
              {bestPlan ? (
                <div className="best-plan-card">
                  <h3>{bestPlan.name}</h3>
                  <p className="plan-description">{bestPlan.description}</p>
                  
                  <div className="plan-scores">
                    <div className="score-item">
                      <span className="score-label">Space Efficiency</span>
                      <span className="score-value">{bestPlan.space_efficiency_score.toFixed(1)}</span>
                    </div>
                    <div className="score-item">
                      <span className="score-label">Accessibility</span>
                      <span className="score-value">{bestPlan.accessibility_score.toFixed(1)}</span>
                    </div>
                    <div className="score-item">
                      <span className="score-label">Retrieval Time</span>
                      <span className="score-value">{bestPlan.retrieval_time_score.toFixed(1)}</span>
                    </div>
                    <div className="score-item overall">
                      <span className="score-label">Overall Score</span>
                      <span className="score-value">{bestPlan.overall_score.toFixed(1)}</span>
                    </div>
                  </div>
                  
                  <Link to={`/visualization/${bestPlan.id}`} className="view-plan-button">
                    View Plan in 3D
                  </Link>
                </div>
              ) : (
                <p className="empty-state">No stowage plans available.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 