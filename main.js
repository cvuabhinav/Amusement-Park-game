import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';

// --- SCENE & LIGHTS ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); 
scene.fog = new THREE.FogExp2(0x87ceeb, 0.005);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const cameraRig = new THREE.Group();
cameraRig.add(camera);
scene.add(cameraRig);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);
document.body.appendChild(VRButton.createButton(renderer));

scene.add(new THREE.AmbientLight(0xffffff, 0.7)); 
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(50, 100, 50);
scene.add(sun);

// --- VR CONTROLLER SETUP ---
const controller1 = renderer.xr.getController(0);
const controller2 = renderer.xr.getController(1);
// Adding empty rays just to visualize direction if needed, 
// but for now we just need them initialized to track input sources.
scene.add(controller1);
scene.add(controller2);


// --- WORLD ---
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(500, 500), 
    new THREE.MeshStandardMaterial({ color: 0x228b22, roughness: 0.8 }) 
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);
scene.add(new THREE.GridHelper(500, 100, 0xffffff, 0x1e5c1e));

// --- ADDED: PERIMETER FENCE ---
const fenceMaterial = new THREE.MeshStandardMaterial({ color: 0x4b2d1f }); // Dark wood color
const postGeo = new THREE.BoxGeometry(0.5, 4, 0.5);
const railGeo = new THREE.BoxGeometry(10.2, 0.3, 0.2);

// --- ADDED: THE GATE ENTRANCE ---
// Creating a group so the gate is one solid piece
const gateGroup = new THREE.Group();
const gatePillarGeo = new THREE.BoxGeometry(2, 10, 2);
const gateTopGeo = new THREE.BoxGeometry(16, 2, 3);

// Left Pillar
const leftGatePost = new THREE.Mesh(gatePillarGeo, fenceMaterial);
leftGatePost.position.set(-8, 5, 80); 

// Right Pillar
const rightGatePost = new THREE.Mesh(gatePillarGeo, fenceMaterial);
rightGatePost.position.set(8, 5, 80);

// Top Crossbeam
const gateTopBar = new THREE.Mesh(gateTopGeo, fenceMaterial);
gateTopBar.position.set(0, 10, 80);

// Entrance Sign
const welcomeSign = createSign("WELCOME", "#ffffff");
welcomeSign.position.set(0, 13, 80);

gateGroup.add(leftGatePost, rightGatePost, gateTopBar, welcomeSign);
scene.add(gateGroup);
// --- END OF GATE ADDITION ---

// --- THE GATE GATEKEEPER: DO NOT TOUCH ORIGINAL CODE ---
(function openEntrance() {
    // We use a small delay to ensure your placeFenceLine loops finished adding everything to the scene
    setTimeout(() => {
        const toDelete = [];
        
        // Scan every object in the scene
        scene.traverse((node) => {
            if (node.isMesh && node.material === fenceMaterial) {
                // Check if the object is part of the South Wall (Z = 80)
                // and if it sits between the Gate Pillars (X between -7 and 7)
                const isSouthWall = Math.abs(node.position.z - 80) < 1;
                const isBlockingGate = node.position.x > -7 && node.position.x < 7;

                if (isSouthWall && isBlockingGate) {
                    toDelete.push(node);
                }
            }
        });

        // Physically remove the blockage
        toDelete.forEach(obj => scene.remove(obj));
        console.log(`Gate Opened: Removed ${toDelete.length} blocking pieces.`);
    }, 100); // 100ms is enough for the loops to finish
})();

