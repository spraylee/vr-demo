<template>
  <a-scene>
    <!-- 相机设置 -->
    <a-entity position="0 1.6 0">
      <a-camera far="100000" near="0.1" fov="90"></a-camera>
    </a-entity>

    <!-- 天空盒 - 使用深色背景 -->
    <a-sky color="#000005" radius="90000"></a-sky>

    <!-- 星星群 -->
    <a-entity position="0 0 0" id="starField">
      <template v-for="star in stars" :key="star.id">
        <a-entity :position="star.position" :light="star.light">
          <a-sphere :radius="star.size" :material="star.material"></a-sphere>
        </a-entity>
      </template>
    </a-entity>

    <!-- 地面 - 可选，用于参考 -->
    <a-plane
      position="0 0 0"
      rotation="-90 0 0"
      width="100"
      height="100"
      color="#111"
    ></a-plane>
  </a-scene>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";

// 生成随机数在指定范围内
function random(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// 生成球面坐标
function generateSphericalPosition(radius: number): string {
  const theta = random(0, Math.PI * 2); // 方位角
  const phi = Math.acos(random(-1, 1)); // 天顶角

  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);

  return `${x} ${y} ${z}`;
}

// 星星数据
const stars = ref<any[]>([]);

// 初始化星空
function initStars() {
  const starCount = 3000;
  const radius = 80000;

  for (let i = 0; i < starCount; i++) {
    // 使用更陡的幂函数来创造更多暗星星
    const magnitude = Math.pow(random(0, 1), 2) * 100 + 50;

    // 调整亮度范围，整体提亮一些
    const brightness = Math.pow(random(0, 1), 3) * 0.5 + 0.3;

    stars.value.push({
      id: i,
      position: generateSphericalPosition(radius),
      size: magnitude,
      material: `shader: standard; color: #ffffff; opacity: ${brightness}; transparent: true; metalness: 0.1; roughness: 0.9; emissive: #ffffff; emissiveIntensity: ${
        brightness * 0.4
      };`,
      light:
        i < 50
          ? `type: point; intensity: ${
              brightness * 0.6
            }; distance: 20000; decay: 2`
          : null,
    });
  }
  console.log("Stars generated:", stars.value.length);
}

// 添加银河带
function addMilkyWay() {
  const milkyWayStars = 3000;
  const radius = 80000;

  for (let i = 0; i < milkyWayStars; i++) {
    const theta = random(0, Math.PI * 2);
    const width = random(-2000, 2000);

    const x = radius * Math.cos(theta);
    const y = width + random(-500, 500);
    const z = radius * Math.sin(theta);

    const size = random(80, 180);
    // 调整银河带亮度
    const opacity = Math.pow(random(0, 1), 2.5) * 0.4 + 0.3;

    stars.value.push({
      id: `milkyway-${i}`,
      position: `${x} ${y} ${z}`,
      size: size,
      material: `shader: standard; color: #ffffff; opacity: ${opacity}; transparent: true; metalness: 0.1; roughness: 0.9; emissive: #ffffff; emissiveIntensity: ${
        opacity * 0.4
      };`,
    });
  }
  console.log("Milky way stars added:", milkyWayStars);
}

onMounted(() => {
  initStars();
  addMilkyWay();
});
</script>

<style scoped>
/* 确保场景占满整个视口 */
:deep(a-scene) {
  height: 100vh;
  width: 100vw;
}
</style>
