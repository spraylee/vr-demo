<template>
  <a-scene
    xr-mode-ui="enterVRButton: #myEnterVRButton; enterARButton: #myEnterARButton; XRMode: xr;"
    webxr="requiredFeatures: local-floor;"
    renderer="antialias: true"
  >
    <!-- 核心优化：分层星空系统 -->
    <a-entity id="star-system" particle-fog="near: 5000; far: 40000">
      <!-- 基础背景层（全空间均匀分布） -->
      <a-entity
        star-field="count: 8000; range: 50000; size: 0.03; color: #CCCCFF"
      ></a-entity>

      <!-- 银河层（盘面+螺旋结构） -->
      <a-entity
        star-field="count: 12000; range: 30000; size: 0.05; color: #9EB5FF"
        galaxy-distribution
      ></a-entity>

      <!-- 动态层（增加垂直分布） -->
      <a-entity
        star-field="count: 5000; range: 20000; size: 0.1; color: #FFFFFF"
        star-vertical="height: 15000"
        twinkle-effect
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
    <a-entity particle-fog="color: #000000; near: 5000; far: 40000"></a-entity>
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

// 增强版星空组件
AFRAME.registerComponent("star-field", {
  schema: {
    count: { default: 10000 },
    range: { default: 30000 }, // 基础范围扩大30倍
    size: { default: 0.05 }, // 默认大小减小50%
    color: { default: "#FFFFFF" },
  },

  init: function () {
    const geometry = new THREE.BufferGeometry();
    const positions = [];

    // 球坐标分布算法
    const spherical = new THREE.Spherical(
      this.data.range * 0.8, // 基础半径
      Math.PI * 0.4, // 极角范围限制
      Math.PI * 2 // 完整方位角
    );

    for (let i = 0; i < this.data.count; i++) {
      spherical.radius = this.data.range * (0.8 + Math.random() * 0.2); // 半径波动
      spherical.theta = Math.acos(2 * Math.random() - 1); // 均匀球面分布
      spherical.phi = Math.random() * Math.PI * 2;

      const pos = new THREE.Vector3()
        .setFromSpherical(spherical)
        .addScalar((Math.random() - 0.5) * this.data.range * 0.1); // 添加随机扰动

      positions.push(pos.x, pos.y, pos.z);
    }

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );

    const material = new THREE.PointsMaterial({
      size: this.data.size,
      color: new THREE.Color(this.data.color),
      transparent: true,
      depthWrite: false, // 关闭深度写入增强距离感
    });

    this.stars = new THREE.Points(geometry, material);
    this.geometry = geometry;
    this.el.object3D.add(this.stars);
  },
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
AFRAME.registerComponent("twinkle-effect", {
  tick: function (time) {
    const material = this.el.object3D.children[0]?.material;
    material.opacity = 0.7 + Math.sin(time * 0.002) * 0.3;
  },
});
</script>
