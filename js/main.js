// Scene setup
const scene = new THREE.Scene();
// Create gradient background
const canvas = document.createElement('canvas');
canvas.width = 2;
canvas.height = 2;
const context = canvas.getContext('2d');
const gradient = context.createRadialGradient(1, 1, 0, 1, 1, 1);
gradient.addColorStop(0, '#2c3e50');
gradient.addColorStop(1, '#1a1a1a');
context.fillStyle = gradient;
context.fillRect(0, 0, 2, 2);
const backgroundTexture = new THREE.CanvasTexture(canvas);
scene.background = backgroundTexture;

// Greenscreen state
let isGreenscreenActive = false;

// Auto-rotate state
let isAutoRotating = false;
let autoRotateSpeed = 0.01; // Rotation speed in radians per frame

// Function to toggle greenscreen
function toggleGreenscreen() {
    isGreenscreenActive = !isGreenscreenActive;
    
    if (isGreenscreenActive) {
        // Set to green screen color (#00FF00)
        scene.background = new THREE.Color(0x00FF00);
    } else {
        // Restore original gradient background
        scene.background = backgroundTexture;
    }
}

// Function to toggle auto-rotate
function toggleAutoRotate() {
    isAutoRotating = !isAutoRotating;
    
    // Update button text
    const button = document.getElementById('auto-rotate-toggle');
    if (isAutoRotating) {
        button.textContent = 'Stop Auto Rotate';
        button.classList.add('active');
    } else {
        button.textContent = 'Auto Rotate';
        button.classList.remove('active');
    }
}

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 3;
controls.maxDistance = 15;
controls.maxPolarAngle = Math.PI;

// Add light
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
directionalLight.position.set(15, 5, 25);
scene.add(directionalLight);

const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.2);
directionalLight2.position.set(15, -5, 25);
scene.add(directionalLight2);

const directionalLight3 = new THREE.DirectionalLight(0xffffff, 0.2);
directionalLight3.position.set(-15, 5, 25);
scene.add(directionalLight3);

const directionalLight4 = new THREE.DirectionalLight(0xffffff, 0.2);
directionalLight4.position.set(-15, -5, 25);
scene.add(directionalLight4);

// Credit card dimensions (in mm)
const cardWidth = 85.6;
const cardHeight = 53.98;
const cardThickness = 0.76;
const cornerRadius = 3.13; // Corner radius in mm

// Create credit card with rounded corners
function createRoundedRectShape(width, height, radius) {
    const shape = new THREE.Shape();
    const x = -width / 2;
    const y = -height / 2;
    
    shape.moveTo(x + radius, y);
    shape.lineTo(x + width - radius, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + radius);
    shape.lineTo(x + width, y + height - radius);
    shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    shape.lineTo(x + radius, y + height);
    shape.quadraticCurveTo(x, y + height, x, y + height - radius);
    shape.lineTo(x, y + radius);
    shape.quadraticCurveTo(x, y, x + radius, y);
    
    return shape;
}

const cardShape = createRoundedRectShape(cardWidth / 10, cardHeight / 10, cornerRadius / 10);
const cardGeometry = new THREE.ExtrudeGeometry(cardShape, {
    depth: cardThickness / 10,
    bevelEnabled: false
});

// Create card material with matte black finish
const cardMaterial = new THREE.MeshStandardMaterial({
    color: 0x000000,
    roughness: 0.7,
    metalness: 0.2
});

// Create card mesh
const card = new THREE.Mesh(cardGeometry, cardMaterial);
scene.add(card);

// Position camera further back for a smaller initial view
camera.position.z = 8;

// Text elements container
const textElements = new THREE.Group();
textElements.position.z = cardThickness / 20 + 0.01;
scene.add(textElements);

// SVG elements container
const svgElements = new THREE.Group();
svgElements.position.z = cardThickness / 20 + 0.01;
scene.add(svgElements);

// Component tracking
let componentCount = 0;
const components = new Map();
let selectedComponentId = null;
let isPreviewMode = false;
let isDragging = false;
let dragStart = new THREE.Vector2();
let dragOffset = new THREE.Vector2();
let draggedMesh = null;