function placeFenceLine(start, end, count) {
    for (let i = 0; i <= count; i++) {
        const t = i / count;
        const x = start.x + (end.x - start.x) * t;
        const z = start.z + (end.z - start.z) * t;
        
        // Post
        const post = new THREE.Mesh(postGeo, fenceMaterial);
        post.position.set(x, 2, z);
        scene.add(post);

        // Horizontal Rails (except for the very last post)
        if (i < count) {
            const rail1 = new THREE.Mesh(railGeo, fenceMaterial);
            const rail2 = rail1.clone();
            
            // Position rails between posts
            const nextX = start.x + (end.x - start.x) * ((i + 0.5) / count);
            const nextZ = start.z + (end.z - start.z) * ((i + 0.5) / count);
            
            rail1.position.set(nextX, 1.5, nextZ);
            rail2.position.set(nextX, 3.0, nextZ);
            
            // Rotate rail to align with the fence line
            if (start.x === end.x) rail1.rotation.y = Math.PI / 2;
            rail2.rotation.copy(rail1.rotation);
            
            scene.add(rail1, rail2);
        }
    }
}

// Draw the square perimeter (offset slightly inward from 500x500 edge)
const d = 80; 
placeFenceLine({x: -d, z: -d}, {x: d, z: -d}, 50); // North
placeFenceLine({x: d, z: -d}, {x: d, z: d}, 50);  // East
placeFenceLine({x: d, z: d}, {x: -d, z: d}, 50);  // South
placeFenceLine({x: -d, z: d}, {x: -d, z: -d}, 50); // West

// --- HELPER: TEXT LABELS ---
function createSign(text, color) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 512; canvas.height = 128;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = color;
    ctx.font = 'Bold 80px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(text, 256, 90);
    const texture = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
    sprite.scale.set(15, 4, 1);
    return sprite;
}

// --- NEW HELPER: PEOPLE ---
function createPerson(x, z, color) {
    const person = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 1, 4, 8), new THREE.MeshStandardMaterial({color: color}));
    body.position.y = 1;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.35), new THREE.MeshStandardMaterial({color: 0xffdbac}));
    head.position.y = 2.2;
    person.add(body, head);
    person.position.set(x, 0, z);
    scene.add(person);
    return person;
}

const npcList = [];
for(let i=0; i<15; i++) {
    const rx = (Math.random() - 0.5) * 100;
    const rz = (Math.random() - 0.5) * 100;
    const color = new THREE.Color().setHSL(Math.random(), 0.7, 0.5);
    npcList.push(createPerson(rx, rz, color));
}

// --- BOOTH CONSTRUCTOR ---
function createStall(x, z, color, label, roofColor = 0xaa0000) {
    const stallGroup = new THREE.Group();
    stallGroup.position.set(x, 0, z);
    const counter = new THREE.Mesh(new THREE.BoxGeometry(6, 0.5, 4), new THREE.MeshStandardMaterial({color: color}));
    counter.position.y = 3;
    stallGroup.add(counter);
    const base = new THREE.Mesh(new THREE.BoxGeometry(5.5, 3, 3.5), new THREE.MeshStandardMaterial({color: 0x555555}));
    base.position.y = 1.5;
    stallGroup.add(base);
    const pillarGeo = new THREE.CylinderGeometry(0.1, 0.1, 4);
    const pillarMat = new THREE.MeshStandardMaterial({color: 0x333333});
    [[-2.8, 1.8], [2.8, 1.8], [-2.8, -1.8], [2.8, -1.8]].forEach(pos => {
        const p = new THREE.Mesh(pillarGeo, pillarMat);
        p.position.set(pos[0], 5, pos[1]);
        stallGroup.add(p);
    });
    const roof = new THREE.Mesh(new THREE.ConeGeometry(4.5, 3, 4), new THREE.MeshStandardMaterial({color: roofColor}));
    roof.position.y = 8.5;
    roof.rotation.y = Math.PI / 4;
    stallGroup.add(roof);
    const sign = createSign(label, color);
    sign.position.y = 10.5;
    stallGroup.add(sign);
    scene.add(stallGroup);
    return stallGroup;
}

const ticketStall = createStall(0, 40, 0xffd700, "TICKETS");
createStall(15, 40, 0x00ff00, "PHOTOS");
createStall(-15, 40, 0xffa500, "POPCORN", 0xffffff);
createStall(-30, 40, 0xff4500, "PIZZA", 0x228b22);

