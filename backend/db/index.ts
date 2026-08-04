import mongoose from "mongoose";

/**
 * 连接 MongoDB。
 * 测试环境传入 uri 使用独立测试库；生产环境按 NODE_ENV 选择 CLOUD_MONGO_URI 或 MONGO_URI。
 */
export const connectDB = async (uri?: string) => {
  let dsn = uri ?? process.env.MONGO_URI!;

  if (!uri && process.env.NODE_ENV === "production") {
    dsn = process.env.CLOUD_MONGO_URI!;
  }

  await mongoose.connect(dsn);
  console.log("db is connected");
  return mongoose.connection;
};
