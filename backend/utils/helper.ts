import crypto from "crypto";
import type { Request, Response } from "express";
import type { Types } from "mongoose";
import cloudinary from "../cloud";
import Review from "../models/review";

export const sendError = (res: Response, error: string, statusCode = 401) => {
  res.status(statusCode).json({ error });
};

// https://nodejs.org/api/crypto.html#cryptorandombytessize-callback
export const generateRandomByte = () => {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(30, (err, buff) => {
      if (err) reject(err);
      const buffString = buff.toString("hex");
      // console.log(buffString);
      resolve(buffString);
    });
  });
};

export const handleNotFound = (req: Request, res: Response) => {
  sendError(res, "Not Found!", 404);
};

export const uploadImageToCloud = async (file: string) => {
  const { secure_url: url, public_id } = await cloudinary.uploader.upload(file, {
    gravity: "face",
    height: 500,
    width: 500,
    crop: "thumb",
  });
  return { url, public_id };
};

export const formateActor = (actor: any) => {
  const { name, gender, about, _id, avatar } = actor;
  return {
    id: _id,
    name,
    about,
    gender,
    avatar: avatar?.url,
  };
};

export const averageRatingPipeline = (movieId: any) => {
  return [
    // {
    //   $lookup: {
    //     from: 'Review',
    //     localField: 'rating',
    //     foreignField: '_id',
    //     as: 'avgRat',
    //   },
    // },
    {
      $match: { parentMovie: movieId },
    },
    {
      $group: {
        _id: null,
        ratingAvg: {
          $avg: "$rating",
        },
        reviewCount: {
          $sum: 1,
        },
      },
    },
  ];
};

export const relatedMovieAggregation = (tags: any[], movieId: any): any[] => {
  return [
    // {
    //   $lookup: {
    //     from: 'Movie',
    //     localField: 'tags',
    //     foreignField: '_id',
    //     as: 'relatedMovies',
    //   },
    // },
    {
      $match: {
        tags: { $in: [...tags] },
        _id: { $ne: movieId },
      },
    },
    {
      $project: {
        title: 1,
        poster: "$poster.url",
        responsivePosters: "$poster.responsive",
      },
    },
    {
      $limit: 5,
    },
  ];
};

export const topRatedMoviesPipeline = (genre?: string): any[] => {
  const matchOptions: Record<string, any> = {
    reviews: { $exists: true, $ne: [] },
    status: { $eq: "public" },
  };

  if (genre) matchOptions.genres = { $in: [genre] };

  return [
    // {
    //   $lookup: {
    //     from: 'Movie',
    //     localField: 'reviews',
    //     foreignField: '_id',
    //     as: 'topRated',
    //   },
    // },
    {
      $match: matchOptions,
    },
    {
      $project: {
        title: 1,
        poster: "$poster.url",
        responsivePosters: "$poster.responsive",
        reviewCount: { $size: "$reviews" },
      },
    },
    {
      $sort: {
        reviewCount: -1,
      },
    },
    { $limit: 5 },
  ];
};

export const getAverageRatings = async (
  movieId: any
): Promise<{ ratingAvg?: string; reviewCount?: number }> => {
  const [aggregatedResponse] = await Review.aggregate(averageRatingPipeline(movieId));

  const reviews: { ratingAvg?: string; reviewCount?: number } = {};

  if (aggregatedResponse) {
    const { ratingAvg, reviewCount } = aggregatedResponse;
    reviews.ratingAvg = parseFloat(ratingAvg).toFixed(1);
    reviews.reviewCount = reviewCount;
  }

  return reviews;
};

/**
 * 批量查询多个电影的评分 — 将 N 次查询合并为 1 次
 * 用于替代在循环中逐个调用 getAverageRatings 的 N+1 模式
 * @param movieIds ObjectId[] 电影 ID 数组
 * @returns Map<string, { ratingAvg: string, reviewCount: number }>
 */
export const getAverageRatingsMap = async (
  movieIds: (Types.ObjectId | string)[]
): Promise<Map<string, { ratingAvg: string; reviewCount: number }>> => {
  if (!movieIds.length) return new Map();

  const aggregatedResponse = await Review.aggregate([
    {
      $match: { parentMovie: { $in: movieIds } },
    },
    {
      $group: {
        _id: "$parentMovie",
        ratingAvg: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  const map = new Map();
  for (const item of aggregatedResponse) {
    map.set(item._id.toString(), {
      ratingAvg: parseFloat(item.ratingAvg).toFixed(1),
      reviewCount: item.reviewCount,
    });
  }

  return map;
};
