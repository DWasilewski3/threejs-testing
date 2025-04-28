import React, { useMemo, useEffect } from 'react';
import { useLoader } from '@react-three/fiber';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader';
import * as THREE from 'three';
import { Text } from '@react-three/drei';

const BusinessCard = ({ svgContent, customizations, onElementSelect, textElements }) => {
  console.log('=== BusinessCard Render Start ===');
  console.log('Props received:', {
    hasSvgContent: !!svgContent,
    svgContentLength: svgContent?.length,
    customizations: JSON.stringify(customizations),
    textElementsCount: textElements?.length,
    textElements: JSON.stringify(textElements)
  });

  const thickness = 0.01; // Card thickness in inches

  useEffect(() => {
    console.log('=== BusinessCard Effect ===');
    console.log('Current state:', {
      thickness,
      hasSvgContent: !!svgContent,
      textElementsCount: textElements?.length
    });
  }, [svgContent, textElements]);

  const svgData = useMemo(() => {
    console.log('=== SVG Data Calculation ===');
    if (!svgContent) {
      console.log('No SVG content provided');
      return { paths: [] };
    }
    
    try {
      console.log('Attempting to parse SVG content');
      const loader = new SVGLoader();
      const data = loader.parse(svgContent);
      console.log('SVG parsed successfully:', {
        pathCount: data.paths.length,
        firstPath: data.paths[0] ? 'exists' : 'none'
      });
      return data;
    } catch (error) {
      console.error('Error parsing SVG:', error);
      return { paths: [] };
    }
  }, [svgContent]);

  // Create a rounded card geometry
  const defaultCard = useMemo(() => {
    console.log('=== Creating Card Geometry ===');
    const width = 3.5;  // Standard business card width in inches
    const height = 2;   // Standard business card height in inches
    const radius = 0.2; // Corner radius

    // Create a rounded rectangle shape
    const shape = new THREE.Shape();
    shape.moveTo(-width/2 + radius, -height/2);
    shape.lineTo(width/2 - radius, -height/2);
    shape.quadraticCurveTo(width/2, -height/2, width/2, -height/2 + radius);
    shape.lineTo(width/2, height/2 - radius);
    shape.quadraticCurveTo(width/2, height/2, width/2 - radius, height/2);
    shape.lineTo(-width/2 + radius, height/2);
    shape.quadraticCurveTo(-width/2, height/2, -width/2, height/2 - radius);
    shape.lineTo(-width/2, -height/2 + radius);
    shape.quadraticCurveTo(-width/2, -height/2, -width/2 + radius, -height/2);

    // Extrude the shape to create the card
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: thickness,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01,
      bevelSegments: 3
    });

    // Create different materials for front and back
    const frontMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, // White card
      metalness: 0.1,
      roughness: 0.3,
      side: THREE.FrontSide,
      transparent: false,
      opacity: 1
    });

    const backMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xcccccc,
      metalness: 0.1,
      roughness: 0.3,
      side: THREE.BackSide,
      transparent: false,
      opacity: 1
    });

    console.log('Card geometry created successfully');
    return { geometry, frontMaterial, backMaterial };
  }, []);

  const handleClick = (event) => {
    console.log('Card clicked:', event.object.userData);
    if (event.object.userData.elementId) {
      onElementSelect({
        id: event.object.userData.elementId,
        type: event.object.userData.type
      });
    }
  };

  // Get the most recent element ID
  const getMostRecentElementId = () => {
    console.log('=== Getting Most Recent Element ===');
    console.log('Current state:', {
      textElementsCount: textElements?.length,
      svgPathsCount: svgData.paths.length
    });

    if (textElements && textElements.length > 0) {
      const id = textElements[textElements.length - 1].id;
      console.log('Most recent is text element:', id);
      return id;
    }
    if (svgData.paths.length > 0) {
      const id = `path-${svgData.paths.length - 1}`;
      console.log('Most recent is SVG path:', id);
      return id;
    }
    console.log('No recent elements found');
    return null;
  };

  const mostRecentElementId = getMostRecentElementId();
  console.log('Most recent element ID:', mostRecentElementId);

  console.log('=== Rendering Components ===');
  return (
    <group onClick={handleClick}>
      {/* Card mesh with front and back materials */}
      <mesh
        geometry={defaultCard.geometry}
        material={[defaultCard.frontMaterial, defaultCard.backMaterial]}
        rotation={[0, 0, 0]}
        position={[0, 0, 0]}
      />
      
      {/* SVG elements if loaded */}
      {svgData.paths.map((path, i) => {
        const elementId = `path-${i}`;
        const isMostRecent = elementId === mostRecentElementId;
        const customization = customizations[elementId] || {};
        const { color = isMostRecent ? '#ff0000' : '#000000', scale = 1, position = [0, 0, 0] } = customization;

        console.log('Rendering SVG path:', {
          index: i,
          elementId,
          isMostRecent,
          color,
          position
        });

        return (
          <mesh
            key={i}
            position={[position[0], position[1], thickness/2 + 0.001]}
            scale={[scale, scale, 1]}
            userData={{ elementId, type: 'path' }}
          >
            <shapeGeometry args={[path.toShapes(true)]} />
            <meshBasicMaterial 
              color={color}
              side={THREE.FrontSide}
              transparent={false}
              opacity={1}
            />
          </mesh>
        );
      })}

      {/* Text elements */}
      {textElements && textElements.map((textElement, i) => {
        const isMostRecent = textElement.id === mostRecentElementId;
        console.log('Rendering text element:', {
          index: i,
          id: textElement.id,
          text: textElement.text,
          isMostRecent,
          position: textElement.position,
          fontSize: textElement.fontSize
        });

        return (
          <Text
            key={textElement.id || i}
            position={[textElement.position[0], textElement.position[1], thickness/2 + 0.001]}
            fontSize={textElement.fontSize}
            color={isMostRecent ? '#ff0000' : textElement.color}
            anchorX="center"
            anchorY="middle"
            rotation={[0, 0, 0]}
            material-toneMapped={false}
            material-transparent={false}
            material-opacity={1}
          >
            {textElement.text}
          </Text>
        );
      })}
    </group>
  );
};

export default BusinessCard; 