// Movement step size
const MOVE_STEP = 0.1;
const SCALE_STEP = 0.05;
const MIN_SCALE = 0.1;
const MAX_SCALE = 5.0;

// Initialize controls
controls.enabled = false; // Start with controls disabled

// Update components list
function updateComponentsList() {
    const componentsList = document.getElementById('components-list');
    componentsList.innerHTML = '';
    
    components.forEach((component, id) => {
        const item = document.createElement('div');
        item.className = `component-item${id === selectedComponentId ? ' selected' : ''}`;
        
        // Only select component if clicking outside of input fields
        item.onclick = (e) => {
            if (!e.target.closest('input, select, button')) {
                selectComponent(id);
            }
        };
        
        const info = document.createElement('div');
        info.className = 'component-info';
        
        const name = document.createElement('div');
        name.textContent = component.name;
        
        const type = document.createElement('div');
        type.className = 'component-type';
        type.textContent = component.type;
        
        info.appendChild(name);
        info.appendChild(type);
        
        // Add edit controls for text components
        if (component.type === 'text' && id === selectedComponentId) {
            const editControls = document.createElement('div');
            editControls.className = 'edit-controls';
            
            const textInput = document.createElement('input');
            textInput.type = 'text';
            textInput.value = component.name;
            textInput.placeholder = 'Edit text';
            textInput.onclick = (e) => e.stopPropagation();
            
            const fontSizeInput = document.createElement('input');
            fontSizeInput.type = 'number';
            fontSizeInput.value = component.fontSize || 24;
            fontSizeInput.min = '8';
            fontSizeInput.max = '72';
            fontSizeInput.onclick = (e) => e.stopPropagation();
            
            const fontFamilySelect = document.createElement('select');
            fontFamilySelect.innerHTML = `
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
            `;
            fontFamilySelect.value = component.fontFamily || 'Arial';
            fontFamilySelect.onclick = (e) => e.stopPropagation();
            
            const saveButton = document.createElement('button');
            saveButton.className = 'save-button';
            saveButton.textContent = 'Save Changes';
            saveButton.onclick = (e) => {
                e.stopPropagation();
                updateTextComponent(id, fontSizeInput.value, fontFamilySelect.value, textInput.value);
            };
            
            editControls.appendChild(textInput);
            editControls.appendChild(fontSizeInput);
            editControls.appendChild(fontFamilySelect);
            editControls.appendChild(saveButton);
            info.appendChild(editControls);
        }
        // Add edit controls for SVG components
        else if (component.type === 'svg' && id === selectedComponentId) {
            const editControls = document.createElement('div');
            editControls.className = 'edit-controls';
            
            const sizeInput = document.createElement('input');
            sizeInput.type = 'number';
            sizeInput.value = component.sizePercent || 100;
            sizeInput.min = '10';
            sizeInput.max = '500';
            sizeInput.placeholder = 'Size (%)';
            sizeInput.onclick = (e) => e.stopPropagation();
            
            const saveButton = document.createElement('button');
            saveButton.className = 'save-button';
            saveButton.textContent = 'Save Changes';
            saveButton.onclick = (e) => {
                e.stopPropagation();
                updateSVGSize(id, sizeInput.value);
            };
            
            editControls.appendChild(sizeInput);
            editControls.appendChild(saveButton);
            info.appendChild(editControls);
        }
        
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete';
        deleteButton.textContent = '×';
        deleteButton.onclick = (e) => {
            e.stopPropagation();
            removeComponent(id);
        };
        
        item.appendChild(info);
        item.appendChild(deleteButton);
        componentsList.appendChild(item);
    });
}

