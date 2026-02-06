# Amusement-Park VR

This project is a roller-coaster that can viewed within VR, the experience allows the user ride through a custom 3D environments. The coaster follows a dynamically generated track that creates smooth rises and drops, while the world around it is designed to give a strong sense of scale and motion. The focus of the project is on making the ride feel immersive and comfortable in VR.

---

## Science (Physics applied in VR motion)

The science element of this project comes from the use of **classical mechanics** to control how the rider moves through the VR roller‑coaster. Motion is not animated manually; instead, it is calculated using gravitational force components along the track.

Gravity is split relative to the incline of the coaster track:

* ( mg \sin \theta ) controls forward acceleration along the track
* ( mg \cos \theta ) affects the normal force and perceived weight

As the angle (θ) of each track segment changes, these force components change as well, which directly alters the rider’s speed and how intense the motion feels in VR. Small angle changes result in smoother motion, while sharper changes increase acceleration and thrill.

On the psychology side, the project considers motion perception and comfort in VR:
1. Sudden acceleration changes can cause discomfort or motion sickness
2. Smooth angle transitions help the brain match visual motion with inner‑ear perception
3. Speed and slope are tuned to feel intense without breaking immersion

**Code snippet (physics logic):**

```js
let forceParallel = gravity * Math.sin(theta);
let acceleration = forceParallel;
velocity += acceleration * deltaTime;
position += velocity * deltaTime;
```

This makes the experience feel realistic and avoids motion that feels artificial or disconnected from physics.

---

## Technology (VR and real‑time computation)

Technology was used to built the software stack, suing javascript to model the physics and HTML for the web interface. It was also used through the intergation of VR frameworks with real-time physics calculations.

Technology is represented through the use of **VR frameworks and real‑time rendering**. The project continuously updates physics calculations and synchronizes them with the VR camera so that visual motion matches physical motion.


1. WEBXR was used to track headmovement and render stereo views. 

Physics calculations run every frame and directly affect the camera’s position, which is critical in VR to prevent discomfort or disorientation.

**Code snippet (update loop):**

```js
function update(deltaTime) {
  updatePhysics(deltaTime);
  camera.position.z = position;
}
```

The use of VR APIs allows head tracking and stereoscopic rendering, while the physics system ensures movement feels natural.

---

## Engineering (System design and stability)

Engineering is shown through how the motion system is structured and controlled. The coaster track is designed as connected segments, each with its own angle, allowing fine control over acceleration and smooth transitions.

Limits are placed on acceleration and velocity to maintain comfort in VR, and the physics system is separated from rendering logic to keep the code stable and maintainable.

**Code snippet (constraints):**

```js
velocity = Math.min(velocity, maxVelocity);
```

This ensures the system remains realistic and safe for the user while still being engaging.


## Mathematics (Trigonometry and motion calculations)

The vertical motion of the coaster is based on a sine wave. A sine wave starts at the midpoint and rises smoothly, which makes it suitable for a coaster start. Using a cosine wave would start at the crest, causing the coaster to begin at an unrealistic and overly high position.

Maths was also used to:
* Sine and cosine functions determine force components
* Time‑step calculations ensure frame‑rate independent motion
* Continuous position updates create smooth movement in 3D space

---

## Arts (Experience and feel)
The art compoenets focuses on how the VR world is perseived by the user. Including: 
1. Designing the 3D world (Mountins, environment, people)
2. Scaling objects like perseived in the world to feel belivable in VR

The use of large mountains and distant scenery exaggerate height, while correctly scaling human figures and object helps in judgement of speed and distance. These choices helped in influenceing the immersion of the experience.
