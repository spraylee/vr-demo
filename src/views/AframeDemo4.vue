<template>
  <a-scene
    xr-mode-ui="enterVRButton: #myEnterVRButton; enterARButton: #myEnterARButton; XRMode: xr;"
    webxr="requiredFeatures: local-floor;"
  >
    <!-- 核心优化：分层星空系统 -->
    <a-entity id="star-system" particle-fog="near: 5000; far: 40000">
      <!-- 背景层（自然分布） -->
      <!-- 减小基础尺寸，降低亮度 -->
      <a-entity
        star-field="count: 8000; range: 50000; baseSize: 0.02; luminosityRange: 1,30"
      ></a-entity>

      <!-- 银河盘面层（增强蓝星比例） -->
      <a-entity
        star-field="count: 12000; range: 30000; baseSize: 0.04; luminosityRange: 5,100"
        galaxy-distribution
        star-color-override="O:0.0001; B:0.002; A:0.01"
      ></a-entity>

      <!-- 减小亮星尺寸，降低闪烁强度 -->
      <a-entity
        star-field="count: 500; range: 20000; baseSize: 0.1; luminosityRange: 300,600"
      ></a-entity>
    </a-entity>

    <!-- 相机配置（关键参数） -->
    <a-camera
      far="100000"
      wasd-controls="fly: true"
      position="0 0 0"
    ></a-camera>

    <a-light
      type="point"
      color="#9EB5FF"
      intensity="0.3"
      position="0 0 -80000"
    ></a-light>

    <!-- 深度感知增强 -->
    <!-- <a-entity particle-fog="color: #000000; near: 5000; far: 40000"></a-entity> -->
  </a-scene>
  <div
    class="flex fixed bottom-[10%] w-auto justify-center left-1/2 -translate-x-1/2"
  >
    <button id="myEnterVRButton">进入VR模式</button>
    <button id="myEnterARButton">进入AR模式</button>
  </div>
</template>

<script setup lang="ts">
import { THREE } from "aframe";

// 调整颜色参数（增加饱和度）
const STAR_CLASSES = {
  O: { prob: 0.00003, color: "#6A8BFF", size: 1.8 }, // 加深蓝色
  B: { prob: 0.00127, color: "#7D9EFF", size: 1.3 },
  A: { prob: 0.0057, color: "#9FB5FF", size: 1.0 },
  F: { prob: 0.023, color: "#CBD3FF", size: 0.8 },
  G: { prob: 0.05, color: "#FFEED8", size: 0.7 },
  K: { prob: 0.37, color: "#FFC08D", size: 0.5 },
  M: { prob: 0.55, color: "#FFA78D", size: 0.4 }, // 加深红色
};

// 改进的星类选择算法
function selectStarClass() {
  const rand = Math.random();
  let accum = 0;
  for (const [type, data] of Object.entries(STAR_CLASSES)) {
    accum += data.prob;
    if (rand <= accum) return type;
  }
  return "M";
}

// 增强版着色器（添加颜色校正和闪烁控制）
const starShader = {
  vertexShader: `
    uniform float time;
    uniform float twinkleSpeed;
    uniform float maxTwinkle;
    attribute float size;
    attribute vec3 color;
    attribute float alpha;
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      vColor = color;

      float dist = length(position);
      float sizeAttenuation = 1.0 / (1.0 + pow(dist/50000.0, 1.5));

      // 修改尺寸计算（降低整体尺寸）
      gl_PointSize = size * sizeAttenuation * 4.0; // 缩小星星尺寸
      vAlpha = alpha; // 不修改透明度

      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    varying float vAlpha;
    uniform float haloPower;

    void main() {
      vec2 coord = gl_PointCoord * 2.0 - 1.0;
      float dist = length(coord);
      
      float radius = 0.7;
      float fadeWidth = 0.3;
      float alpha = smoothstep(radius + fadeWidth, radius, dist);
      
      float coreIntensity = pow(1.0 - smoothstep(0.0, radius, dist), 2.0);
      
      vec3 coreColor = vColor * (1.0 + coreIntensity * 1.5);
      vec3 finalColor = min(coreColor, vec3(1.5));
      
      gl_FragColor = vec4(finalColor, vAlpha * alpha);
    }
  `,
};