// Update text component
function updateTextComponent(id, newFontSize, newFontFamily, newText) {
    const component = components.get(id);
    if (!component || component.type !== 'text') return;
    
    const text = newText !== undefined ? newText : component.name;
    const fontSize = newFontSize || component.fontSize || 24;
    const fontFamily = newFontFamily || component.fontFamily || 'Arial';
    
    component.name = text;
    component.fontSize = fontSize;
    component.fontFamily = fontFamily;
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = `${fontSize}px ${fontFamily}`;
    const textWidth = context.measureText(text).width;
    
    canvas.width = textWidth;
    canvas.height = fontSize * 1.5;
    context.font = `${fontSize}px ${fontFamily}`;
    context.fillStyle = '#E8E8E8'; // Lighter silver color
    context.fillText(text, 0, fontSize);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    component.mesh.material = new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        color: 0xE8E8E8,
        metalness: 0.8,
        roughness: 0.2,
        emissive: 0x404040,
        emissiveIntensity: 0.2
    });
    
    const geometry = new THREE.PlaneGeometry(textWidth / 100, fontSize / 100);
    component.mesh.geometry = geometry;
}

// Select component
function selectComponent(id) {
    selectedComponentId = id;
    updateComponentsList();
}

// Remove component
function removeComponent(id) {
    const component = components.get(id);
    if (component) {
        if (component.type === 'text') {
            textElements.remove(component.mesh);
        } else if (component.type === 'svg') {
            svgElements.remove(component.mesh);
        }
        components.delete(id);
        if (selectedComponentId === id) {
            selectedComponentId = null;
        }
        updateComponentsList();
    }
}

// Move selected component
function moveComponent(direction) {
    if (selectedComponentId === null) return;
    
    const component = components.get(selectedComponentId);
    if (!component) return;
    
    const mesh = component.mesh;
    switch (direction) {
        case 'up':
            mesh.position.y += MOVE_STEP;
            break;
        case 'down':
            mesh.position.y -= MOVE_STEP;
            break;
        case 'left':
            mesh.position.x -= MOVE_STEP;
            break;
        case 'right':
            mesh.position.x += MOVE_STEP;
            break;
    }
}

// Scale component
function scaleComponent(component, delta) {
    const currentScale = component.mesh.scale.x;
    let newScale = currentScale + (delta < 0 ? SCALE_STEP : -SCALE_STEP);
    newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
    
    // Calculate new dimensions
    const newWidth = component.originalWidth * newScale / 100;
    const newHeight = component.originalHeight * newScale / 100;
    
    // Check if new size would exceed card boundaries
    const halfCardWidth = (cardWidth / 10) / 2;
    const halfCardHeight = (cardHeight / 10) / 2;
    
    if (newWidth <= cardWidth / 10 && newHeight <= cardHeight / 10) {
        component.mesh.scale.set(newScale, newScale, 1);
    }
}

// Toggle preview mode
function togglePreviewMode() {
    isPreviewMode = !isPreviewMode;
    const toggleButton = document.getElementById('preview-toggle');
    const modeInfo = document.getElementById('mode-info');
    
    if (isPreviewMode) {
        toggleButton.textContent = 'Exit Preview Mode';
        toggleButton.classList.add('active');
        modeInfo.textContent = 'Preview Mode: Use mouse to rotate and zoom card';
        controls.enabled = true; // Enable orbit controls in preview mode
    } else {
        toggleButton.textContent = 'Enter Preview Mode';
        toggleButton.classList.remove('active');
        modeInfo.textContent = 'Edit Mode: Click and drag to move elements, scroll to scale SVGs';
        controls.enabled = false; // Disable orbit controls in edit mode
    }
    
    updateComponentsList();
}

// Handle mouse events for dragging
function onMouseDown(event) {
    if (isPreviewMode) return; // Only allow dragging in edit mode
    
    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    
    // Check for intersections with text and SVG elements
    const intersects = raycaster.intersectObjects([...textElements.children, ...svgElements.children]);
    
    if (intersects.length > 0) {
        isDragging = true;
        draggedMesh = intersects[0].object;
        dragStart.set(event.clientX, event.clientY);
        
        // Find the component ID for the dragged mesh
        for (const [id, component] of components) {
            if (component.mesh === draggedMesh) {
                selectedComponentId = id;
                updateComponentsList();
                break;
            }
        }
    }
}

