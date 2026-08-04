import mongoose from "mongoose";

export const TEST_DB_URI =
  process.env.MONGO_URI_TEST ?? "mongodb://user:pass@localhost:27017/moviefy_test?authSource=admin";

/** 连接测试库并清空所有集合（每个测试文件 beforeAll 调用一次） */
export const connectTestDB = async () => {
  if (mongoose.connection.readyState === 1) return;
  try {
    await mongoose.connect(TEST_DB_URI);
    await mongoose.connection.dropDatabase();
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(
      `无法连接测试数据库 ${TEST_DB_URI}。请确认 MongoDB 已启动：docker compose up -d mongodb。原始错误：${reason}`
    );
  }
};

/** 清空当前库中所有集合的数据 */
export const clearDB = async () => {
  const collections = await mongoose.connection.db?.collections();
  if (!collections) return;
  await Promise.all(collections.map((c) => c.deleteMany({})));
};

/** 断开连接（afterAll 调用） */
export const disconnectTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
};
