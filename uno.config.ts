import {
  defineConfig,
  presetUno,
  presetAttributify,
  presetIcons,
} from "unocss";

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      warn: true,
    }),
  ],
  shortcuts: [
    // 可以在这里添加自定义快捷方式
  ],
  rules: [
    // 可以在这里添加自定义规则
  ],
});
