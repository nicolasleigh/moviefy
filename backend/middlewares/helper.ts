import type { Request, Response, NextFunction } from "express";

export const parseData = (req: Request, res: Response, next: NextFunction) => {
  const { cast, genres, tags } = req.body;

  // if (trailer) req.body.trailer = JSON.parse(trailer);
  if (cast) req.body.cast = JSON.parse(cast);
  if (genres) req.body.genres = JSON.parse(genres);
  if (tags) req.body.tags = JSON.parse(tags);
  // if (writers) req.body.writers = JSON.parse(writers);

  next();
};
