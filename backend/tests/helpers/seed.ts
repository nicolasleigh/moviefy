import jwt from "jsonwebtoken";
import type { Types } from "mongoose";
import User, { type UserDoc } from "../../models/user";
import Actor from "../../models/actor";
import Movie, { type MovieDoc } from "../../models/movie";
import Review from "../../models/review";

export interface TestUser {
  user: UserDoc;
  password: string;
  token: string;
}

/** 创建用户并返回其 JWT（默认 verified 普通用户） */
export const createUser = async (
  overrides: Partial<Pick<UserDoc, "role" | "name" | "email" | "isVerified">> & { password?: string } = {}
): Promise<TestUser> => {
  const name = overrides.name ?? `User-${Math.random().toString(36).slice(2, 8)}`;
  const email =
    overrides.email ?? `${name.toLowerCase().replace(/[^a-z0-9]/g, "")}@example.com`;
  const password = overrides.password ?? "password123";

  const user = await User.create({
    name,
    email,
    password,
    role: overrides.role ?? "user",
    isVerified: overrides.isVerified ?? true,
  });

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!);
  return { user, password, token };
};

export const createActor = (data: {
  name?: string;
  about?: string;
  gender?: string;
} = {}) =>
  Actor.create({
    name: data.name ?? "Actor Name",
    about: data.about ?? "A short bio.",
    gender: data.gender ?? "Male",
  });

export const createMovie = (data: Partial<MovieDoc> = {}) =>
  Movie.create({
    title: data.title ?? "Test Movie",
    storyLine: data.storyLine ?? "A test storyline.",
    releaseDate: data.releaseDate ?? new Date("2024-01-01"),
    status: data.status ?? "public",
    type: data.type ?? "movie",
    genres: data.genres ?? ["Drama"],
    tags: data.tags ?? ["action"],
    cast: data.cast ?? [],
    language: data.language ?? "English",
    reviews: data.reviews ?? [],
    // 模型里 poster/video 必填（与真实上传后的数据一致）
    poster: data.poster ?? { url: "https://x/poster.jpg", public_id: "post1", responsive: [] },
    video: data.video ?? { url: "https://x/video.mp4", public_id: "vid1" },
    director: data.director,
    writer: data.writer,
  });

/**
 * 创建评论，并像控制器 addReview 一样把评论 id 同步进 movie.reviews
 * （topRatedMoviesPipeline 依赖 movie.reviews 非空）
 */
export const createReview = async (data: {
  owner: Types.ObjectId;
  parentMovie: Types.ObjectId;
  content?: string;
  rating?: number;
}) => {
  const review = await Review.create({
    owner: data.owner,
    parentMovie: data.parentMovie,
    content: data.content ?? "Great movie!",
    rating: data.rating ?? 8,
  });
  await Movie.findByIdAndUpdate(data.parentMovie, { $push: { reviews: review._id } });
  return review;
};