function onMouseMove(event) {
    if (isPreviewMode || !isDragging || !draggedMesh) return;
    
    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    
    // Create a plane at the card's front face
    const plane = new THREE.Plane();
    plane.setFromNormalAndCoplanarPoint(
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 0, cardThickness / 20)
    );
    
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersection);
    
    if (intersection) {
        // Calculate boundaries based on element size
        const elementWidth = draggedMesh.geometry.parameters.width;
        const elementHeight = draggedMesh.geometry.parameters.height;
        const halfCardWidth = (cardWidth / 10) / 2;
        const halfCardHeight = (cardHeight / 10) / 2;
        
        // Constrain position within card boundaries
        const minX = -halfCardWidth + (elementWidth / 2);
        const maxX = halfCardWidth - (elementWidth / 2);
        const minY = -halfCardHeight + (elementHeight / 2);
        const maxY = halfCardHeight - (elementHeight / 2);
        
        draggedMesh.position.x = Math.max(minX, Math.min(maxX, intersection.x));
        draggedMesh.position.y = Math.max(minY, Math.min(maxY, intersection.y));
    }
}

function onMouseUp() {
    isDragging = false;
    draggedMesh = null;
}

// Handle mouse wheel for scaling
function onMouseWheel(event) {
    if (isPreviewMode || selectedComponentId === null) return; // Only allow scaling in edit mode
    
    const component = components.get(selectedComponentId);
    if (!component) return;
    
    // Prevent the default scroll behavior
    event.preventDefault();
    
    // Scale the component based on wheel delta
    scaleComponent(component, event.deltaY);
}

// Add event listeners for mouse events
renderer.domElement.addEventListener('mousedown', onMouseDown);
renderer.domElement.addEventListener('mousemove', onMouseMove);
renderer.domElement.addEventListener('mouseup', onMouseUp);
renderer.domElement.addEventListener('wheel', onMouseWheel, { passive: false });

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Add preview mode toggle listener
document.getElementById('preview-toggle').addEventListener('click', togglePreviewMode);

// Add text functionality
document.getElementById('add-text').addEventListener('click', () => {
    const text = document.getElementById('text-input').value;
    const fontSize = parseInt(document.getElementById('font-size').value);
    const fontFamily = document.getElementById('font-family').value;

    if (text) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = `${fontSize}px ${fontFamily}`;
        const textWidth = context.measureText(text).width;
        
        canvas.width = textWidth;
        canvas.height = fontSize * 1.5;
        
        // Set lighter silver color for text
        context.fillStyle = '#E8E8E8';
        context.font = `${fontSize}px ${fontFamily}`;
        context.fillText(text, 0, fontSize);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        // Create material with lighter silver color
        const material = new THREE.MeshStandardMaterial({
            map: texture,
            transparent: true,
            color: 0xE8E8E8,
            metalness: 0.8,
            roughness: 0.2,
            emissive: 0x404040,
            emissiveIntensity: 0.2
        });
        
        const geometry = new THREE.PlaneGeometry(textWidth / 100, fontSize / 100);
        const textMesh = new THREE.Mesh(geometry, material);
        
        // Position text slightly above the card surface
        textMesh.position.z = cardThickness / 20 + 0.01;
        textElements.add(textMesh);

        // Add to components list
        const id = componentCount++;
        components.set(id, {
            type: 'text',
            name: text,
            mesh: textMesh,
            fontSize: fontSize,
            fontFamily: fontFamily
        });
        updateComponentsList();

        // Clear input
        document.getElementById('text-input').value = '';
    }
});

