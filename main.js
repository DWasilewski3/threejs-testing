// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Credit card dimensions (in millimeters, converted to Three.js units)
const cardWidth = 85.6 / 1000;  // 85.6mm
const cardHeight = 53.98 / 1000; // 53.98mm
const cardThickness = 0.76 / 1000; // 0.76mm
const cornerRadius = 4.0 / 1000; // Increased radius for more visible rounding

// Create rounded rectangle shape
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

// Create the card geometry with rounded corners
const shape = createRoundedRectShape(cardWidth, cardHeight, cornerRadius);
const extrudeSettings = {
    steps: 2,
    depth: cardThickness,
    bevelEnabled: true,
    bevelThickness: cardThickness * 0.5,
    bevelSize: cardThickness * 0.5,
    bevelSegments: 5
};

const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

// Create a silver material
const material = new THREE.MeshPhongMaterial({
    color: 0xC0C0C0, // Silver color
    specular: 0xFFFFFF,
    shininess: 100,
    side: THREE.DoubleSide
});

// Create the card mesh
const card = new THREE.Mesh(geometry, material);
scene.add(card);

// Add lights
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

// Position the camera
camera.position.z = 0.2;

// Add OrbitControls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.rotateSpeed = 0.5;
controls.minDistance = 0.1;
controls.maxDistance = 0.5;
controls.enablePan = false; // Disable panning to keep focus on the card

// Text handling
const textMeshes = [];

function createText(text, x, y, size) {
    const loader = new THREE.FontLoader();
    loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function(font) {
        const geometry = new THREE.TextGeometry(text, {
            font: font,
            size: size,
            height: 0.001,
            curveSegments: 12,
            bevelEnabled: false
        });
        
        geometry.computeBoundingBox();
        const textWidth = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
        const textHeight = geometry.boundingBox.max.y - geometry.boundingBox.min.y;
        
        // Center the text
        geometry.translate(-textWidth/2, -textHeight/2, 0);
        
        const material = new THREE.MeshPhongMaterial({
            color: 0x000000,
            specular: 0x111111,
            shininess: 30
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        
        // Position the text on the card's front surface
        mesh.position.set(x, y, cardThickness/2 + 0.0001);
        
        scene.add(mesh);
        textMeshes.push(mesh);
    });
}

// Handle text input
document.getElementById('add-text').addEventListener('click', function() {
    const text = document.getElementById('text-input').value;
    const x = parseFloat(document.getElementById('x-pos').value);
    const y = parseFloat(document.getElementById('y-pos').value);
    const size = parseFloat(document.getElementById('font-size').value);
    
    if (text) {
        createText(text, x, y, size);
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update(); // Update controls
    renderer.render(scene, camera);
}

animate(); 