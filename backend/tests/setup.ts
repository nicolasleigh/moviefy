// 在所有测试文件之前运行：设置确定性的环境变量
// 注意：测试不加载 .env，避免依赖本机开发配置
process.env.NODE_ENV = "test";

// 通过 auth.ts 启动时的 JWT_SECRET 强度校验（≥16 字符）
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-only-secret-which-is-long-enough!";

// Cloudinary 配置占位值（实际上传在测试中被 mock）
process.env.CLOUD_NAME = process.env.CLOUD_NAME ?? "test";
process.env.CLOUD_API_KEY = process.env.CLOUD_API_KEY ?? "test";
process.env.CLOUD_API_SECRET = process.env.CLOUD_API_SECRET ?? "test";

process.env.RESET_PASSWORD_URL = process.env.RESET_PASSWORD_URL ?? "http://localhost:5173";

// 集成测试使用的独立数据库（默认 docker compose 中的 MongoDB + 独立 test 库）
// root 用户创建于 admin 库，必须指定 authSource=admin 才能认证
process.env.MONGO_URI_TEST =
  process.env.MONGO_URI_TEST ?? "mongodb://user:pass@localhost:27017/moviefy_test?authSource=admin";
