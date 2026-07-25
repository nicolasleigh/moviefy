import jwt from "jsonwebtoken";
import { sendError } from "../utils/helper";
import User from "../models/user";

// 启动时校验 JWT_SECRET 已配置且非默认值
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  throw new Error(
    "JWT_SECRET is not set or too weak. Generate a strong one with: openssl rand -hex 32"
  );
}

export const isAuth = async (req, res, next) => {
  const token = req.headers?.authorization;

  if (!token) return sendError(res, "Invalid token");
  const jwtToken = token.split("Bearer ")[1];

  if (!jwtToken) return sendError(res, "Invalid token");
  const decode = jwt.verify(jwtToken, process.env.JWT_SECRET);
  // console.log('decode: ', decode);
  const { userId } = decode;

  const user = await User.findById(userId);
  if (!user) return sendError(res, "Invalid token, user not found", 404); // Trans

  req.user = user;

  next();
};

export const isAdmin = (req, res, next) => {
  const { user } = req;
  if (user.role !== "admin") return sendError(res, "Only administrators can perform this action"); // Trans
  next();
};
