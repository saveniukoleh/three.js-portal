import * as THREE from "https://cdn.skypack.dev/three@0.128.0";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.128.0/examples/jsm/controls/OrbitControls.js";

/**
 * Comments:
 *  The zero layer is the actual scene, we don't want put 3d object over the object from the first layer, because they are gonna be
 *  overrides and cropped, we put them on a side or behind so they don't broke the experience
 *
 *  The first layer is the Portal, everything related to it is gonna act as portal view
 *
 *  The second layer is our second "scene" the objects which we wanna view through the portal, the first layer
 */

// Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const raycaster = new THREE.Raycaster();
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
const loader = new THREE.TextureLoader();
const collidableMeshList = [];
let insidePortal = false;

// Scene
camera.position.z = 5;
const cameraCubeSide = 0.001;
const cameraCube = new THREE.Mesh(
  new THREE.BoxGeometry(cameraCubeSide, cameraCubeSide, cameraCubeSide),
  new THREE.MeshBasicMaterial({ color: 0x00ffff })
);
cameraCube.name = "camera cube";
camera.add(cameraCube);

const cube = new THREE.Mesh(
  new THREE.BoxGeometry(),
  new THREE.MeshBasicMaterial({ color: 0x00ff00 })
);
cube.layers.set(2);
cube.position.set(0, 0, -5);
cube.name = "green cube";
scene.add(cube);

const cube2 = new THREE.Mesh(
  new THREE.BoxGeometry(),
  new THREE.MeshBasicMaterial({ color: 0xff0000 })
);
cube2.position.set(0, 0, 5);
cube2.name = "red cube";
scene.add(cube2);

// Skybox
const skyboxGeometry = new THREE.BoxGeometry(1000, 1000, 1000);
const materialArrayOptionSide = THREE.BackSide;
const materialArray = [
  new THREE.MeshBasicMaterial({
    map: loader.load("./assets/1028/px.png"),
    side: materialArrayOptionSide,
  }),
  new THREE.MeshBasicMaterial({
    map: loader.load("./assets/1028/nx.png"),
    side: materialArrayOptionSide,
  }),
  new THREE.MeshBasicMaterial({
    map: loader.load("./assets/1028/py.png"),
    side: materialArrayOptionSide,
  }),
  new THREE.MeshBasicMaterial({
    map: loader.load("./assets/1028/ny.png"),
    side: materialArrayOptionSide,
  }),
  new THREE.MeshBasicMaterial({
    map: loader.load("./assets/1028/pz.png"),
    side: materialArrayOptionSide,
  }),
  new THREE.MeshBasicMaterial({
    map: loader.load("./assets/1028/nz.png"),
    side: materialArrayOptionSide,
  }),
];
const skybox = new THREE.Mesh(skyboxGeometry, materialArray);
skybox.rotation.y = Math.PI;
skybox.scale.set(-1, 1, 1);
skybox.layers.set(2);
skybox.name = "skybox";
scene.add(skybox);

// Portal
const portalSize = {
  width: 3,
  heigh: 6,
};
const portalHallway = new THREE.Mesh(
  new THREE.BoxGeometry(
    portalSize.width,
    portalSize.heigh,
    portalSize.width * 2
  ),
  new THREE.MeshBasicMaterial({ color: "#0000ff" })
);
const portal = new THREE.Mesh(
  new THREE.PlaneGeometry(portalSize.width, portalSize.heigh),
  new THREE.MeshBasicMaterial({
    map: loader.load("./assets/sphere-colored.png"),
    color: 0x444444,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.6,
  })
);
portalHallway.material.visible = true;
portalHallway.name = "hallway";
collidableMeshList.push(portalHallway);
portal.add(portalHallway);
portal.layers.set(1);
portal.name = "portal";
scene.add(portal);

// This line from the thing
camera.layers.enable(1);

// Render
const animate = function () {
  requestAnimationFrame(animate);
  checkIntersection();
  checkScene();
  render();
};

function checkIntersection() {
  const generalIntersection = detectCollisionCubes(cameraCube, portalHallway);
  console.log(generalIntersection);
}

function checkScene() {
  let newInsidePortal = camera.position.z > 0 ? false : true;
  if (newInsidePortal !== insidePortal) {
    insidePortal = newInsidePortal;
    scene.traverse((object) => {
      if (object.isMesh) {
        if (object.layers.mask === 4) {
          object.layers.set(0);
        } else if (object.layers.mask === 1) {
          object.layers.set(2);
        }
      }
    });
  }
}
function detectCollisionCubes(object1, object2) {
  object1.geometry.computeBoundingBox(); //not needed if its already calculated
  object2.geometry.computeBoundingBox();
  object1.updateMatrixWorld();
  object2.updateMatrixWorld();

  const box1 = object1.geometry.boundingBox.clone();
  box1.applyMatrix4(object1.matrixWorld);

  const box2 = object2.geometry.boundingBox.clone();
  box2.applyMatrix4(object2.matrixWorld);

  return box1.intersectsBox(box2);
}

function render() {
  let gl = renderer.getContext("webgl");

  // clear buffers now: color, depth, stencil
  renderer.clear(true, true, true);
  // do not clear buffers before each render pass
  renderer.autoClear = false;

  // FIRST PASS
  // goal: using the stencil buffer, place 1's in position of first portal (layer 1)

  // enable the stencil buffer
  gl.enable(gl.STENCIL_TEST);

  // layer 1 contains only the first portal
  camera.layers.set(1);

  gl.stencilFunc(gl.ALWAYS, 1, 0xff);
  gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
  gl.stencilMask(0xff);

  // only write to stencil buffer (not color or depth)
  gl.colorMask(false, false, false, false);
  gl.depthMask(false);

  renderer.render(scene, camera);

  // SECOND PASS
  // goal: render skybox (layer 2) but only through portal

  gl.colorMask(true, true, true, true);
  gl.depthMask(true);

  gl.stencilFunc(gl.EQUAL, 1, 0xff);
  gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);

  camera.layers.set(2);
  renderer.render(scene, camera);

  // FINAL PASS
  // goal: render the rest of the scene (layer 0)

  // using stencil buffer simplifies drawing border around portal
  gl.stencilFunc(gl.NOTEQUAL, 1, 0xff);
  gl.colorMask(true, true, true, true);
  gl.depthMask(true);

  camera.layers.set(0); // layer 0 contains portal border mesh
  renderer.render(scene, camera);

  // set things back to normal
  renderer.autoClear = true;
}

window.addEventListener("resize", onWindowResize, false);

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

animate();
