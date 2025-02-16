<template>
  <div class="scene-container">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loader"></div>
      <p class="loading-text">正在加载星空场景...</p>
    </div>

    <!-- VR场景 -->
    <a-scene v-show="!loading" @loaded="onSceneLoaded">
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
      <a-circle
        position="0 0 0"
        rotation="-90 0 0"
        radius="4"
        material="shader: standard; color: #2a2a35; metalness: 0.2; roughness: 0.8; emissive: #1a1a25; emissiveIntensity: 0.8; 
        normalTextureRepeat: 5 5; normalTextureOffset: 0 0;
        src: https://cdn.aframe.io/a-painter/images/floor.jpg;
        repeat: 5 5"
      ></a-circle>
    </a-scene>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from "vue";

const loading = ref(true);

// 场景加载完成的回调
const onSceneLoaded = () => {
  // 给一个短暂的延迟确保所有资源都加载完成
  setTimeout(() => {
    loading.value = false;
  }, 500);
};

// 生成随机数在指定范围内
function random(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

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
  const starCount = 1000;
  const radius = 80000;

  for (let i = 0; i < starCount; i++) {
    // 使用更陡的幂函数来创造更多暗星星
    const magnitude = Math.pow(random(0, 1), 2) * 40 + 90;

    // 调整亮度范围，整体提亮一些
    const brightness = Math.pow(random(0, 1), 3) * 0.8 + 0.2;

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
  const milkyWayStars = 2000; // 减少星星数量
  const radius = 80000;
  const galaxyTilt = 60; // 银河倾角（度）
  const tiltRad = (galaxyTilt * Math.PI) / 180;

  // 创建螺旋结构
  function generateGalaxyPosition(
    r: number,
    theta: number
  ): { x: number; y: number; z: number } {
    // 增加螺旋臂的数量和清晰度
    const spiralFactor = 0.15;
    const numberOfArms = 2; // 主要的螺旋臂数量
    const armWidth = 8000; // 增加旋臂宽度

    // 创建更自然的螺旋臂，增加随机性
    const armOffset =
      Math.sin(theta * numberOfArms + r * spiralFactor) * armWidth;
    // 增加随机偏移范围
    const randomOffset = random(-4000, 4000) * (r / radius);
    const adjustedRadius = r + armOffset + randomOffset;

    // 基础平面坐标
    let x = adjustedRadius * Math.cos(theta + r * spiralFactor);
    let z = adjustedRadius * Math.sin(theta + r * spiralFactor);

    // 增加垂直方向的厚度，使用更平滑的分布
    const baseThickness = 6000; // 增加基础厚度
    const thicknessFalloff = Math.exp(-r / (radius * 0.7)); // 降低厚度衰减速度
    const thickness = baseThickness * thicknessFalloff + 2000;
    // 使用改进的高斯分布
    const gaussianFactor = Math.exp(-Math.pow(random(0, 1), 1.5));
    const y = random(-thickness, thickness) * gaussianFactor;

    // 应用倾斜角度
    const tiltedY = y * Math.cos(tiltRad) - z * Math.sin(tiltRad);
    const tiltedZ = y * Math.sin(tiltRad) + z * Math.cos(tiltRad);

    return { x, y: tiltedY, z: tiltedZ };
  }

  // 生成更丰富的恒星颜色
  function generateStarColor(): string {
    const colors = [
      "#ffffff", // 白色 (20%)
      "#fff4ea", // 略带黄的白色 (30%)
      "#eaeeff", // 略带蓝的白色 (20%)
      "#fff0e4", // 橙白色 (15%)
      "#ffeeda", // 黄白色 (15%)
    ];
    const weights = [0.2, 0.3, 0.2, 0.15, 0.15];
    const rand = Math.random();
    let sum = 0;
    for (let i = 0; i < weights.length; i++) {
      sum += weights[i];
      if (rand < sum) return colors[i];
    }
    return colors[0];
  }

  for (let i = 0; i < milkyWayStars; i++) {
    // 使用更分散的分布
    const theta = random(0, Math.PI * 2);
    // 使用更平缓的径向分布
    const r = Math.pow(random(0.2, 1), 0.8) * radius;
    const pos = generateGalaxyPosition(r, theta);

    // 调整亮度分布，使边缘区域更明显
    const distanceFromCenter =
      Math.sqrt(pos.x * pos.x + pos.z * pos.z) / radius;
    const centralBrightness = Math.max(0.25, 1 - distanceFromCenter);
    const opacity =
      Math.pow(random(0.6, 1), 1.5) * 0.6 + centralBrightness * 0.5;

    // 调整大小分布，整体减小星星尺寸
    const size =
      random(25, 30) * (0.7 + Math.pow(1 - distanceFromCenter, 2) * 0.2);
    const color = generateStarColor();

    stars.value.push({
      id: `milkyway-${i}`,
      position: `${pos.x} ${pos.y} ${pos.z}`,
      size: size,
      material: `shader: standard; color: ${color}; opacity: ${opacity}; transparent: true; metalness: 0.1; roughness: 0.9; emissive: ${color}; emissiveIntensity: ${
        opacity * 0.5 // 略微增加发光强度来补偿尺寸减小
      };`,
    });

    // 调整光源分布
    if (distanceFromCenter < 0.3 && i % 300 === 0) {
      // 减少光源数量
      stars.value.push({
        id: `milkyway-light-${i}`,
        position: `${pos.x} ${pos.y} ${pos.z}`,
        size: 1,
        material: "shader: standard; opacity: 0;",
        light: `type: point; intensity: ${
          opacity * 0.6 // 略微增加光源强度
        }; distance: 25000; decay: 2; color: ${color};`,
      });
    }
  }
  console.log("Milky way stars added:", milkyWayStars);
}

onMounted(() => {
  setTimeout(() => {
    initStars();
    addMilkyWay();
  }, 200);
});
</script>

<style scoped>
/* 确保场景占满整个视口 */
.scene-container {
  height: 100vh;
  width: 100vw;
  position: relative;
}

:deep(a-scene) {
  height: 100vh;
  width: 100vw;
}

/* 加载遮罩层 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #000005;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

/* 加载动画 */
.loader {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top-color: #ffffff;
  animation: spin 1s linear infinite;
}

.loading-text {
  color: #ffffff;
  font-size: 1.2rem;
  margin-top: 1.5rem;
  font-weight: 300;
  letter-spacing: 0.1em;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