// --- RIDE ASSETS ---
// 1. SKY HIGH WHEEL
const wheelGroup = new THREE.Group();
wheelGroup.position.set(-50, 25, -10);
scene.add(wheelGroup);
wheelGroup.add(new THREE.Mesh(new THREE.TorusGeometry(20, 0.5, 16, 100), new THREE.MeshStandardMaterial({ color: 0x00d2ff })));
const wheelBaseGeo = new THREE.CylinderGeometry(0.5, 0.5, 35);
const wheelBaseL = new THREE.Mesh(wheelBaseGeo, new THREE.MeshStandardMaterial({color: 0x777777}));
wheelBaseL.position.set(0, -15, 2); wheelBaseL.rotation.z = 0.2;
wheelGroup.add(wheelBaseL);
const wheelBaseR = wheelBaseL.clone();
wheelBaseR.position.z = -2; wheelBaseR.rotation.z = -0.2;
wheelGroup.add(wheelBaseR);
const wheelSign = createSign("UNIT WHEEL", "#00d2ff");
wheelSign.position.y = 25;
wheelGroup.add(wheelSign);
const cabins = [];
for(let i=0; i<12; i++) {
    const angle = (i/12) * Math.PI * 2;
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(3, 4, 3), new THREE.MeshStandardMaterial({ color: 0xff00ff }));
    const pivot = new THREE.Group();
    pivot.position.set(Math.cos(angle)*20, Math.sin(angle)*20, 0);
    pivot.add(cabin);
    wheelGroup.add(pivot);
    cabins.push(pivot);
}

// SPOKES & SECOND RIM
const rim2 = new THREE.Mesh(new THREE.TorusGeometry(20, 0.5, 16, 100), new THREE.MeshStandardMaterial({ color: 0x00d2ff }));
rim2.position.z = -2;
wheelGroup.add(rim2);
for(let i=0; i<12; i++) {
    const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 40), new THREE.MeshStandardMaterial({color: 0xeeeeee}));
    spoke.rotation.z = (i/12) * Math.PI;
    wheelGroup.add(spoke);
}

// 2. TITAN DROP
const dropGroup = new THREE.Group();
dropGroup.position.set(50, 0, 10);
scene.add(dropGroup);
const tower = new THREE.Mesh(new THREE.CylinderGeometry(2, 3, 70, 8), new THREE.MeshStandardMaterial({ color: 0x7f8c8d }));
tower.position.y = 35;
dropGroup.add(tower);
const brace = new THREE.Mesh(new THREE.BoxGeometry(10, 1, 10), new THREE.MeshStandardMaterial({color: 0x333333}));
brace.position.y = 0.5;
dropGroup.add(brace);
const dropSign = createSign("TAN DROP", "#ff0000");
dropSign.position.y = 75;
dropGroup.add(dropSign);
const dropCart = new THREE.Mesh(new THREE.TorusGeometry(4.5, 1, 12, 4), new THREE.MeshStandardMaterial({ color: 0xff0000 }));
dropCart.rotation.x = Math.PI / 2;
dropGroup.add(dropCart);

// TRUSS LATTICE
for(let i=0; i<10; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.1, 8, 4), new THREE.MeshStandardMaterial({color: 0x444444}));
    ring.rotation.x = Math.PI/2; ring.position.y = i * 7;
    dropGroup.add(ring);
}

// 3. ROYAL CAROUSEL
const carousel = new THREE.Group();
carousel.position.set(0, 0, -50);
scene.add(carousel);
carousel.add(new THREE.Mesh(new THREE.CylinderGeometry(15, 15, 1, 32), new THREE.MeshStandardMaterial({ color: 0x95a5a6 })));
const cPole = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 15), new THREE.MeshStandardMaterial({color: 0xffd700}));
cPole.position.y = 7.5;
carousel.add(cPole);
const cRoof = new THREE.Mesh(new THREE.ConeGeometry(16, 5, 32), new THREE.MeshStandardMaterial({color: 0xaa0000}));
cRoof.position.y = 17;
carousel.add(cRoof);
const carSign = createSign("ROYAL CAROUSEL", "#f1c40f");
carSign.position.y = 22;
carousel.add(carSign);
const horses = [];
for(let i=0; i<10; i++) {
    const angle = (i/10) * Math.PI * 2;
    const horse = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 1.2, 4, 8), new THREE.MeshStandardMaterial({ color: 0xf1c40f }));
    const hPole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 15), new THREE.MeshStandardMaterial({color: 0xcccccc}));
    hPole.position.y = 5;
    const hGroup = new THREE.Group();
    hGroup.position.set(Math.cos(angle)*12, 0, Math.sin(angle)*12);
    hGroup.add(horse); hGroup.add(hPole);
    carousel.add(hGroup);
    horses.push({group: hGroup, mesh: horse, angle: angle});
}

