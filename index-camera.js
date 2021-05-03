import * as THREE from "https://cdn.skypack.dev/three@0.128.0";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.128.0/examples/jsm/controls/OrbitControls.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const textureCamera = new THREE.PerspectiveCamera(75, 400 / 800, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.autoClear = false;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.update();

// const finalRenderTarget = new THREE.WebGLRenderTarget(
//   window.innerWidth,
//   window.innerHeight,
//   {
//     minFilter: THREE.LinearFilter,
//     magFilter: THREE.LinearFilter,
//     format: THREE.RGBFormat,
//   }
// );
// const geometry = new THREE.PlaneGeometry(2, 2);
// const material = new THREE.MeshBasicMaterial({
//   map: finalRenderTarget,
// });
// const plane = new THREE.Mesh(geometry, material);
// scene.add(plane);

const renderTarget = new THREE.WebGLRenderTarget(400, 800, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBFormat,
});

var planelikeGeometry = new THREE.PlaneGeometry(2, 4);
var plane = new THREE.Mesh(
  planelikeGeometry,
  new THREE.MeshBasicMaterial({ map: renderTarget })
);
scene.add(plane);

camera.position.z = 5;

const loader = new THREE.TextureLoader();
const texture = loader.load("./assets/Makerspace.jpg", () => {
  const rt = new THREE.WebGLCubeRenderTarget(texture.image.height);
  rt.fromEquirectangularTexture(renderer, texture);
  scene.background = rt.texture;
});

const animate = function () {
  requestAnimationFrame(animate);
  update();
  render();
};
// window.addEventListener("resize", onWindowResize, false);

// function onWindowResize() {
//   camera.aspect = window.innerWidth / window.innerHeight;
//   camera.updateProjectionMatrix();

//   renderer.setSize(window.innerWidth, window.innerHeight);
// }

function update() {
  var relativeCameraOffset = new THREE.Vector3(0, 0, 0);
  var cameraOffset = camera.matrixWorld.multiplyVector3(relativeCameraOffset);
  textureCamera.position.x = cameraOffset.x;
  textureCamera.position.y = cameraOffset.y;
  textureCamera.position.z = cameraOffset.z;
  var relativeCameraLookOffset = new THREE.Vector3(0, 0, -1);
  var cameraLookOffset = relativeCameraLookOffset.applyMatrix4(
    camera.matrixWorld
  );
  textureCamera.lookAt(cameraLookOffset);
  console.log(cameraLookOffset);
}

function render() {
  //   renderer.render(scene, textureCamera, firstRenderTarget, true);
  //   renderer.render(screenScene, screenCamera, finalRenderTarget, true);
  //   renderer.render(scene, camera, finalRenderTarget, true);
  //   renderer.render(screenScene, screenCamera);
  //   renderer.render(scene, camera);
  //   renderer.clear();

  renderer.setRenderTarget(null);
  renderer.render(scene, camera);

  renderer.setRenderTarget(renderTarget);
  renderer.render(scene, textureCamera);
}

const screenScene = new THREE.Scene();

const screenCamera = new THREE.OrthographicCamera(
  window.innerWidth / -2,
  window.innerWidth / 2,
  window.innerHeight / 2,
  window.innerHeight / -2,
  -10000,
  10000
);
screenCamera.position.z = 1;
screenScene.add(screenCamera);

const screenGeometry = new THREE.PlaneGeometry(
  window.innerWidth,
  window.innerHeight
);

const firstRenderTarget = new THREE.WebGLRenderTarget(
  window.innerWidth,
  window.innerHeight,
  {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBFormat,
  }
);
const screenMaterial = new THREE.MeshBasicMaterial({
  color: "#ff0000",
  //   map: firstRenderTarget,
});

const quad = new THREE.Mesh(screenGeometry, screenMaterial);
screenCamera.add(quad);

animate();
