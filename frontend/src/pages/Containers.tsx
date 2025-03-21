import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchContainers, addContainer, updateContainer, deleteContainer } from '../store/containersSlice';
import { AppDispatch, RootState } from '../store';
import Modal from '../components/Modal';
import FormGroup from '../components/FormGroup';
import Button from '../components/Button';
import SearchInput from '../components/SearchInput';
import './Containers.css';

interface ContainerFormData {
  id?: string;
  name: string;
  length: number;
  width: number;
  height: number;
  max_weight: number;
}

const Containers: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { containers, loading, error } = useSelector((state: RootState) => state.containers);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentContainer, setCurrentContainer] = useState<ContainerFormData | null>(null);
  const [formData, setFormData] = useState<ContainerFormData>({
    name: '',
    length: 0,
    width: 0,
    height: 0,
    max_weight: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    dispatch(fetchContainers());
  }, [dispatch]);

  const resetForm = () => {
    setFormData({
      name: '',
      length: 0,
      width: 0,
      height: 0,
      max_weight: 0
    });
    setCurrentContainer(null);
  };

  const handleOpenModal = (container?: typeof containers[0]) => {
    if (container) {
      setCurrentContainer(container);
      setFormData({
        id: container.id,
        name: container.name,
        length: container.length,
        width: container.width,
        height: container.height,
        max_weight: container.max_weight
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let parsedValue: string | number = value;
    
    // Convert numeric fields to numbers
    if (name !== 'name' && name !== 'id') {
      parsedValue = parseFloat(value) || 0;
    }
    
    setFormData({
      ...formData,
      [name]: parsedValue
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (currentContainer) {
        await dispatch(updateContainer(formData)).unwrap();
      } else {
        await dispatch(addContainer(formData)).unwrap();
      }
      handleCloseModal();
    } catch (err) {
      console.error('Failed to save container:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this container?')) {
      try {
        await dispatch(deleteContainer(id)).unwrap();
      } catch (err) {
        console.error('Failed to delete container:', err);
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

  // Filter and sort containers
  const filteredContainers = containers
    .filter(container => 
      container.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const fieldA = a[sortField as keyof typeof a];
      const fieldB = b[sortField as keyof typeof b];
      
      if (fieldA < fieldB) return sortDirection === 'asc' ? -1 : 1;
      if (fieldA > fieldB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  // Calculate volume
  const calculateVolume = (container: typeof containers[0]) => {
    return container.length * container.width * container.height;
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  if (loading && containers.length === 0) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading containers...</p>
      </div>
    );
  }

  const modalFooter = (
    <>
      <Button 
        variant="outline" 
        onClick={handleCloseModal}
      >
        Cancel
      </Button>
      <Button 
        variant="primary" 
        type="submit"
      >
        {currentContainer ? 'Save Changes' : 'Add Container'}
      </Button>
    </>
  );

  return (
    <div className="containers-page">
      <div className="containers-header">
        <h1>Container Management</h1>
        <div className="containers-actions">
          <SearchInput
            placeholder="Search containers..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
          <Button 
            variant="primary" 
            onClick={() => handleOpenModal()}
          >
            Add Container
          </Button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="containers-table-wrapper">
        <table className="containers-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('name')}>
                Name {getSortIcon('name')}
              </th>
              <th onClick={() => handleSort('length')}>
                Length (m) {getSortIcon('length')}
              </th>
              <th onClick={() => handleSort('width')}>
                Width (m) {getSortIcon('width')}
              </th>
              <th onClick={() => handleSort('height')}>
                Height (m) {getSortIcon('height')}
              </th>
              <th>Volume (m³)</th>
              <th onClick={() => handleSort('max_weight')}>
                Max Weight (kg) {getSortIcon('max_weight')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredContainers.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-message">
                  {searchTerm ? 'No containers match your search.' : 'No containers available. Add your first container!'}
                </td>
              </tr>
            ) : (
              filteredContainers.map(container => (
                <tr key={container.id}>
                  <td>{container.name}</td>
                  <td>{container.length}</td>
                  <td>{container.width}</td>
                  <td>{container.height}</td>
                  <td>{calculateVolume(container).toFixed(2)}</td>
                  <td>{container.max_weight}</td>
                  <td className="action-buttons">
                    <Button 
                      variant="outline" 
                      size="small"
                      onClick={() => handleOpenModal(container)}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="danger" 
                      size="small"
                      onClick={() => handleDelete(container.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={currentContainer ? 'Edit Container' : 'Add Container'}
        footer={modalFooter}
      >
        <form onSubmit={handleSubmit} className="container-form">
          <FormGroup id="name" label="Container Name" required>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </FormGroup>
          <div className="form-row">
            <FormGroup id="length" label="Length (m)" required>
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
            </FormGroup>
            <FormGroup id="width" label="Width (m)" required>
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
            </FormGroup>
          </div>
          <div className="form-row">
            <FormGroup id="height" label="Height (m)" required>
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
            </FormGroup>
            <FormGroup id="max_weight" label="Max Weight (kg)" required>
              <input
                type="number"
                id="max_weight"
                name="max_weight"
                min="0"
                step="0.01"
                value={formData.max_weight}
                onChange={handleInputChange}
                required
              />
            </FormGroup>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Containers;