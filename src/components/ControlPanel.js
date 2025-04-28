import React, { useState } from 'react';
import styled from 'styled-components';
import { ChromePicker } from 'react-color';

const PanelContainer = styled.div`
  margin-top: 20px;
  padding: 15px;
  background: #333333;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  color: #ffffff;
`;

const ControlGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #ffffff;
`;

const Slider = styled.input`
  width: 100%;
  background: #444444;
  
  &::-webkit-slider-thumb {
    background: #666666;
  }
  
  &::-moz-range-thumb {
    background: #666666;
  }
`;

const ColorPickerContainer = styled.div`
  position: relative;
  margin-top: 10px;
`;

const ColorPreview = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 4px;
  border: 1px solid #444444;
  cursor: pointer;
`;

const ColorPickerWrapper = styled.div`
  position: absolute;
  z-index: 100;
  top: 40px;
  left: 0;
`;

const ControlPanel = ({ element, customizations = {}, onCustomize }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const { color = '#ffffff', scale = 1, position = [0, 0, 0] } = customizations;

  const handleColorChange = (color) => {
    onCustomize(element.id, 'color', color.hex);
  };

  const handleScaleChange = (e) => {
    onCustomize(element.id, 'scale', parseFloat(e.target.value));
  };

  const handlePositionChange = (axis, value) => {
    const newPosition = [...position];
    newPosition[axis] = parseFloat(value);
    onCustomize(element.id, 'position', newPosition);
  };

  return (
    <PanelContainer>
      <h3>Customize Element</h3>
      
      <ControlGroup>
        <Label>Color</Label>
        <ColorPickerContainer>
          <ColorPreview
            style={{ backgroundColor: color }}
            onClick={() => setShowColorPicker(!showColorPicker)}
          />
          {showColorPicker && (
            <ColorPickerWrapper>
              <ChromePicker
                color={color}
                onChange={handleColorChange}
              />
            </ColorPickerWrapper>
          )}
        </ColorPickerContainer>
      </ControlGroup>

      <ControlGroup>
        <Label>Scale</Label>
        <Slider
          type="range"
          min="0.1"
          max="2"
          step="0.1"
          value={scale}
          onChange={handleScaleChange}
        />
      </ControlGroup>

      <ControlGroup>
        <Label>Position</Label>
        <div>
          <Label>X</Label>
          <Slider
            type="range"
            min="-1"
            max="1"
            step="0.01"
            value={position[0]}
            onChange={(e) => handlePositionChange(0, e.target.value)}
          />
          <Label>Y</Label>
          <Slider
            type="range"
            min="-1"
            max="1"
            step="0.01"
            value={position[1]}
            onChange={(e) => handlePositionChange(1, e.target.value)}
          />
        </div>
      </ControlGroup>
    </PanelContainer>
  );
};

export default ControlPanel; 