// 4. VELOCITY COASTER
const cPoints = [];
for(let i=0; i<=100; i++) { cPoints.push(new THREE.Vector3((i/100-0.5)*150, 12*Math.sin(0.3*(i/100*150))+20, -70)); }
const coasterPath = new THREE.CatmullRomCurve3(cPoints);
scene.add(new THREE.Mesh(new THREE.TubeGeometry(coasterPath, 120, 0.4, 8, false), new THREE.MeshStandardMaterial({ color: 0xe74c3c })));
for(let i=0; i<=10; i++) {
    const p = coasterPath.getPointAt(i/10);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, p.y), new THREE.MeshStandardMaterial({color: 0x444444}));
    beam.position.set(p.x, p.y/2, p.z);
    scene.add(beam);
}
const coastSign = createSign("Sin Coaster", "#e74c3c");
coastSign.position.set(0, 40, -70);
scene.add(coastSign);
const cart = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.5, 4), new THREE.MeshStandardMaterial({ color: 0xffffff }));
scene.add(cart);

// SECOND RAIL & CROSSTIES
const rail2 = new THREE.Mesh(new THREE.TubeGeometry(coasterPath, 120, 0.4, 8, false), new THREE.MeshStandardMaterial({ color: 0xe74c3c }));
rail2.position.z -= 2;
scene.add(rail2);
for(let i=0; i<100; i++) {
    const p = coasterPath.getPointAt(i/100);
    const tie = new THREE.Mesh(new THREE.BoxGeometry(3, 0.2, 0.5), new THREE.MeshStandardMaterial({color: 0x222222}));
    tie.position.set(p.x, p.y, p.z - 1);
    tie.lookAt(coasterPath.getPointAt(Math.min(i/100 + 0.01, 1)));
    scene.add(tie);
}

// 5. AQUA SLIDE
const slidePoints = [];
for(let i=0; i<=100; i++) { const a = i/100 * Math.PI * 10; slidePoints.push(new THREE.Vector3(Math.cos(a)*(12-i/100*6), 60-i/100*60, Math.sin(a)*(12-i/100*6))); }
const slideCurve = new THREE.CatmullRomCurve3(slidePoints);
const slideMesh = new THREE.Mesh(new THREE.TubeGeometry(slideCurve, 100, 1.5, 12, false), new THREE.MeshStandardMaterial({ color: 0x2980b9 }));
slideMesh.position.set(-60, 0, 40);
scene.add(slideMesh);
const slideSign = createSign("Archimedean SLIDE", "#2980b9");
slideSign.position.set(-60, 65, 40);
scene.add(slideSign);

// SCAFFOLDING
for(let i=0; i<5; i++) {
    const p = slideCurve.getPointAt(i/5);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, p.y), new THREE.MeshStandardMaterial({color: 0x7f8c8d}));
    leg.position.set(p.x-60, p.y/2, p.z+40);
    scene.add(leg);
}

// --- UPDATED: DISTANT MOUNTAIN RANGE ---
const mountainMat = new THREE.MeshStandardMaterial({ 
    color: 0x546e7a, // Blue-grey for "atmospheric perspective"
    roughness: 0.9,
    flatShading: true 
});

