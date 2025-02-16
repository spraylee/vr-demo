<script setup lang="ts">
// import "aframe";
</script>

<template>
  <a-scene vr-mode-ui="enabled: true" webxr="requiredFeatures: local-floor;">
    <!-- 环境 -->
    <a-sky color="#ECECEC"></a-sky>
    <a-plane
      position="0 0 -4"
      rotation="-90 0 0"
      width="4"
      height="4"
      color="#7BC8A4"
    ></a-plane>

    <!-- 3D 对象 -->
    <a-box position="-1 0.5 -3" rotation="0 45 0" color="#4CC3D9"></a-box>
    <a-sphere position="0 1.25 -5" radius="1.25" color="#EF2D5E"></a-sphere>
    <a-cylinder
      position="1 0.75 -3"
      radius="0.5"
      height="1.5"
      color="#FFC65D"
    ></a-cylinder>

    <!-- 文本 -->
    <a-text
      value="Quest 3 VR Demo"
      position="-1 2 -3"
      color="#000"
      scale="1.5 1.5 1.5"
    ></a-text>

    <!-- 控制器 -->
    <a-entity oculus-touch-controls="hand: left"></a-entity>
    <a-entity oculus-touch-controls="hand: right"></a-entity>

    <!-- 环境光 -->
    <a-light type="ambient" color="#445451"></a-light>
    <a-light type="point" intensity="2" position="2 4 4"></a-light>
  </a-scene>
</template>

<style scoped>
/* 移除 Vue 默认样式，让 A-Frame 场景全屏显示 */
:deep(body) {
  margin: 0;
  padding: 0;
}

:deep(a-scene) {
  height: 100vh;
  width: 100vw;
}
</style>
