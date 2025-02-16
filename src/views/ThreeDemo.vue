<template>
  <div ref="containerRef"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import * as THREE from "three";
// import { OrbitControls } from "three/addons/controls/OrbitControls";
// import { XRButton } from "three/addons/webxr/XRButton";
// import { XRControllerModelFactory } from "three/addons/webxr/XRControllerModelFactory";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { XRButton } from "three/addons/webxr/XRButton.js";
import { XRControllerModelFactory } from "three/addons/webxr/XRControllerModelFactory.js";

// 组件引用
const containerRef = ref<HTMLDivElement | null>(null);

// 场景相关变量
let camera: THREE.PerspectiveCamera;
let scene: THREE.Scene;
let renderer: THREE.WebGLRenderer;
let controller1: THREE.XRTargetRaySpace;
let controller2: THREE.XRTargetRaySpace;
let controllerGrip1: THREE.XRGripSpace;
let controllerGrip2: THREE.XRGripSpace;
const box = new THREE.Box3();

interface Controller {
  gamepad: Gamepad;
  grip: THREE.XRGripSpace;
  colliding: boolean;
  playing: boolean;
  controller?: THREE.XRTargetRaySpace;
}

const controllers: Controller[] = [];
const oscillators: OscillatorNode[] = [];
let controls: OrbitControls;
let group: THREE.Group;
let audioCtx: AudioContext | null = null;

// 音乐音阶
const musicScale = [0, 3, 5, 7, 10];

function initAudio() {
  if (audioCtx !== null) {
    return;
  }

  audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

  function createOscillator() {
    const oscillator = audioCtx!.createOscillator();
    oscillator.type = "sine";
    oscillator.start();
    return oscillator;
  }

  oscillators.push(createOscillator());
  oscillators.push(createOscillator());
  (window as any).oscillators = oscillators;
}

function init() {
  if (!containerRef.value) return;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x808080);

  camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    10
  );
  camera.position.set(0, 1.6, 3);

  controls = new OrbitControls(camera, containerRef.value);
  controls.target.set(0, 1.6, 0);
  controls.update();

  // 地板
  const floorGeometry = new THREE.PlaneGeometry(4, 4);
  const floorMaterial = new THREE.ShadowMaterial({
    opacity: 0.25,
    blending: THREE.CustomBlending,
    transparent: false,
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // 灯光
  scene.add(new THREE.HemisphereLight(0xbcbcbc, 0xa5a5a5, 3));

  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(0, 6, 0);
  light.castShadow = true;
  light.shadow.camera.top = 2;
  light.shadow.camera.bottom = -2;
  light.shadow.camera.right = 2;
  light.shadow.camera.left = -2;
  light.shadow.mapSize.set(4096, 4096);
  scene.add(light);

  // 创建交互物体组
  group = new THREE.Group();
  group.position.z = -0.5;
  scene.add(group);

  const BOXES = 10;
  for (let i = 0; i < BOXES; i++) {
    const intensity = (i + 1) / BOXES;
    const w = 0.1;
    const h = 0.05 * i + 0.5;
    const geometry = new THREE.BoxGeometry(w, h, w);
    geometry.translate(0, h / 2, 0);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(intensity, 0.1, 0.1),
      roughness: 0.7,
      metalness: 0.0,
    });

    const object = new THREE.Mesh(geometry, material);
    object.position.x = (i - 5) * (w + 0.05);
    object.castShadow = true;
    object.receiveShadow = true;
    object.userData = {
      index: i + 1,
      intensity: intensity,
    };

    group.add(object);
  }

  // 渲染器设置
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  renderer.shadowMap.enabled = true;
  renderer.xr.enabled = true;
  containerRef.value.appendChild(renderer.domElement);

  // VR 按钮
  const xrButton = XRButton.createButton(renderer);
  xrButton.addEventListener("click", initAudio);
  document.body.appendChild(xrButton);

  // 控制器设置
  controller1 = renderer.xr.getController(0);
  scene.add(controller1);

  controller2 = renderer.xr.getController(1);
  scene.add(controller2);

  const controllerModelFactory = new XRControllerModelFactory();

  controllerGrip1 = renderer.xr.getControllerGrip(0);
  controllerGrip1.addEventListener("connected", controllerConnected);
  controllerGrip1.addEventListener("disconnected", controllerDisconnected);
  controllerGrip1.add(
    controllerModelFactory.createControllerModel(controllerGrip1)
  );
  scene.add(controllerGrip1);

  controllerGrip2 = renderer.xr.getControllerGrip(1);
  controllerGrip2.addEventListener("connected", controllerConnected);
  controllerGrip2.addEventListener("disconnected", controllerDisconnected);
  controllerGrip2.add(
    controllerModelFactory.createControllerModel(controllerGrip2)
  );
  scene.add(controllerGrip2);

  window.addEventListener("resize", onWindowResize);
}

function controllerConnected(evt: any) {
  controllers.push({
    gamepad: evt.data.gamepad,
    grip: evt.target,
    colliding: false,
    playing: false,
  });
}

function controllerDisconnected(evt: any) {
  const index = controllers.findIndex((o) => o.controller === evt.target);
  if (index !== -1) {
    controllers.splice(index, 1);
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function handleCollisions() {
  for (const child of group.children) {
    (child as any).collided = false;
  }

  for (let g = 0; g < controllers.length; g++) {
    const controller = controllers[g];
    controller.colliding = false;

    const { grip, gamepad } = controller;
    const sphere = {
      radius: 0.03,
      center: grip.position,
    };

    const supportHaptic =
      "hapticActuators" in gamepad &&
      gamepad.hapticActuators != null &&
      gamepad.hapticActuators.length > 0;

    for (let i = 0; i < group.children.length; i++) {
      const child = group.children[i] as THREE.Mesh;
      box.setFromObject(child);

      if (box.intersectsSphere(sphere as any)) {
        (child.material as THREE.MeshStandardMaterial).emissive.b = 1;
        const intensity = child.userData.index / group.children.length;
        child.scale.setScalar(1 + Math.random() * 0.1 * intensity);

        if (supportHaptic && gamepad.hapticActuators[0]) {
          gamepad.hapticActuators[0].pulse(intensity, 100);
        }

        const musicInterval =
          musicScale[child.userData.index % musicScale.length] +
          12 * Math.floor(child.userData.index / musicScale.length);
        oscillators[g].frequency.value = 110 * Math.pow(2, musicInterval / 12);
        controller.colliding = true;
        (child as any).collided = true;
      }
    }

    if (controller.colliding) {
      if (!controller.playing) {
        controller.playing = true;
        oscillators[g].connect(audioCtx!.destination);
      }
    } else {
      if (controller.playing) {
        controller.playing = false;
        oscillators[g].disconnect(audioCtx!.destination);
      }
    }
  }

  for (const child of group.children) {
    if (!(child as any).collided) {
      (
        (child as THREE.Mesh).material as THREE.MeshStandardMaterial
      ).emissive.b = 0;
      child.scale.setScalar(1);
    }
  }
}

function animate() {
  handleCollisions();
  renderer.render(scene, camera);
}

// 生命周期钩子
onMounted(() => {
  init();
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onWindowResize);

  // 清理资源
  if (audioCtx) {
    audioCtx.close();
  }

  oscillators.forEach((osc) => {
    osc.stop();
    osc.disconnect();
  });

  renderer.dispose();
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      object.material.dispose();
    }
  });
});
</script>

<style scoped>
div {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
}
</style>
