import rateLimit from "express-rate-limit";

/**
 * 认证接口速率限制 — 防止暴力破解
 * 适用于：登录、注册、OTP验证、密码重置
 * 限制：每15分钟最多10次请求
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "请求过于频繁，请15分钟后再试",
  },
});

/**
 * 通用 API 速率限制
 * 适用于：默认所有未特殊配置的路由
 * 限制：每15分钟最多100次请求
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "请求过于频繁，请稍后再试",
  },
});

/**
 * 公开读取接口速率限制
 * 适用于：电影列表、演员信息、评论查看等公开GET接口
 * 限制：每15分钟最多200次请求
 */
export const publicReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "请求过于频繁，请稍后再试",
  },
});

/**
 * 管理员操作速率限制
 * 适用于：管理员创建/更新/删除资源
 * 限制：每15分钟最多50次请求
 */
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "操作过于频繁，请稍后再试",
  },
});
