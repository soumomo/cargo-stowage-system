import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import Card from './Card';
import FormGroup from './FormGroup';
import SearchInput from './SearchInput';

const SampleComponent: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    setIsModalOpen(false);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    console.log('Searching for:', value);
  };

  const modalFooter = (
    <>
      <Button variant="outline" onClick={() => setIsModalOpen(false)}>
        Cancel
      </Button>
      <Button variant="primary" type="submit">
        Submit
      </Button>
    </>
  );

  const cardFooter = (
    <Button variant="text" size="small">
      Read More
    </Button>
  );

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Component Showcase</h1>

      <section style={{ marginBottom: '40px' }}>
        <h2>Search Input</h2>
        <SearchInput
          placeholder="Search..."
          value={searchTerm}
          onChange={handleSearchChange}
          autoFocus
        />
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2>Buttons</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="danger">Danger Button</Button>
          <Button variant="text">Text Button</Button>
          <Button variant="primary" size="small">Small Button</Button>
          <Button variant="primary" size="large">Large Button</Button>
          <Button variant="primary" isLoading>Loading Button</Button>
          <Button variant="primary" disabled>Disabled Button</Button>
          <Button variant="primary" fullWidth>Full Width Button</Button>
        </div>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2>Cards</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          <Card title="Simple Card" subtitle="With subtitle">
            <p>This is a simple card with title and subtitle.</p>
          </Card>
          
          <Card title="Card with Footer" footer={cardFooter}>
            <p>This card has a footer with a button.</p>
          </Card>
          
          <Card title="Hoverable Card" hoverable>
            <p>This card has a hover effect. Try hovering over it!</p>
          </Card>
          
          <Card
            title="Clickable Card"
            hoverable
            onClick={() => alert('Card clicked!')}
          >
            <p>This card is clickable. Click me!</p>
          </Card>
        </div>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2>Form Groups</h2>
        <form style={{ maxWidth: '500px' }}>
          <FormGroup id="name" label="Name" required>
            <input type="text" id="name" name="name" />
          </FormGroup>
          
          <FormGroup id="email" label="Email" error="Please enter a valid email">
            <input type="email" id="email" name="email" />
          </FormGroup>
          
          <FormGroup id="message" label="Message">
            <textarea id="message" name="message" rows={4}></textarea>
          </FormGroup>
          
          <Button variant="primary" type="submit">
            Submit Form
          </Button>
        </form>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2>Modal</h2>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          Open Modal
        </Button>
        
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Sample Form"
          footer={modalFooter}
        >
          <form onSubmit={handleSubmit}>
            <FormGroup id="modal-name" label="Name" required>
              <input
                type="text"
                id="modal-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </FormGroup>
            
            <FormGroup id="modal-email" label="Email" required>
              <input
                type="email"
                id="modal-email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </FormGroup>
            
            <FormGroup id="modal-message" label="Message">
              <textarea
                id="modal-message"
                name="message"
                rows={4}
                value={formData.message}
                onChange={handleInputChange}
              ></textarea>
            </FormGroup>
          </form>
        </Modal>
      </section>
    </div>
  );
};

export default SampleComponent; 