function createMountain(x, z, scale) {
    // Smaller height and radius for a more realistic distance feel
    const height = 30 + Math.random() * 20;
    const radius = 25 + Math.random() * 15;
    const mountain = new THREE.Mesh(
        new THREE.ConeGeometry(radius, height, 4), 
        mountainMat
    );
    // Positioned on the floor, scaled by the scale factor
    mountain.position.set(x, height / 2, z);
    mountain.scale.set(scale, 1, scale);
    mountain.rotation.y = Math.random() * Math.PI;
    scene.add(mountain);
}

// Just 5 mountains, placed very far out (Z and X around 300-400)
const distantPlacements = [
    {x: -100, z: -150, s: 1.2},
    {x: 350, z: -300, s: 1.5},
    {x: 0, z: -200, s: 2.0},
    {x: 100, z: -100, s: 1.3},
    {x: 150, z: -100, s: 1.1}
];

distantPlacements.forEach(pos => createMountain(pos.x, pos.z, pos.s));
// --- END OF MOUNTAINS ---

// --- UPDATED: MOUSE & VIEW CONTROL ---
let yaw = 0, pitch = 0;
const mouseSensitivity = 0.002;

document.addEventListener('mousemove', (e) => {
    // This only runs when the mouse is "Locked" (after you click)
    if (document.pointerLockElement === document.body) {
        yaw -= e.movementX * mouseSensitivity;
        pitch -= e.movementY * mouseSensitivity;

        // Limit looking too far up or down
        pitch = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, pitch));

        // Apply rotation: 
        // We rotate the Camera for looking around, 
        // while the CameraRig handles moving through space.
        camera.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));
    }
});

// Trigger the lock when the user clicks the screen
document.addEventListener('mousedown', () => { 
    if (window.rideMode === 'walking') {
        document.body.requestPointerLock(); 
    }
});


// --- RIDE STATE & MATH ---
const keys = {};
window.addEventListener('keydown', (e) => keys[e.code] = true);
window.addEventListener('keyup', (e) => keys[e.code] = false);

window.rideMode = 'walking';
cameraRig.position.set(0, 1.6, 60);

window.hasTicket = false;
const mathRegistry = {
    wheel: "Circle Math: x = r*cos(θ), y = r*sin(θ)",
    dropper: "Power Functions: y = sin(t)^6",
    carousel: "Phase Shifting: y = sin(t + angle)",
    coaster: "Sine Waves: y = A*sin(Bx)",
    slide: "Helical Spirals: Trig + Linear Y drop"
};

window.setRideMode = (mode) => {
    if (mode !== 'walking' && !window.hasTicket) {
        alert("PLEASE WALK TO THE TICKET STALL FIRST!");
        return;
    }
    window.rideMode = mode;
    const hud = document.getElementById('math-hud');
    if (mode === 'walking') {
        if(hud) hud.style.display = 'none';
        cameraRig.position.set(0, 1.6, 60);
        cameraRig.rotation.set(0, 0, 0);
        yaw = 0; pitch = 0;
        camera.quaternion.set(0,0,0,1);
    } else if (hud) {
        hud.style.display = 'block';
        document.getElementById('math-desc').innerText = mathRegistry[mode];
        document.getElementById('math-title').innerText = mode.toUpperCase();
    }
};