// Handle SVG upload
document.getElementById('svg-upload').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const svgData = e.target.result;
            
            // Modify SVG to be silver
            const modifiedSvgData = svgData.replace(/fill="[^"]*"/g, 'fill="#E8E8E8"')
                                         .replace(/stroke="[^"]*"/g, 'stroke="#E8E8E8"')
                                         .replace(/<svg/g, '<svg style="color: #E8E8E8"');
            
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const context = canvas.getContext('2d');
                
                // Draw the modified SVG
                context.drawImage(img, 0, 0);
                
                const texture = new THREE.CanvasTexture(canvas);
                texture.needsUpdate = true;
                
                const material = new THREE.MeshStandardMaterial({
                    map: texture,
                    transparent: true,
                    color: 0xE8E8E8,
                    metalness: 0.8,
                    roughness: 0.2,
                    emissive: 0x404040,
                    emissiveIntensity: 0.2
                });
                
                // Get size from input
                const sizePercent = parseInt(document.getElementById('svg-size').value) || 100;
                
                // Calculate scale to fit within card boundaries
                const maxWidth = cardWidth / 10;
                const maxHeight = cardHeight / 10;
                const scaleX = (maxWidth / img.width) * (sizePercent / 100);
                const scaleY = (maxHeight / img.height) * (sizePercent / 100);
                const scale = Math.min(scaleX, scaleY) * 0.8;
                
                const geometry = new THREE.PlaneGeometry(img.width * scale, img.height * scale);
                const svgMesh = new THREE.Mesh(geometry, material);
                
                svgMesh.position.z = cardThickness / 20 + 0.01;
                svgElements.add(svgMesh);

                const id = componentCount++;
                components.set(id, {
                    type: 'svg',
                    name: file.name,
                    mesh: svgMesh,
                    originalWidth: img.width,
                    originalHeight: img.height,
                    sizePercent: sizePercent
                });
                updateComponentsList();

                event.target.value = '';
            };
            img.src = URL.createObjectURL(new Blob([modifiedSvgData], { type: 'image/svg+xml' }));
        };
        reader.readAsText(file);
    }
});

// Update SVG size
function updateSVGSize(id, newSizePercent) {
    const component = components.get(id);
    if (!component || component.type !== 'svg') return;
    
    component.sizePercent = newSizePercent;
    
    // Calculate new scale
    const maxWidth = cardWidth / 10;
    const maxHeight = cardHeight / 10;
    const scaleX = (maxWidth / component.originalWidth) * (newSizePercent / 100);
    const scaleY = (maxHeight / component.originalHeight) * (newSizePercent / 100);
    const scale = Math.min(scaleX, scaleY) * 0.8;
    
    // Update geometry
    const geometry = new THREE.PlaneGeometry(
        component.originalWidth * scale,
        component.originalHeight * scale
    );
    component.mesh.geometry = geometry;
}

