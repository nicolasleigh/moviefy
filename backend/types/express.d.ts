import type { Types } from "mongoose";

declare global {
  namespace Express {
    interface Request {
      /** 由 isAuth 中间件挂载，受保护的路由中必然存在 */
      user: {
        _id: Types.ObjectId;
        name: string;
        email: string;
        password: string;
        isVerified: boolean;
        role: string;
        comparePassword(password: string): Promise<boolean>;
      };
      /** 由 isValidPassResetToken 中间件挂载 */
      resetToken: {
        _id: Types.ObjectId;
        compareToken(token: string): Promise<boolean>;
      };
    }
  }
}

export {};