// --- VR LOCOMOTION HELPER ---
function handleVRMovement() {
    // Only move if we are in 'walking' mode
    if (window.rideMode !== 'walking') return;

    const session = renderer.xr.getSession();
    if (session) {
        for (const source of session.inputSources) {
            if (source.gamepad) {
                // Typical mapping for Quest/standard XR controllers:
                // axes[2] = X (Left/Right)
                // axes[3] = Y (Up/Down - Forward/Back)
                const data = source.gamepad;
                
                // LEFT HAND: Walk (Translate)
                if (source.handedness === 'left') {
                    const stickX = data.axes[2];
                    const stickY = data.axes[3];

                    // Deadzone to prevent drift
                    if (Math.abs(stickX) > 0.1 || Math.abs(stickY) > 0.1) {
                        const speed = 0.15;
                        
                        // Get camera forward direction, projected to floor (Y=0)
                        const forward = new THREE.Vector3();
                        camera.getWorldDirection(forward);
                        forward.y = 0;
                        forward.normalize();

                        // Get camera right direction
                        const right = new THREE.Vector3();
                        right.crossVectors(forward, new THREE.Vector3(0, 1, 0));

                        // Apply movement
                        cameraRig.position.add(right.multiplyScalar(stickX * speed)); // Strafe
                        cameraRig.position.add(forward.multiplyScalar(stickY * speed)); // Forward/Back
                    }
                }

                // RIGHT HAND: Turn (Rotate)
                if (source.handedness === 'right') {
                    const stickX = data.axes[2];
                    // Deadzone for turning
                    if (Math.abs(stickX) > 0.5) {
                         // Simple Smooth Turn
                        cameraRig.rotation.y -= stickX * 0.04;
                    }
                }
            }
        }
    }
}

// --- ANIMATION LOOP ---
function animate(time) {
    const t = time * 0.001;

    // Run VR input check
    handleVRMovement();

    // Animations
    const cp = (t * 0.04) % 1;
    cart.position.copy(coasterPath.getPointAt(cp));
    cart.lookAt(coasterPath.getPointAt((cp + 0.01) % 1));
    wheelGroup.rotation.z = t * 0.2;
    cabins.forEach(c => c.rotation.z = -wheelGroup.rotation.z);
    dropCart.position.y = Math.pow(Math.sin(t * 1.5), 6) * 60 + 2;
    carousel.rotation.y = t * 0.4;
    horses.forEach(h => { h.group.rotation.y = t * 0.5; h.mesh.position.y = 2 + Math.sin(t * 4 + h.angle) * 2; });

    npcList.forEach((npc, i) => {
        npc.rotation.y = Math.sin(t * 0.5 + i) * 0.2;
        npc.position.y = Math.abs(Math.sin(t * 2 + i)) * 0.1;
    });

    // Camera Modes (Ride Attachments)
    if (window.rideMode === 'coaster') {
        cameraRig.position.copy(cart.position);
        const matrix = new THREE.Matrix4().lookAt(cart.position, coasterPath.getPointAt((cp + 0.01) % 1), new THREE.Vector3(0,1,0));
        cameraRig.quaternion.setFromRotationMatrix(matrix);
    } else if (window.rideMode === 'dropper') {
        cameraRig.position.set(50, dropCart.position.y + 1.5, 14.5);
    } else if (window.rideMode === 'wheel') {
        const wp = new THREE.Vector3();
        cabins[0].getWorldPosition(wp);
        cameraRig.position.copy(wp);
    } else if (window.rideMode === 'carousel') {
        const hp = new THREE.Vector3();
        horses[0].mesh.getWorldPosition(hp);
        cameraRig.position.copy(hp).add(new THREE.Vector3(0, 1, 0));
    } else if (window.rideMode === 'slide') {
        const sp = (t * 0.08) % 1;
        const curvePoint = slideCurve.getPointAt(sp);
        cameraRig.position.set(curvePoint.x - 60, curvePoint.y + 1, curvePoint.z + 40);
    } else {
        // WALKING MODE (Keyboard fallback)
        const move = new THREE.Vector3();
        if(keys['KeyW']) move.z -= 1; if(keys['KeyS']) move.z += 1;
        if(keys['KeyA']) move.x -= 1; if(keys['KeyD']) move.x += 1;
        
        if(move.length() > 0) {
            move.normalize().applyQuaternion(camera.quaternion);
            cameraRig.position.add(new THREE.Vector3(move.x, 0, move.z).multiplyScalar(0.4));
        }
        
        // INTERACTION
        if(cameraRig.position.distanceTo(ticketStall.position) < 5 && !window.hasTicket) {
            window.hasTicket = true;
            // Note: alert() might not show inside VR headset properly, consider using in-game UI later
            console.log("Ticket Gained! Now you can ride!");
        }
    }
    renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
