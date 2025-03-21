import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchItems, addItem, updateItem, deleteItem } from '../store/itemsSlice';
import { fetchContainers } from '../store/containersSlice';
import { AppDispatch, RootState } from '../store';
import Modal from '../components/Modal';
import FormGroup from '../components/FormGroup';
import Button from '../components/Button';
import SearchInput from '../components/SearchInput';
import './Items.css';

interface ItemFormData {
  id?: string;
  name: string;
  length: number;
  width: number;
  height: number;
  weight: number;
  expiry_date?: string | null;
  fragile: boolean;
  stackable: boolean;
  rotation_allowed: boolean;
  hazardous: boolean;
  value: number;
  priority: number;
}

const Items: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items, loading, error } = useSelector((state: RootState) => state.items);
  const { containers } = useSelector((state: RootState) => state.containers);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<ItemFormData | null>(null);
  const [formData, setFormData] = useState<ItemFormData>({
    name: '',
    length: 0,
    width: 0,
    height: 0,
    weight: 0,
    expiry_date: null,
    fragile: false,
    stackable: true,
    rotation_allowed: true,
    hazardous: false,
    value: 0,
    priority: 1
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterOptions, setFilterOptions] = useState({
    fragile: false,
    hazardous: false,
    expiryDate: false
  });

  useEffect(() => {
    dispatch(fetchItems());
    dispatch(fetchContainers());
  }, [dispatch]);

  const resetForm = () => {
    setFormData({
      name: '',
      length: 0,
      width: 0,
      height: 0,
      weight: 0,
      expiry_date: null,
      fragile: false,
      stackable: true,
      rotation_allowed: true,
      hazardous: false,
      value: 0,
      priority: 1
    });
    setCurrentItem(null);
  };

  const handleOpenModal = (item?: typeof items[0]) => {
    if (item) {
      setCurrentItem(item);
      setFormData({
        id: item.id,
        name: item.name,
        length: item.length,
        width: item.width,
        height: item.height,
        weight: item.weight,
        expiry_date: item.expiry_date,
        fragile: item.fragile,
        stackable: item.stackable,
        rotation_allowed: item.rotation_allowed,
        hazardous: item.hazardous,
        value: item.value,
        priority: item.priority
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    let parsedValue: string | number | boolean | null = value;
    
    if (type === 'checkbox') {
      parsedValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      parsedValue = parseFloat(value) || 0;
    } else if (name === 'expiry_date' && value === '') {
      parsedValue = null;
    }
    
    setFormData({
      ...formData,
      [name]: parsedValue
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (currentItem) {
        await dispatch(updateItem(formData)).unwrap();
      } else {
        await dispatch(addItem(formData)).unwrap();
      }
      handleCloseModal();
    } catch (err) {
      console.error('Failed to save item:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await dispatch(deleteItem(id)).unwrap();
      } catch (err) {
        console.error('Failed to delete item:', err);
      }
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFilterOptions({
      ...filterOptions,
      [name]: checked
    });
  };

  // Filter and sort items
  const filteredItems = items
    .filter(item => {
      // Text search
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter options
      const matchesFragile = !filterOptions.fragile || item.fragile;
      const matchesHazardous = !filterOptions.hazardous || item.hazardous;
      const matchesExpiry = !filterOptions.expiryDate || 
        (item.expiry_date && new Date(item.expiry_date) > new Date());
      
      return matchesSearch && matchesFragile && matchesHazardous && matchesExpiry;
    })
    .sort((a, b) => {
      const fieldA = a[sortField as keyof typeof a];
      const fieldB = b[sortField as keyof typeof b];
      
      if (fieldA < fieldB) return sortDirection === 'asc' ? -1 : 1;
      if (fieldA > fieldB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  // Calculate volume
  const calculateVolume = (item: typeof items[0]) => {
    return item.length * item.width * item.height;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const isExpiringSoon = (dateString: string | null) => {
    if (!dateString) return false;
    const today = new Date();
    const expiryDate = new Date(dateString);
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30;
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  if (loading && items.length === 0) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading items...</p>
      </div>
    );
  }

  return (
    <div className="items-page">
      <div className="items-header">
        <h1>Item Management</h1>
        <div className="items-actions">
          <SearchInput
            placeholder="Search items..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
          <Button 
            variant="primary" 
            onClick={() => handleOpenModal()}
          >
            Add Item
          </Button>
        </div>
      </div>

      <div className="filters-container">
        <div className="filter-group">
          <label>
            <input
              type="checkbox"
              name="fragile"
              checked={filterOptions.fragile}
              onChange={handleFilterChange}
            />
            Fragile Items
          </label>
        </div>
        <div className="filter-group">
          <label>
            <input
              type="checkbox"
              name="hazardous"
              checked={filterOptions.hazardous}
              onChange={handleFilterChange}
            />
            Hazardous Items
          </label>
        </div>
        <div className="filter-group">
          <label>
            <input
              type="checkbox"
              name="expiryDate"
              checked={filterOptions.expiryDate}
              onChange={handleFilterChange}
            />
            Has Expiry Date
          </label>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="items-table-wrapper">
        <table className="items-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('name')}>
                Name {getSortIcon('name')}
              </th>
              <th onClick={() => handleSort('length')}>
                Dimensions (m) {getSortIcon('length')}
              </th>
              <th>Volume (m³)</th>
              <th onClick={() => handleSort('weight')}>
                Weight (kg) {getSortIcon('weight')}
              </th>
              <th onClick={() => handleSort('priority')}>
                Priority {getSortIcon('priority')}
              </th>
              <th>Properties</th>
              <th onClick={() => handleSort('expiry_date')}>
                Expiry Date {getSortIcon('expiry_date')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-message">
                  {searchTerm || filterOptions.fragile || filterOptions.hazardous || filterOptions.expiryDate
                    ? 'No items match your search criteria.'
                    : 'No items available. Add your first item!'}
                </td>
              </tr>
            ) : (
              filteredItems.map(item => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{`${item.length}×${item.width}×${item.height}`}</td>
                  <td>{calculateVolume(item).toFixed(2)}</td>
                  <td>{item.weight}</td>
                  <td>
                    <span className={`priority-badge priority-${item.priority}`}>
                      {item.priority}
                    </span>
                  </td>
                  <td>
                    <div className="item-properties">
                      {item.fragile && <span className="property fragile">Fragile</span>}
                      {item.hazardous && <span className="property hazardous">Hazardous</span>}
                      {item.stackable && <span className="property stackable">Stackable</span>}
                      {item.rotation_allowed && <span className="property rotation">Rotation OK</span>}
                    </div>
                  </td>
                  <td className={isExpiringSoon(item.expiry_date) ? 'expiring-soon' : ''}>
                    {formatDate(item.expiry_date)}
                  </td>
                  <td className="action-buttons">
                    <button 
                      onClick={() => handleOpenModal(item)} 
                      className="edit-button"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)} 
                      className="delete-button"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>{currentItem ? 'Edit Item' : 'Add Item'}</h2>
              <button className="close-button" onClick={handleCloseModal}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="item-form">
              <div className="form-group">
                <label htmlFor="name">Item Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-section">
                <h3>Dimensions & Weight</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="length">Length (m)</label>
                    <input
                      type="number"
                      id="length"
                      name="length"
                      min="0"
                      step="0.01"
                      value={formData.length}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="width">Width (m)</label>
                    <input
                      type="number"
                      id="width"
                      name="width"
                      min="0"
                      step="0.01"
                      value={formData.width}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="height">Height (m)</label>
                    <input
                      type="number"
                      id="height"
                      name="height"
                      min="0"
                      step="0.01"
                      value={formData.height}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="weight">Weight (kg)</label>
                    <input
                      type="number"
                      id="weight"
                      name="weight"
                      min="0"
                      step="0.01"
                      value={formData.weight}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="form-section">
                <h3>Properties & Constraints</h3>
                <div className="form-row checkboxes">
                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        name="fragile"
                        checked={formData.fragile}
                        onChange={handleInputChange}
                      />
                      Fragile
                    </label>
                  </div>
                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        name="stackable"
                        checked={formData.stackable}
                        onChange={handleInputChange}
                      />
                      Stackable
                    </label>
                  </div>
                </div>
                <div className="form-row checkboxes">
                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        name="rotation_allowed"
                        checked={formData.rotation_allowed}
                        onChange={handleInputChange}
                      />
                      Rotation Allowed
                    </label>
                  </div>
                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        name="hazardous"
                        checked={formData.hazardous}
                        onChange={handleInputChange}
                      />
                      Hazardous
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="form-section">
                <h3>Additional Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="expiry_date">Expiry Date (if applicable)</label>
                    <input
                      type="date"
                      id="expiry_date"
                      name="expiry_date"
                      value={formData.expiry_date || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="value">Value ($)</label>
                    <input
                      type="number"
                      id="value"
                      name="value"
                      min="0"
                      step="0.01"
                      value={formData.value}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="priority">Priority (1-5, higher is more important)</label>
                  <input
                    type="number"
                    id="priority"
                    name="priority"
                    min="1"
                    max="5"
                    step="1"
                    value={formData.priority}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" onClick={handleCloseModal} className="cancel-button">
                  Cancel
                </button>
                <button type="submit" className="save-button">
                  {currentItem ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Items; 