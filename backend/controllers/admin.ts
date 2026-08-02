import type { Request, Response } from "express";
import Movie from "../models/movie";
import Review from "../models/review";
import User from "../models/user";
import { topRatedMoviesPipeline, getAverageRatingsMap } from "../utils/helper";

export const getAppInfo = async (req: Request, res: Response) => {
  const movieCount = await Movie.countDocuments();
  const reviewCount = await Review.countDocuments();
  const userCount = await User.countDocuments();

  res.json({ appInfo: { movieCount, reviewCount, userCount } });
};

export const getMostRated = async (req: Request, res: Response) => {
  const movies = await Movie.aggregate(topRatedMoviesPipeline());

  // 一次性批量查询所有电影的评分，避免 N+1 查询
  const ratingsMap = await getAverageRatingsMap(movies.map((m: any) => m._id));

  const topRatedMovies = movies.map((m: any) => ({
    id: m._id,
    title: m.title,
    reviews: ratingsMap.get(m._id.toString()) || {},
  }));

  res.json({ movies: topRatedMovies });
};
