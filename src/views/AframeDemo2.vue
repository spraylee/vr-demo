<template>
  <a-scene
    xr-mode-ui="enterVRButton: #myEnterVRButton; enterARButton: #myEnterARButton; XRMode: xr;"
    webxr="requiredFeatures: local-floor;"
    renderer="antialias: true"
  >
    <!-- 动态粒子背景 -->
    <a-entity
      particle-system="preset: snow; color: #00F0FF; particleCount: 200"
      position="0 0 -5"
    ></a-entity>

    <!-- 文本 -->
    <a-text
      :value="fps"
      position="0 1.5 -2"
      color="#fff"
      scale="1.5 1.5 1.5"
    ></a-text>
    <a-text
      :value="`count: ${count}`"
      position="0 2 -3"
      color="#fff"
      scale="1.5 1.5 1.5"
    ></a-text>

    <!-- 主立方体 -->
    <a-box
      class="clickable"
      :position="`${boxPosition.x} ${boxPosition.y} ${boxPosition.z}`"
      :rotation="`${boxRotation.x} ${boxRotation.y} ${boxRotation.z}`"
      :width="boxSize"
      :height="boxSize"
      :depth="boxSize"
      :color="boxColor"
      animation="property: rotation; to: 0 360 0; loop: true; dur: 10000"
    >
      <a-entity
        animation="property: position; dir: alternate; dur: 2000; loop: true; to: 0 2 0"
        position="0 0 0"
      >
        <a-sphere
          :radius="sphereRadius"
          color="#FF3F7F"
          position="0 1.5 0"
        ></a-sphere>
      </a-entity>
    </a-box>

    <!-- 光线效果 -->
    <a-light type="point" intensity="0.8" position="2 4 -2"></a-light>
    <a-light type="ambient" intensity="0.3"></a-light>

    <!-- 控制器 -->
    <a-entity oculus-touch-controls="hand: left"></a-entity>
    <a-entity oculus-touch-controls="hand: right"></a-entity>

    <!-- 环境光 -->
    <a-light type="ambient" color="#445451"></a-light>
    <a-light type="point" intensity="2" position="2 4 4"></a-light>

    <!-- 地面 -->
    <!-- <a-plane
      position="0 0 -4"
      rotation="-90 0 0"
      width="400"
      height="400"
      color="#222222"
    ></a-plane> -->

    <!-- 漂浮的小球 -->
    <a-entity
      v-for="(position, index) in items"
      :key="index"
      :position="`${position.x} ${position.y} ${position.z}`"
    >
      <a-sphere
        :radius="position.radius"
        :color="position.color"
        :material="`emissiveIntensity: ${position.intensity}`"
      ></a-sphere>
    </a-entity>

    <!-- 相机控制 -->
    <!-- <a-entity
      id="camera"
      camera
      look-controls
      wasd-controls
      position="0 1.6 5"
    ></a-entity> -->
  </a-scene>
  <div
    class="flex fixed bottom-[10%] w-auto justify-center left-1/2 -translate-x-1/2"
  >
    <button id="myEnterVRButton">进入VR模式</button>
    <button id="myEnterARButton">进入AR模式</button>
  </div>
</template>

<script setup lang="ts">
import { color } from "three/tsl";
import { ref, reactive, onMounted } from "vue";

// 响应式数据
const boxSize = ref(1.5);
const boxColor = ref("#00FF88");
const sphereRadius = ref(0.3);
const boxPosition = reactive({ x: 0, y: 0, z: -4 });
const boxRotation = reactive({ x: 0, y: 0, z: 0 });

const fps = ref(60);
const count = ref(0);

let lastTime = Date.now();

const items = Array(500)
  .fill(0)
  .map((_, i) => ({
    x: Math.random() * 20 - 10,
    y: 0 + Math.random() * 10,
    z: Math.random() * 20 - 10,
    color: `hsl(${Math.random() * 360}, 70%, 60%)`,
    radius: 0.02 + Math.random() * 0.2,
    // 亮度随机
    intensity: Math.random(),
  }));

let animationFrameId: number;

const startNormalLoop = () => {
  const update = () => {
    count.value++;
    const now = Date.now();
    fps.value = Math.floor(1000 / (now - lastTime));
    lastTime = now;
    animationFrameId = requestAnimationFrame(update);
  };
  animationFrameId = requestAnimationFrame(update);
};

const startXRLoop = (xrSession: XRSession) => {
  const update = (time: number, frame: XRFrame) => {
    count.value++;
    const now = Date.now();
    fps.value = Math.floor(1000 / (now - lastTime));
    lastTime = now;
    xrSession.requestAnimationFrame(update);
  };
  xrSession.requestAnimationFrame(update);
};

onMounted(() => {
  const scene = document.querySelector("a-scene");
  scene.addEventListener("enter-vr", () => {
    cancelAnimationFrame(animationFrameId); // 停止普通循环
    startXRLoop(scene.renderer.xr.getSession()!);
  });
  scene.addEventListener("exit-vr", () => {
    startNormalLoop(); // 退出 VR 后恢复普通循环
  });
  startNormalLoop();
});
// // 动态更新立方体位置
// onMounted(() => {
//   let angle = 0;
//   const loop = () => {
//     angle += 0.02;
//     boxPosition.y = Math.sin(angle) * 1.5 + 2.5;
//     boxRotation.x = angle * 50;
//     boxRotation.z = angle * 30;
//     requestAnimationFrame(loop);
//   };
//   // 改为流畅的动画
//   requestAnimationFrame(loop);
// });

// // 点击交互处理
// const handleSceneClick = (event: any) => {
//   if (event.detail.intersectedEl) {
//     boxColor.value = `hsl(${Math.random() * 360}, 70%, 60%)`;
//     sphereRadius.value = 0.3 + Math.random() * 0.5;
//   }
// };

const enterVrMode = () => {
  console.log("进入VR模式");
};
</script>
