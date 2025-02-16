<template>
  <div class="container">
    <canvas ref="canvasRef" class="scene"></canvas>
    <button @click="enterVR" class="vr-button">Enter VR</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import * as THREE from "three";
import { VRButton } from "three/addons/webxr/VRButton.js";

// 星系参数调整
const UNIVERSE_CONFIG = {
  STARFIELD_RADIUS: 15000, // 星场半径扩大100倍
  MILKY_WAY_RADIUS: 8000, // 银河半径扩大80倍
  DISTANCE_SCALE: 1000, // 空间缩放系数
  // DISTANCE_SCALE: 0.001, // 空间缩放系数
};

// 恒星类型配置（基于赫罗图参数）
interface StarConfig {
  sizeRange: [number, number]; // 视觉大小范围
  brightnessRange: [number, number]; // 亮度系数范围
  density: number; // 分布密度权重
  color: THREE.Color; // 基础颜色
  temperature: number; // 色温（K）
}

// 在初始化场景前添加纹理创建逻辑
function createCircleTexture() {
  const canvas = document.createElement(
    "canvas"
  ) as unknown as HTMLCanvasElement;
  const size = 32;
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();

  return new THREE.CanvasTexture(canvas);
}

// 在创建材质时使用该纹理
const starTexture = createCircleTexture();

const STAR_CONFIGS: Record<string, StarConfig> = {
  O: {
    sizeRange: [0.4, 0.7],
    brightnessRange: [0.9, 1.0],
    density: 0.02,
    color: new THREE.Color(0x4d7fff),
    temperature: 30000,
  },
  B: {
    sizeRange: [0.3, 0.5],
    brightnessRange: [0.8, 0.9],
    density: 0.05,
    color: new THREE.Color(0x8fb6ff),
    temperature: 20000,
  },
  A: {
    sizeRange: [0.15, 0.25],
    brightnessRange: [0.6, 0.8],
    density: 0.1,
    color: new THREE.Color(0xffffff),
    temperature: 10000,
  },
  F: {
    sizeRange: [0.1, 0.2],
    brightnessRange: [0.5, 0.7],
    density: 0.15,
    color: new THREE.Color(0xfff2d4),
    temperature: 5000,
  },
  G: {
    sizeRange: [0.08, 0.15],
    brightnessRange: [0.4, 0.6],
    density: 0.2,
    color: new THREE.Color(0xffd8a3),
    temperature: 4000,
  },
  K: {
    sizeRange: [0.06, 0.12],
    brightnessRange: [0.3, 0.5],
    density: 0.25,
    color: new THREE.Color(0xffb885),
    temperature: 3000,
  },
  M: {
    sizeRange: [0.1, 0.2],
    brightnessRange: [0.3, 0.5],
    density: 0.3,
    color: new THREE.Color(0xff9e6a),
    temperature: 3200,
  },
};

Object.keys(STAR_CONFIGS).forEach((type) => {
  const config = STAR_CONFIGS[type];
  config.brightnessRange = config.brightnessRange.map((v) => v * 10);
});

// 银河生成参数
const MILKY_WAY_CONFIG = {
  SPIRAL_ARMS: 4, // 螺旋臂数量
  DISC_RADIUS: 100, // 银盘半径
  DISC_HEIGHT: 8, // 银盘基础高度
  ARM_WIDTH: 0.4, // 旋臂宽度系数
  PERTURBATION: 0.3, // 位置扰动幅度
};

const canvasRef = ref<HTMLCanvasElement | null>(null);
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let stars: THREE.Points;
let milkyWay: THREE.Points;

/**
 * 生成恒星位置数据（球状分布）
 * @param numStars 星星数量
 * @param radius 分布半径
 */
function createStarField(numStars: number, radius: number): THREE.Points {
  const positions: number[] = [];
  const colors: number[] = [];
  const sizes: number[] = [];

  for (let i = 0; i < numStars; i++) {
    // 使用对数分布确保距离分布更合理
    const logRadius = Math.log10(1 + Math.random() * 9) * radius;
    const theta = Math.acos(2 * Math.random() - 1);
    const phi = Math.random() * Math.PI * 2;

    const x = logRadius * Math.sin(theta) * Math.cos(phi);
    const y = logRadius * Math.sin(theta) * Math.sin(phi);
    const z = logRadius * Math.cos(theta);

    // 应用空间缩放
    positions.push(
      x * UNIVERSE_CONFIG.DISTANCE_SCALE,
      y * UNIVERSE_CONFIG.DISTANCE_SCALE,
      z * UNIVERSE_CONFIG.DISTANCE_SCALE
    );

    // 根据密度加权随机选择恒星类型
    const type = weightedRandomType();
    const config = STAR_CONFIGS[type];
    // console.log("config", config);
    // console.log("type", type);

    // 计算最终亮度和大小
    const brightness = THREE.MathUtils.randFloat(...config.brightnessRange);
    const size = THREE.MathUtils.randFloat(...config.sizeRange);

    // 应用亮度到颜色（模拟星光强度）
    const color = config.color.clone().multiplyScalar(brightness);
    colors.push(color.r, color.g, color.b);
    sizes.push(size);
  }

  return createPoints(positions, colors, sizes);
}

/**
 * 生成银河系恒星（盘状分布）
 * @param numStars 星星数量
 */
