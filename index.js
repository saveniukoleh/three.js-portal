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
const secondCamera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.update();

const loader = new THREE.TextureLoader();

camera.position.z = 0.5;

// Scene
const geometry = new THREE.BoxGeometry(1000, 1000, 1000);
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
const cube = new THREE.Mesh(geometry, materialArray);
cube.rotation.y = Math.PI;
cube.scale.set(-1, 1, 1);
cube.layers.set(2);
scene.add(cube);

const geometry1 = new THREE.PlaneGeometry(0.3, 0.6);
const material1 = new THREE.MeshBasicMaterial({
  color: 0x00ff00,
  transparent: true,
  opacity: 0.5,
  side: 2,
});
const cube1 = new THREE.Mesh(geometry1, material1);
cube1.layers.set(2);
scene.add(cube1);

const cubeHelp = new THREE.Mesh(
  new THREE.BoxGeometry(10, 10),
  new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    transparent: true,
    opacity: 0.5,
    side: 2,
  })
);
cubeHelp.layers.set(0);
// scene.add(cubeHelp);

const cube2 = new THREE.Mesh(
  new THREE.PlaneGeometry(0.3, 0.6),
  new THREE.MeshBasicMaterial({
    color: 0xff0000,
    transparent: true,
    opacity: 0.5,
    side: 2,
  })
);
cube2.layers.set(2);
scene.add(cube2);

// Animate

const animate = function () {
  requestAnimationFrame(animate);
  update();
  render();
};

function update() {
  secondCamera.position.copy(camera.position);
  secondCamera.quaternion.copy(camera.quaternion);
  controls.update();
}

function render() {
  let scenario = 0;

  if (scenario === 0) {
    secondCamera.layers.enable(0);
    secondCamera.layers.enable(2);
    renderer.render(scene, secondCamera);
  } else if (scenario === 1) {
    camera.layers.enable(0);
    camera.layers.enable(1);
    renderer.render(scene, camera);
  } else if (scenario === 2) {
    let gl = renderer.getContext("webgl");

    // clear buffers now: color, depth, stencil
    renderer.clear(true, true, true);
    // do not clear buffers before each render pass
    renderer.autoClear = false;

    // FIRST PASS
    // goal: using the stencil buffer, place 1's in position of first portal

    // enable the stencil buffer
    gl.enable(gl.STENCIL_TEST);
    camera.layers.set(1);

    gl.stencilFunc(gl.ALWAYS, 1, 0xff);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
    gl.stencilMask(0xff);

    // only write to stencil buffer (not color or depth)
    gl.colorMask(false, false, false, false);
    gl.depthMask(false);

    renderer.render(scene, camera);

    // SECOND PASS
    // goal: draw from the portal camera perspective (which is aligned relative to the second portal)
    //   in the first portal region (set by the stencil in the previous pass)

    // set up a clipping plane, so that portal camera does not see anything between
    //   the portal camera and the second portal

    // default normal of a plane is 0,0,1. apply mesh rotation to it.

    // determine which side of the plane camera is on, for clipping plane orientation.
    let portalToCamera = new THREE.Vector3().subVectors(
      camera.position.clone(),
      cube1.position.clone()
    );
    let normalPortal = new THREE.Vector3(0, 0, 1).applyQuaternion(
      cube1.quaternion
    );
    let clipSide = -Math.sign(portalToCamera.dot(normalPortal));

    let clipNormal = new THREE.Vector3(0, 0, clipSide).applyQuaternion(
      cube2.quaternion
    );
    let clipPoint = cube2.position;
    let clipPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(
      clipNormal,
      clipPoint
    );
    renderer.clippingPlanes = [clipPlane];

    gl.colorMask(true, true, true, true);
    gl.depthMask(true);

    gl.stencilFunc(gl.EQUAL, 1, 0xff);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);

    secondCamera.layers.set(2);
    renderer.render(scene, secondCamera);

    // disable clipping planes
    renderer.clippingPlanes = [];

    // THIRD PASS
    // goal: set the depth buffer data for the first portal,
    //   so that it can be occluded by other objects

    // finished with stencil
    gl.disable(gl.STENCIL_TEST);

    gl.colorMask(false, false, false, false);
    gl.depthMask(true);
    // need to clear the depth buffer, in case of occlusion
    renderer.clear(false, true, false);
    renderer.render(scene, camera);

    // FINAL PASS
    // goal: draw the rest of the scene

    gl.colorMask(true, true, true, true);
    gl.depthMask(true);

    camera.layers.set(0); // layer 0 contains everything but portals
    renderer.render(scene, camera);

    // set things back to normal
    renderer.autoClear = true;
  }
}

animate();
