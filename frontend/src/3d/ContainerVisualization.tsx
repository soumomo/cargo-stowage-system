import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Container } from '../store/containersSlice';
import { Item } from '../store/itemsSlice';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import './ContainerVisualization.css';

interface ContainerVisualizationProps {
  container: Container;
  items: Item[];
  onItemMove?: (itemId: number, position: { x: number; y: number; z: number }) => void;
  onItemRotate?: (itemId: number, rotation: { x: number; y: number; z: number }) => void;
  interactive?: boolean;
}

interface ItemMesh {
  id: number;
  mesh: THREE.Mesh;
}

const ContainerVisualization: React.FC<ContainerVisualizationProps> = ({
  container,
  items,
  onItemMove,
  onItemRotate,
  interactive = true,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const transformControlsRef = useRef<TransformControls | null>(null);
  const itemMeshesRef = useRef<ItemMesh[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x121212);
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(container.width * 2, container.height * 2, container.depth * 2);
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    if (interactive) {
      // Create transform controls for moving/rotating items
      const transformControls = new TransformControls(camera, renderer.domElement);
      transformControls.addEventListener('dragging-changed', (event) => {
        controls.enabled = !event.value;
      });
      transformControls.addEventListener('objectChange', () => {
        if (transformControls.object && selectedItemId !== null) {
          const position = transformControls.object.position;
          const rotation = transformControls.object.rotation;
          
          if (transformControls.mode === 'translate' && onItemMove) {
            onItemMove(selectedItemId, {
              x: position.x,
              y: position.y,
              z: position.z,
            });
          }
          
          if (transformControls.mode === 'rotate' && onItemRotate) {
            onItemRotate(selectedItemId, {
              x: rotation.x,
              y: rotation.y,
              z: rotation.z,
            });
          }
        }
      });
      scene.add(transformControls);
      transformControlsRef.current = transformControls;
    }

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 30, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Create grid helper
    const gridHelper = new THREE.GridHelper(Math.max(container.width, container.depth) * 3, 20);
    scene.add(gridHelper);

    // Create animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current || !renderer || !camera) return;
      
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [container.width, container.height, container.depth, interactive, onItemMove, onItemRotate, selectedItemId]);

  // Create container visualization
  useEffect(() => {
    if (!sceneRef.current) return;

    // Create container wireframe
    const containerGeometry = new THREE.BoxGeometry(
      container.width,
      container.height,
      container.depth
    );
    const edges = new THREE.EdgesGeometry(containerGeometry);
    const containerMesh = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0x1a73e8, linewidth: 2 })
    );
    
    // Position container so its bottom is at y=0 and center at x=0, z=0
    containerMesh.position.set(0, container.height / 2, 0);
    
    // Add to scene
    sceneRef.current.add(containerMesh);

    // Create container bottom surface
    const floorGeometry = new THREE.PlaneGeometry(container.width, container.depth);
    const floorMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x444444, 
      transparent: true, 
      opacity: 0.5,
      side: THREE.DoubleSide 
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = Math.PI / 2;
    floor.position.y = 0;
    sceneRef.current.add(floor);

    return () => {
      sceneRef.current?.remove(containerMesh);
      sceneRef.current?.remove(floor);
    };
  }, [container]);

  // Create item visualizations
  useEffect(() => {
    if (!sceneRef.current || !items.length) return;

    // Clear existing items
    itemMeshesRef.current.forEach(({ mesh }) => {
      sceneRef.current?.remove(mesh);
    });
    itemMeshesRef.current = [];

    // Create items
    const newItemMeshes: ItemMesh[] = items.map(item => {
      // Create item mesh
      const itemGeometry = new THREE.BoxGeometry(item.width, item.height, item.depth);
      
      // Generate a unique color based on item id
      const color = new THREE.Color().setHSL(
        (item.id * 0.1) % 1,
        0.75,
        0.5
      );
      
      const itemMaterial = new THREE.MeshStandardMaterial({ 
        color: color,
        transparent: true,
        opacity: 0.75
      });
      
      const itemMesh = new THREE.Mesh(itemGeometry, itemMaterial);
      
      // Position item
      itemMesh.position.set(
        item.position_x + item.width / 2,
        item.position_y + item.height / 2,
        item.position_z + item.depth / 2
      );
      
      // Set rotation
      itemMesh.rotation.set(
        item.rotation_x,
        item.rotation_y,
        item.rotation_z
      );
      
      // Make item castable
      itemMesh.castShadow = true;
      itemMesh.receiveShadow = true;
      
      // Add user data for raycasting
      itemMesh.userData = { itemId: item.id };
      
      // Add to scene
      sceneRef.current?.add(itemMesh);
      
      return { id: item.id, mesh: itemMesh };
    });
    
    itemMeshesRef.current = newItemMeshes;

    // If we have a selected item, attach transform controls to it
    if (selectedItemId !== null && transformControlsRef.current) {
      const selectedMesh = newItemMeshes.find(({ id }) => id === selectedItemId)?.mesh;
      if (selectedMesh) {
        transformControlsRef.current.attach(selectedMesh);
      }
    }

    return () => {
      newItemMeshes.forEach(({ mesh }) => {
        sceneRef.current?.remove(mesh);
      });
    };
  }, [items, selectedItemId]);

  // Handle item selection
  const handleMouseDown = (event: React.MouseEvent) => {
    if (!interactive || !mountRef.current || !cameraRef.current || !sceneRef.current) return;
    
    const rect = mountRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / mountRef.current.clientWidth) * 2 - 1,
      -((event.clientY - rect.top) / mountRef.current.clientHeight) * 2 + 1
    );
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);
    
    const intersects = raycaster.intersectObjects(
      itemMeshesRef.current.map(({ mesh }) => mesh),
      false
    );
    
    if (intersects.length > 0) {
      const selectedMesh = intersects[0].object as THREE.Mesh;
      const itemId = selectedMesh.userData.itemId;
      
      setSelectedItemId(itemId);
      
      if (transformControlsRef.current) {
        transformControlsRef.current.attach(selectedMesh);
      }
    } else {
      setSelectedItemId(null);
      
      if (transformControlsRef.current) {
        transformControlsRef.current.detach();
      }
    }
  };

  // Toggle transform control mode
  const toggleTransformMode = (mode: 'translate' | 'rotate') => {
    if (transformControlsRef.current) {
      transformControlsRef.current.setMode(mode);
    }
  };

  return (
    <div className="container-visualization">
      <div className="visualization-canvas" ref={mountRef} onMouseDown={handleMouseDown}>
        {/* Three.js canvas will be mounted here */}
      </div>
      
      {interactive && (
        <div className="visualization-controls">
          <button onClick={() => toggleTransformMode('translate')} className="control-button">
            Move
          </button>
          <button onClick={() => toggleTransformMode('rotate')} className="control-button">
            Rotate
          </button>
        </div>
      )}
    </div>
  );
};

export default ContainerVisualization; 