function createMilkyWay(numStars: number): THREE.Points {
  const positions: number[] = [];
  const colors: number[] = [];
  const sizes: number[] = [];

  for (let i = 0; i < numStars; i++) {
    // 螺旋臂生成算法
    const armIndex = Math.floor(Math.random() * MILKY_WAY_CONFIG.SPIRAL_ARMS);
    const baseAngle = (armIndex / MILKY_WAY_CONFIG.SPIRAL_ARMS) * Math.PI * 2;

    // 对数螺旋线公式 r = a*e^(bθ)
    const r = Math.sqrt(Math.random()) * MILKY_WAY_CONFIG.DISC_RADIUS;
    const theta = baseAngle + 5 * Math.log(r + 1);

    // 添加极坐标扰动
    const perturbation = THREE.MathUtils.randFloatSpread(
      MILKY_WAY_CONFIG.PERTURBATION * r
    );

    const x =
      r * Math.cos(theta) + perturbation * UNIVERSE_CONFIG.DISTANCE_SCALE;
    const z =
      r * Math.sin(theta) + perturbation * UNIVERSE_CONFIG.DISTANCE_SCALE;

    // 银盘高度分布（中间厚，边缘薄）
    const heightFactor = 1 - r / MILKY_WAY_CONFIG.DISC_RADIUS;
    const y = THREE.MathUtils.randFloatSpread(
      MILKY_WAY_CONFIG.DISC_HEIGHT * heightFactor
    );

    positions.push(x, y, z);

    // 根据半径选择恒星类型（模拟金属丰度梯度）
    const type = selectTypeByRadius(r);
    const config = STAR_CONFIGS[type];

    // 计算亮度和大小（银河恒星更亮）
    const brightness =
      THREE.MathUtils.randFloat(...config?.brightnessRange) * 1.2;
    const size = THREE.MathUtils.randFloat(...config.sizeRange) * 1.5;

    // 颜色处理（添加随机色偏移）
    const color = config.color
      .clone()
      .multiplyScalar(brightness)
      .offsetHSL(Math.random() * 0.05, 0, 0);

    colors.push(color.r, color.g, color.b);
    sizes.push(size);
  }

  return createPoints(positions, colors, sizes);
}

/**
 * 创建Three.js点集对象
 */
function createPoints(
  positions: number[],
  colors: number[],
  sizes: number[]
): THREE.Points {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1));

  const material = new THREE.PointsMaterial({
    map: starTexture, // 添加圆形纹理
    alphaMap: starTexture, // 使用相同纹理作为透明度贴图
    size: 0.02, // 缩小基础尺寸
    vertexColors: true,
    transparent: true,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    alphaTest: 0.1, // 调整透明度测试阈值
  });

  return new THREE.Points(geometry, material);
}

/**
 * 根据半径选择恒星类型（模拟星系金属丰度梯度）
 */
function selectTypeByRadius(r: number): string {
  const radiusRatio = r / MILKY_WAY_CONFIG.DISC_RADIUS;
  // 中心区域更多大质量恒星（O、B型）
  if (radiusRatio < 0.3) {
    return Math.random() < 0.7 ? "O" : "B";
  }
  // 中间区域混合类型
  if (radiusRatio < 0.6) {
    return weightedRandomType(["B", "A", "F"]);
  }
  // 外围更多小质量恒星（K、M型）
  return weightedRandomType(["G", "K", "M"]);
}

/**
 * 加权随机选择恒星类型
 */
function weightedRandomType(types?: string[]): string {
  const candidates = types || Object.keys(STAR_CONFIGS);
  const totalDensity = candidates.reduce(
    (sum, t) => sum + STAR_CONFIGS[t]?.density,
    0
  );
  const rand = Math.random() * totalDensity;

  let cumulative = 0;
  for (const type of candidates) {
    cumulative += STAR_CONFIGS[type]?.density;
    if (rand <= cumulative) return type;
  }
  return "G";
}

function initScene() {
  if (!canvasRef.value) return;

  // 场景初始化
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000000 // 将远平面扩大到1,000,000单位
  );

  // 渲染器配置（针对Quest3优化）
  renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    antialias: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;

  // 创建星空
  stars = createStarField(3000, 150);
  milkyWay = createMilkyWay(8000);
  scene.add(stars, milkyWay);

  // 相机初始位置
  camera.position.set(0, 20, 50);
}

function animate() {
  renderer.setAnimationLoop((time: number) => {
    // 缓慢旋转星空（模拟天体运动）
    // const rotationSpeed = time * 0.00001;
    // stars.rotation.y += rotationSpeed;
    // milkyWay.rotation.y += rotationSpeed * 1.2;

    renderer.render(scene, camera);
  });
}

function enterVR() {
  if (renderer.xr.isPresenting) {
    renderer.xr.getSession()?.end();
  } else {
    renderer.xr.getSession()?.requestReferenceSpace("local-floor");
  }
}

// 窗口大小变化处理
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

onMounted(() => {
  initScene();
  animate();
  window.addEventListener("resize", onWindowResize);

  // 添加VR按钮
  if (canvasRef.value) {
    const vrButton = VRButton.createButton(renderer);
    vrButton.classList.add("vr-button");
    document.body.appendChild(vrButton);
  }
});

onUnmounted(() => {
  window.removeEventListener("resize", onWindowResize);
  scene.clear();
  renderer.dispose();
});
</script>

<style scoped>
.container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.scene {
  width: 100%;
  height: 100%;
  touch-action: none;
}

.vr-button {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  font-family: Arial, sans-serif;
  font-size: 14px;
  cursor: pointer;
  border-radius: 8px;
  backdrop-filter: blur(4px);
  transition: all 0.3s ease;
}

.vr-button:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateX(-50%) scale(1.05);
}
</style>
