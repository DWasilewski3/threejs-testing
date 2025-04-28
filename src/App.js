import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import BusinessCard from './components/BusinessCard';
import ControlPanel from './components/ControlPanel';

const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: #1a1a1a;
`;

const CanvasContainer = styled.div`
  flex: 1;
  position: relative;
  background-color: #000000;
`;

const SidePanel = styled.div`
  width: 300px;
  padding: 20px;
  background: #2a2a2a;
  border-left: 1px solid #333;
  overflow-y: auto;
  color: #ffffff;
`;

const TextControls = styled.div`
  margin-top: 20px;
  padding: 15px;
  background: #333333;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
`;

const TextInput = styled.input`
  width: 100%;
  padding: 8px;
  margin-top: 5px;
  background: #444444;
  border: 1px solid #666666;
  border-radius: 4px;
  color: #ffffff;
  
  &:focus {
    outline: none;
    border-color: #888888;
  }
`;

function App() {
  console.log('=== App Component Render ===');
  
  const [svgContent, setSvgContent] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [customizations, setCustomizations] = useState({});
  const [textElements, setTextElements] = useState([]);
  const [textInput, setTextInput] = useState('');
  const fileInputRef = useRef();

  useEffect(() => {
    console.log('=== App State Update ===');
    console.log('Current state:', {
      hasSvgContent: !!svgContent,
      selectedElement: selectedElement?.id,
      customizationsCount: Object.keys(customizations).length,
      textElementsCount: textElements.length,
      textInput
    });
  }, [svgContent, selectedElement, customizations, textElements, textInput]);

  const handleFileUpload = (event) => {
    console.log('=== File Upload Start ===');
    const file = event.target.files[0];
    console.log('File selected:', {
      name: file?.name,
      type: file?.type,
      size: file?.size
    });

    if (file && file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (e) => {
        console.log('SVG file loaded successfully');
        console.log('SVG content length:', e.target.result.length);
        setSvgContent(e.target.result);
      };
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
      };
      reader.readAsText(file);
    } else {
      console.log('Invalid file type:', file?.type);
      alert('Please upload a valid SVG file');
    }
  };

  const handleCustomize = (elementId, property, value) => {
    console.log('=== Customization Update ===');
    console.log('Customizing:', {
      elementId,
      property,
      value
    });

    setCustomizations(prev => {
      const newCustomizations = {
        ...prev,
        [elementId]: {
          ...prev[elementId],
          [property]: value
        }
      };
      console.log('New customizations:', newCustomizations);
      return newCustomizations;
    });
  };

  const handleAddText = () => {
    console.log('=== Adding Text ===');
    console.log('Current text input:', textInput);

    if (textInput.trim()) {
      const newTextElement = {
        id: Date.now(),
        text: textInput.trim(),
        position: [0, 0, 0],
        color: '#000000',
        fontSize: 0.2,
        rotation: [0, 0, 0]
      };

      console.log('New text element:', newTextElement);

      setTextElements(prev => {
        const newElements = [...prev, newTextElement];
        console.log('Updated text elements:', newElements);
        return newElements;
      });
      setTextInput('');
    }
  };

  console.log('=== Rendering App ===');
  return (
    <AppContainer>
      <CanvasContainer>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 75 }}
          style={{ background: '#000000' }}
        >
          <color attach="background" args={['#000000']} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />
          <BusinessCard
            svgContent={svgContent}
            customizations={customizations}
            textElements={textElements}
            onElementSelect={setSelectedElement}
          />
          <OrbitControls enableDamping dampingFactor={0.05} />
        </Canvas>
      </CanvasContainer>
      <SidePanel>
        <h2>Business Card Customizer</h2>
        <input
          type="file"
          accept=".svg"
          onChange={handleFileUpload}
          ref={fileInputRef}
          style={{ display: 'none' }}
        />
        <button onClick={() => fileInputRef.current.click()}>
          Upload SVG
        </button>

        <TextControls>
          <h3>Add Text</h3>
          <TextInput
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Enter text to add"
          />
          <button onClick={handleAddText} style={{ marginTop: '10px' }}>
            Add Text
          </button>
        </TextControls>

        {selectedElement && (
          <ControlPanel
            element={selectedElement}
            customizations={customizations[selectedElement.id]}
            onCustomize={handleCustomize}
          />
        )}
      </SidePanel>
    </AppContainer>
  );
}

export default App; 