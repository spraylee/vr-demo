# Quest3 VR Demo

基于 Vue 3 + TypeScript 开发的 Quest 3 VR 演示项目，展示了多个沉浸式 VR 场景和交互体验。

## 项目特性

- 🚀 基于 Vue 3 + TypeScript + Vite 构建
- 🎮 支持 Quest 3 VR 设备
- 🌌 多个沉浸式 VR 场景
  - Three.js 3D 场景
  - A-Frame VR 基础演示
  - 星空漫游体验
  - 银河系模拟
- ⚡ 高性能渲染和优化
- 🎨 现代化 UI 设计
- 📱 响应式布局

## 技术栈

- Vue 3
- TypeScript
- Vite
- Three.js
- A-Frame
- UnoCSS
- Vue Router
- Pinia

## 开发环境要求

- Node.js 18+
- pnpm 8+
- Quest 3 设备（用于 VR 体验）
- 现代浏览器（支持 WebXR）

## 快速开始

1. 克隆项目并安装依赖：

```bash
git clone <repository-url>
cd vr-demo
pnpm install
```

2. 启动开发服务器：

```bash
pnpm dev
```

3. 构建生产版本：

```bash
pnpm build
```

## 场景说明

### 1. Three.js 演示

基础的 Three.js 3D 场景展示，包含基本的 3D 对象和交互。

### 2. A-Frame 演示

使用 A-Frame 框架构建的 VR 场景，展示了基础的 VR 交互功能。

### 3. 星空场景

- 沉浸式星空体验
- 真实的天体物理模拟
- 银河系漫游
- 粒子效果和光照系统

## 项目结构

```
quest3-demo/
├── src/
│   ├── views/          # 场景组件
│   ├── router/         # 路由配置
│   ├── stores/         # 状态管理
│   ├── assets/         # 静态资源
│   └── components/     # 公共组件
├── public/             # 公共资源
└── vite.config.ts      # Vite 配置
```

## 开发工具推荐

- [VSCode](https://code.visualstudio.com/)
- [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar)
- [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin)

## 注意事项

1. 确保设备支持 WebXR API
2. 使用 Quest 3 设备时，需要在浏览器中允许 VR 访问权限
3. 建议使用 5GHz WiFi 网络以获得更好的 VR 体验
4. 首次加载可能需要一定时间，请耐心等待

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 许可证

[MIT License](LICENSE)
