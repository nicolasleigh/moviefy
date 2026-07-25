import express from "express";
import "express-async-errors";
import morgan from "morgan";
import "dotenv/config";
// require("dotenv").config();
import "./db";
import { errorHandler } from "./middlewares/error";
import cors from "cors";
import { handleNotFound } from "./utils/helper";
import {
  authLimiter,
  generalLimiter,
  adminLimiter,
} from "./middlewares/rateLimiter";
import userRouter from "./routes/user";
import actorRouter from "./routes/actor";
import movieRouter from "./routes/movie";
import reviewRouter from "./routes/review";
import adminRouter from "./routes/admin";

const app = express();
app.use(cors()); // for cross origin resource sharing
app.use(express.json()); // for parsing application/json
app.use(morgan("dev"));

// 速率限制：全局基线 — 每15分钟100次请求
app.use("/api", generalLimiter);

// 认证相关接口 — 严格限制，防暴力破解
app.use("/api/user", authLimiter);

// 管理后台接口 — 中等限制
app.use("/api/admin", adminLimiter);

app.use("/api/user", userRouter);
app.use("/api/actor", actorRouter);
app.use("/api/movie", movieRouter);
app.use("/api/review", reviewRouter);
app.use("/api/admin", adminRouter);

app.use("/*", handleNotFound);

app.use(errorHandler);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log("the port is listening on port " + PORT);
  console.log("current environment is: " + process.env.NODE_ENV);
});
