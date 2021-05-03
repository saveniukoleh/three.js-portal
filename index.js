import * as THREE from "https://cdn.skypack.dev/three@0.128.0";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.128.0/examples/jsm/controls/OrbitControls.js";

// Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
const loader = new THREE.TextureLoader();

// Scene
camera.position.z = 5;

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
scene.add(skybox);

// Portal
let defaultMaterial = new THREE.MeshBasicMaterial({
  map: loader.load("./assets/sphere-colored.png"),
  color: 0x444444,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.6,
});

let portalWidth = 2;
let portalHeight = 4;
let portalBorder = 0.1;

const portal = new THREE.Mesh(
  new THREE.PlaneGeometry(portalWidth, portalHeight),
  defaultMaterial
);
portal.layers.set(1);
scene.add(portal);

// This line from the thing
camera.layers.enable(1);

// Portal border
let portalMaterial = new THREE.MeshBasicMaterial({
  color: 0xffff00,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.75,
});

let portalBorderMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(
    portalWidth + 2 * portalBorder,
    portalHeight + 2 * portalBorder
  ),
  portalMaterial
);
portalBorderMesh.position.y = portal.position.y;
portalBorderMesh.layers.set(0);
scene.add(portalBorderMesh);
// const geometry = new THREE.BoxGeometry();
// const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
// const cube = new THREE.Mesh(geometry, material);
// scene.add(cube);

// Render
const animate = function () {
  requestAnimationFrame(animate);
  render();
};

function render() {
  //   renderer.render(scene, camera);
  //   return;
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

animate();