// Export as SVG
function exportAsSVG() {
    console.log('Card Dimensions:', {
        width: cardWidth,
        height: cardHeight,
        cornerRadius: cornerRadius
    });

    // Create SVG element with proper dimensions
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', `${cardWidth}mm`);
    svg.setAttribute('height', `${cardHeight}mm`);
    svg.setAttribute('viewBox', `0 0 ${cardWidth} ${cardHeight}`);
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    console.log('SVG Attributes:', {
        width: svg.getAttribute('width'),
        height: svg.getAttribute('height'),
        viewBox: svg.getAttribute('viewBox')
    });

    // Add card background with rounded corners
    const path = `M ${cornerRadius} 0
                 L ${cardWidth - cornerRadius} 0
                 Q ${cardWidth} 0 ${cardWidth} ${cornerRadius}
                 L ${cardWidth} ${cardHeight - cornerRadius}
                 Q ${cardWidth} ${cardHeight} ${cardWidth - cornerRadius} ${cardHeight}
                 L ${cornerRadius} ${cardHeight}
                 Q 0 ${cardHeight} 0 ${cardHeight - cornerRadius}
                 L 0 ${cornerRadius}
                 Q 0 0 ${cornerRadius} 0
                 Z`;

    console.log('Card Path:', path);

    const cardBackground = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    cardBackground.setAttribute('d', path);
    cardBackground.setAttribute('fill', cardMaterial.color.getStyle());
    svg.appendChild(cardBackground);

    // Function to convert Three.js coordinates to SVG coordinates
    function convertToSVGCoords(x, y) {
        // Convert from Three.js coordinates (centered at 0,0) to SVG coordinates (top-left at 0,0)
        const svgX = (x * 10) + (cardWidth / 2); // Convert to mm and adjust for center
        const svgY = (-y * 10) + (cardHeight / 2); // Convert to mm, flip Y axis, and adjust for center
        return { x: svgX, y: svgY };
    }

    // Add text elements
    textElements.children.forEach(textMesh => {
        const component = Array.from(components.values()).find(c => c.mesh === textMesh);
        if (!component) return;

        const pos = convertToSVGCoords(textMesh.position.x, textMesh.position.y);
        const scale = textMesh.scale.x * 10; // Convert scale to mm
        const fontSize = component.fontSize * scale;

        console.log('Text Element:', {
            originalPosition: { x: textMesh.position.x, y: textMesh.position.y },
            convertedPosition: pos,
            scale: scale,
            fontSize: fontSize,
            text: component.name
        });

        const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textElement.setAttribute('x', pos.x);
        textElement.setAttribute('y', pos.y);
        textElement.setAttribute('font-family', component.fontFamily);
        textElement.setAttribute('font-size', `${fontSize}mm`);
        textElement.setAttribute('fill', '#C0C0C0');
        textElement.setAttribute('text-anchor', 'middle');
        textElement.setAttribute('dominant-baseline', 'middle');
        textElement.textContent = component.name;
        svg.appendChild(textElement);
    });

    // Add SVG elements
    svgElements.children.forEach(svgMesh => {
        const component = Array.from(components.values()).find(c => c.mesh === svgMesh);
        if (!component) return;

        const pos = convertToSVGCoords(svgMesh.position.x, svgMesh.position.y);
        const scale = svgMesh.scale.x * 10; // Convert scale to mm

        console.log('SVG Element:', {
            originalPosition: { x: svgMesh.position.x, y: svgMesh.position.y },
            convertedPosition: pos,
            scale: scale
        });

        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('transform', `translate(${pos.x} ${pos.y}) scale(${scale})`);

        // Parse the SVG content and add it to the group
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(component.svgContent, 'image/svg+xml');
        const importedSvg = svgDoc.documentElement;

        // Convert all fill and stroke colors to silver
        const elements = importedSvg.getElementsByTagName('*');
        for (let element of elements) {
            if (element.hasAttribute('fill') && element.getAttribute('fill') !== 'none') {
                element.setAttribute('fill', '#C0C0C0');
            }
            if (element.hasAttribute('stroke') && element.getAttribute('stroke') !== 'none') {
                element.setAttribute('stroke', '#C0C0C0');
            }
        }

        group.appendChild(importedSvg);
        svg.appendChild(group);
    });

    // Log final SVG string
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    console.log('Final SVG String Length:', svgString.length);
    console.log('First 500 characters of SVG:', svgString.substring(0, 500));

    // Create download link
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cloud-card.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Add event listener for export button
// document.getElementById('export-svg').addEventListener('click', exportAsSVG);

// Export as PNG
function exportAsPNG() {
    // Create a temporary canvas with the card dimensions
    const tempCanvas = document.createElement('canvas');
    const tempRenderer = new THREE.WebGLRenderer({ 
        canvas: tempCanvas,
        antialias: true,
        alpha: true 
    });
    
    // Set the size to match card dimensions in pixels (300 DPI for print quality)
    const dpi = 300;
    const width = (cardWidth / 25.4) * dpi; // Convert mm to inches, then to pixels
    const height = (cardHeight / 25.4) * dpi;
    tempRenderer.setSize(width, height);
    
    // Create a temporary camera for the render
    const tempCamera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    tempCamera.position.z = 8;
    
    // Create a temporary scene for the export
    const tempScene = new THREE.Scene();
    
    // Clone the card and its materials
    const cardClone = card.clone();
    cardClone.material = card.material.clone();
    tempScene.add(cardClone);
    
    // Clone text elements
    textElements.children.forEach(textMesh => {
        const clone = textMesh.clone();
        clone.material = textMesh.material.clone();
        tempScene.add(clone);
    });
    
    // Clone SVG elements
    svgElements.children.forEach(svgMesh => {
        const clone = svgMesh.clone();
        clone.material = svgMesh.material.clone();
        tempScene.add(clone);
    });
    
    // Add even lighting for the export
    const exportAmbientLight = new THREE.AmbientLight(0xffffff, 1);
    tempScene.add(exportAmbientLight);
    
    const exportFrontLight = new THREE.DirectionalLight(0xffffff, 1);
    exportFrontLight.position.set(0, 0, 10);
    tempScene.add(exportFrontLight);
    
    const exportBackLight = new THREE.DirectionalLight(0xffffff, 0.5);
    exportBackLight.position.set(0, 0, -10);
    tempScene.add(exportBackLight);
    
    // Render the scene
    tempRenderer.render(tempScene, tempCamera);
    
    // Convert to PNG and download
    const dataURL = tempCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'cloud-card.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    tempRenderer.dispose();
}

// Add event listener for PNG export button
document.getElementById('export-png').addEventListener('click', exportAsPNG);

// Add event listener for greenscreen toggle
document.getElementById('greenscreen-toggle').addEventListener('click', toggleGreenscreen);

// Add event listener for auto-rotate toggle
document.getElementById('auto-rotate-toggle').addEventListener('click', toggleAutoRotate);

// Export as GLTF
function exportAsGLTF() {
    // Create a new scene for export
    const exportScene = new THREE.Scene();
    
    // Clone the card and its materials
    const cardClone = card.clone();
    cardClone.material = card.material.clone();
    exportScene.add(cardClone);
    
    // Clone text elements
    textElements.children.forEach(textMesh => {
        const clone = textMesh.clone();
        clone.material = textMesh.material.clone();
        exportScene.add(clone);
    });
    
    // Clone SVG elements
    svgElements.children.forEach(svgMesh => {
        const clone = svgMesh.clone();
        clone.material = svgMesh.material.clone();
        exportScene.add(clone);
    });
    
    // Create exporter
    const exporter = new THREE.GLTFExporter();
    
    // Export options
    const options = {
        binary: true, // Export as GLB (binary) instead of GLTF
        trs: true, // Use TRS properties
        onlyVisible: true, // Only export visible objects
        maxTextureSize: 4096, // Maximum texture size
        animations: [], // No animations to export
        includeCustomExtensions: false
    };
    
    // Export the scene
    exporter.parse(exportScene, (gltf) => {
        // Create download link
        const blob = new Blob([gltf], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'cloud-card.glb';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, options);
}

// Add event listener for GLTF export button
// document.getElementById('export-gltf').addEventListener('click', exportAsGLTF);

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Auto-rotate the card if enabled
    if (isAutoRotating) {
        card.rotation.y += autoRotateSpeed;
    }
    
    controls.update();
    renderer.render(scene, camera);
}
animate();

// Add color change functionality
document.querySelectorAll('.color-option').forEach(button => {
    button.addEventListener('click', () => {
        const color = button.dataset.color;
        let colorValue;
        switch(color) {
            case 'black':
                colorValue = 0x000000;
                break;
            case 'red':
                colorValue = 0xcc0000;
                break;
            case 'green':
                colorValue = 0x006600;
                break;
            case 'gold':
                colorValue = 0xcc9900;
                break;
            case 'blue':
                colorValue = 0x0000cc;
                break;
        }
        cardMaterial.color.setHex(colorValue);
    });
});

// Function to create text geometry with silver color
function createTextGeometry(text, size = 1) {
    const loader = new THREE.FontLoader();
    return new Promise((resolve, reject) => {
        loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function(font) {
            const textGeometry = new THREE.TextGeometry(text, {
                font: font,
                size: size,
                height: 0.1,
                curveSegments: 12,
                bevelEnabled: true,
                bevelThickness: 0.03,
                bevelSize: 0.02,
                bevelOffset: 0,
                bevelSegments: 5
            });
            textGeometry.computeBoundingBox();
            resolve(textGeometry);
        }, undefined, reject);
    });
}

// Function to create text mesh with silver material
async function createTextMesh(text, size = 1) {
    const textGeometry = await createTextGeometry(text, size);
    const textMaterial = new THREE.MeshStandardMaterial({
        color: 0xC0C0C0, // Silver color
        metalness: 0.8,
        roughness: 0.2
    });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    return textMesh;
}

// Update SVG material to be silver
function createSVGMaterial() {
    return new THREE.MeshStandardMaterial({
        color: 0xC0C0C0, // Silver color
        metalness: 0.8,
        roughness: 0.2,
        side: THREE.DoubleSide
    });
} 