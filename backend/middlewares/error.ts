import type { Request, Response, NextFunction } from "express";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // console.log('err: ', err.message);
  res.status(500).json({ error: err.message || err });
};
