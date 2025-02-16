<template>
  <div class="index-container">
    <div class="content">
      <h1 class="title">VR 演示导航</h1>
      <div class="card-grid">
        <router-link
          v-for="route in routes"
          :key="route.path"
          :to="route.path"
          class="card"
        >
          <div class="card-content">
            <h2>{{ route.title }}</h2>
            <p>{{ route.description }}</p>
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const routes = [
  {
    path: "/three",
    title: "Three.js 演示",
    description: "基础的 Three.js 3D 场景展示",
  },
  {
    path: "/2",
    title: "A-Frame 演示 2",
    description: "A-Frame VR 场景示例",
  },
  {
    path: "/4",
    title: "A-Frame 演示 4",
    description: "进阶 VR 场景展示",
  },
  {
    path: "/5",
    title: "星空场景 1",
    description: "沉浸式星空体验",
  },
  {
    path: "/6",
    title: "星空场景 2",
    description: "银河系漫游体验",
  },
];
</script>

<style scoped>
.index-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
  padding: 2rem;
}

.content {
  max-width: 1200px;
  margin: 0 auto;
}

.title {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 3rem;
  font-weight: 300;
  letter-spacing: 0.1em;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  padding: 1rem;
}

.card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.5rem;
  text-decoration: none;
  color: #fff;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.card:hover {
  transform: translateY(-5px);
  background: rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.card h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.card p {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.95rem;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .index-container {
    padding: 1rem;
  }

  .title {
    font-size: 2rem;
    margin-bottom: 2rem;
  }

  .card-grid {
    grid-template-columns: 1fr;
  }
}
</style>
