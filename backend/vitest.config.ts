import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // 每个测试文件先运行 setup.ts（设置 NODE_ENV/JWT_SECRET 等环境变量）
    setupFiles: ["tests/setup.ts"],
    // 文件串行执行：集成测试共享同一个测试库 moviefy_test，避免并行 drop 互相干扰
    fileParallelism: false,
    include: ["tests/**/*.test.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["controllers/**", "middlewares/**", "models/**", "utils/**", "routes/**", "cloud/**"],
      exclude: ["**/*.test.ts"],
    },
  },
});