// 改进版星空组件（增加天体物理模拟）
AFRAME.registerComponent("star-field", {
  schema: {
    count: { default: 10000 },
    range: { default: 30000 },
    baseSize: { default: 0.1 }, // 基础尺寸（最小尺寸基准）
    luminosityRange: { default: "1,100" }, // 光度范围（相对太阳光度）
  },

  init: function () {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const sizes = [];
    const colors = [];
    const alphas = [];
    const luminosityRange = this.data.luminosityRange.split(",").map(Number);

    // 天体分布算法（基于初始质量函数）
    for (let i = 0; i < this.data.count; i++) {
      // 恒星分类概率（基于银河系实际分布）
      const classRand = Math.random();
      let starClass;
      if (classRand < 0.00003) starClass = "O";
      else if (classRand < 0.0013) starClass = "B";
      else if (classRand < 0.007) starClass = "A";
      else if (classRand < 0.03) starClass = "F";
      else if (classRand < 0.08) starClass = "G";
      else if (classRand < 0.45) starClass = "K";
      else starClass = "M";

      // 球面坐标生成（包含距离衰减）
      const spherical = new THREE.Spherical(
        this.data.range * (0.7 + Math.random() ** 2 * 0.3), // 距离分布偏向近端
        Math.acos(2 * Math.random() - 1),
        Math.random() * Math.PI * 2
      );

      const pos = new THREE.Vector3().setFromSpherical(spherical);
      positions.push(pos.x, pos.y, pos.z);

      // 光度计算（幂律分布）
      const luminosity = THREE.MathUtils.mapLinear(
        Math.random(),
        0,
        1,
        luminosityRange[0],
        luminosityRange[1]
      );

      // 尺寸计算（基于斯蒂芬-玻尔兹曼定律）
      const size =
        STAR_CLASSES[starClass].size *
        Math.sqrt(luminosity) *
        (0.8 + Math.random() * 0.4) *
        this.data.baseSize;

      sizes.push(size);

      // 颜色温度混合
      const baseColor = new THREE.Color(STAR_CLASSES[starClass].color);
      const tempVariation = Math.random() * 0.1;
      colors.push(
        baseColor.r + tempVariation,
        baseColor.g + tempVariation * 0.5,
        baseColor.b - tempVariation * 0.2
      );

      // 亮度衰减（平方反比定律）
      const distanceAttenuation =
        1 / (1 + (spherical.radius / this.data.range) ** 2);
      alphas.push(
        Math.min(
          1,
          luminosity * distanceAttenuation * (0.7 + Math.random() * 0.3)
        )
      );
    }

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    geometry.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute("alpha", new THREE.Float32BufferAttribute(alphas, 1));

    // 定制化着色器材质
    const material = new THREE.ShaderMaterial({
      ...starShader,
      transparent: true,
      blending: THREE.AdditiveBlending, // 使用叠加混合模式
      depthWrite: false,
    });

    this.material = material;
    this.stars = new THREE.Points(geometry, material);
    this.el.object3D.add(this.stars);
  },

  // tick: function (time) {
  //   this.material.uniforms.time.value = time / 1000;
  // },
});

// 修改后的银河分布组件
AFRAME.registerComponent("galaxy-distribution", {
  init: function () {
    const positions =
      this.el.object3D.children[0]?.geometry?.attributes.position.array;

    // 创建螺旋结构
    for (let i = 0; i < positions.length; i += 3) {
      // 极坐标转换
      const r = Math.sqrt(positions[i] ** 2 + positions[i + 1] ** 2);
      const theta = 2 * Math.PI * Math.random() * (r / 30000); // 螺旋因子

      // 应用螺旋扰动
      positions[i] += r * Math.cos(theta) * 0.2;
      positions[i + 1] += r * Math.sin(theta) * 0.2;

      // 垂直方向压缩
      positions[i + 2] *= 0.1 + Math.random() * 0.3;
    }

    this.el.object3D.children[0].geometry.attributes.position.needsUpdate =
      true;
  },
});

AFRAME.registerComponent("star-vertical", {
  schema: { height: { default: 10000 } },

  init: function () {
    const positions =
      this.el.object3D.children[0]?.geometry?.attributes.position.array;

    for (let i = 2; i < positions.length; i += 3) {
      positions[i] = (Math.random() - 0.5) * this.data.height;
    }

    this.el.object3D.children[0].geometry.attributes.position.needsUpdate =
      true;
  },
});

// 闪烁效果组件
// AFRAME.registerComponent("twinkle-effect", {
//   tick: function (time) {
//     // const material = this.el.object3D.children[0]?.material;
//     // material.opacity = 0.7 + Math.sin(time * 0.002) * 0.3;
//   },
// });

AFRAME.registerComponent("star-color-override", {
  schema: {
    O: { default: 0.00003 },
    B: { default: 0.00127 },
    // ...其他类型...
  },

  init() {
    const starField = this.el.components["star-field"];
    const originalProb = STAR_CLASSES;

    // 临时覆盖概率分布
    STAR_CLASSES.O.prob = this.data.O;
    STAR_CLASSES.B.prob = this.data.B;
    // ...

    // 重新生成星群
    starField.init();

    // 恢复原始概率
    STAR_CLASSES.O.prob = originalProb.O;
    // ...
  },
});
</script>
