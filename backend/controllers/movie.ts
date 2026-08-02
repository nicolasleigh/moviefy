import cloudinary from "../cloud";
import type { Request, Response } from "express";
import {
  sendError,
  formateActor,
  averageRatingPipeline,
  relatedMovieAggregation,
  getAverageRatings,
  getAverageRatingsMap,
  topRatedMoviesPipeline,
} from "../utils/helper";
import Movie from "../models/movie";
import type { ActorDoc } from "../models/actor";
import Review from "../models/review";
import { isValidObjectId } from "mongoose";

export const createMovie = async (req: Request, res: Response) => {
  const { body } = req;
  const files = req.files as { video: Express.Multer.File[]; poster: Express.Multer.File[] } | undefined;
  if (!files) {
    return sendError(res, "File is missing"); // Trans
  }

  const { title, storyLine, director, releaseDate, status, type, genres, tags, cast, writer, language } = body;

  const newMovie = new Movie({
    title,
    storyLine,
    releaseDate,
    status,
    type,
    genres,
    tags,
    cast,
    language,
  });

  if (director) {
    if (!isValidObjectId(director)) {
      return sendError(res, "Invalid director ID"); // Trans
    }
    newMovie.director = director;
  }

  if (writer) {
    if (!isValidObjectId(writer)) {
      return sendError(res, "Invalid writer ID"); // Trans
    }
    newMovie.writer = writer;
  }

  if (files.video[0]) {
    const { secure_url: url, public_id } = await cloudinary.uploader.upload(files.video[0].path, {
      resource_type: "video",
    });
    newMovie.video = { url, public_id };
  }

  // uploading poster
  if (files.poster[0]) {
    const {
      secure_url: url,
      public_id,
      responsive_breakpoints,
    } = await cloudinary.uploader.upload(files.poster[0].path, {
      transformation: {
        width: 1280,
        height: 720,
      },
      // https://www.responsivebreakpoints.com/
      // https://cloudinary.com/documentation/image_upload_api_reference#upload_optional_parameters
      responsive_breakpoints: {
        create_derived: true,
        max_width: 640,
        max_images: 3,
      },
    });

    const finalPoster: { url: string; public_id: string; responsive: string[] } = {
      url,
      public_id,
      responsive: [],
    };
    const { breakpoints } = responsive_breakpoints[0];
    if (breakpoints.length) {
      for (let imgObj of breakpoints) {
        const { secure_url } = imgObj;
        finalPoster.responsive.push(secure_url);
      }
    }
    newMovie.poster = finalPoster;
  }

  await newMovie.save();

  // console.log(cloudRes);
  // console.log(cloudRes.responsive_breakpoints[0].breakpoints);

  res.status(201).json({ movie: { id: newMovie._id, title } });
};

// export const updateMovieWithoutPoster = async (req, res) => {
//   const { movieId } = req.params;

//   if (!isValidObjectId(movieId)) return sendError(res, "Invalid movie id!");

//   const movie = await Movie.findById(movieId);
//   if (!movie) return sendError(res, "Movie not found!", 404);

//   const { title, storyLine, director, releseDate, status, type, genres, tags, cast, writers, trailer, language } =
//     req.body;

//   movie.title = title;
//   movie.storyLine = storyLine;
//   movie.releseDate = releseDate;
//   movie.status = status;
//   movie.type = type;
//   movie.genres = genres;
//   movie.tags = tags;
//   movie.cast = cast;
//   movie.trailer = trailer;
//   movie.language = language;

//   if (director) {
//     if (!isValidObjectId(director)) return sendError(res, "Invalid director id!");
//     movie.director = director;
//   }

//   if (writers) {
//     for (let writerId of writers) {
//       if (!isValidObjectId(writerId)) return sendError(res, "Invalid writer id!");
//     }

//     movie.writers = writers;
//   }

//   await movie.save();

//   res.json({ message: "Movie is updated", movie });
// };

export const updateMovie = async (req: Request, res: Response) => {
  const { movieId } = req.params;
  const files = req.files as { video: Express.Multer.File[]; poster: Express.Multer.File[] } | undefined;

  if (!isValidObjectId(movieId)) return sendError(res, "Invalid movie ID"); // Trans

  // if (!req.file) return sendError(res, 'Movie poster is missing!');

  const movie = await Movie.findById(movieId);
  if (!movie) return sendError(res, "Movie not found", 404); // Trans

  const { title, storyLine, director, releaseDate, status, type, genres, tags, cast, writer, language } = req.body;

  movie.title = title;
  movie.storyLine = storyLine;
  movie.releaseDate = releaseDate;
  movie.status = status;
  movie.type = type;
  movie.genres = genres;
  movie.tags = tags;
  movie.cast = cast;
  movie.language = language;

  if (director) {
    if (!isValidObjectId(director)) return sendError(res, "Invalid director ID");
    movie.director = director;
  }

  if (writer) {
    if (!isValidObjectId(writer)) return sendError(res, "Invalid writer ID");
    movie.writer = writer;
  }

  if (files && files.video[0]) {
    const videoID = movie.video?.public_id;
    if (videoID) {
      const { result } = await cloudinary.uploader.destroy(videoID);
      if (result !== "ok") return sendError(res, "Could not update video at the moment"); // Trans
    }

    const { secure_url: url, public_id } = await cloudinary.uploader.upload(files.video[0].path, {
      resource_type: "video",
    });
    movie.video = { url, public_id };
  }

  // update poster
  if (files && files.poster[0]) {
    // removing poster from cloud if there is any
    const posterID = movie.poster?.public_id;
    if (posterID) {
      const { result } = await cloudinary.uploader.destroy(posterID);
      if (result !== "ok") return sendError(res, "Could not update poster at the moment"); // Trans
    }

    // uploading poster
    const {
      secure_url: url,
      public_id,
      responsive_breakpoints,
    } = await cloudinary.uploader.upload(files.poster[0].path, {
      transformation: {
        width: 1280,
        height: 720,
      },
      // https://www.responsivebreakpoints.com/
      // https://cloudinary.com/documentation/image_upload_api_reference#upload_optional_parameters
      responsive_breakpoints: {
        create_derived: true,
        max_width: 640,
        max_images: 3,
      },
    });

    const finalPoster: { url: string; public_id: string; responsive: string[] } = {
      url,
      public_id,
      responsive: [],
    };
    const { breakpoints } = responsive_breakpoints[0];
    if (breakpoints.length) {
      for (let imgObj of breakpoints) {
        const { secure_url } = imgObj;
        finalPoster.responsive.push(secure_url);
      }
    }

    movie.poster = finalPoster;
  }

  await movie.save();

  res.json({
    message: "Movie is updated", // Trans
    movie: {
      id: movie._id,
      title: movie.title,
      poster: movie.poster?.url,
      genres: movie.genres,
      status: movie.status,
    },
  });
};

export const removeMovie = async (req: Request, res: Response) => {
  const { movieId } = req.params;

  if (!isValidObjectId(movieId)) return sendError(res, "Invalid movie ID");

  const movie = await Movie.findById(movieId);
  // console.log(movie);
  if (!movie) return sendError(res, "Movie not found", 404);

  // check if there is any poster
  // if yes then we need to remove it from cloudinary
  const posterId = movie.poster?.public_id;

  if (posterId) {
    const { result } = await cloudinary.uploader.destroy(posterId);
    if (result !== "ok") return sendError(res, "Could not remove poster at the moment"); // Trans
  }

  // removing trailer
  const videoId = movie.video?.public_id;
  if (!videoId) return sendError(res, "Could not find video in the cloud"); // Trans

  const { result } = await cloudinary.uploader.destroy(videoId, {
    resource_type: "video",
    //  Default: image.
  });

  if (result !== "ok") return sendError(res, "Could not remove video at the moment"); // Trans

  await Movie.findByIdAndDelete(movieId);

  res.json({ message: "Movie removed successfully" }); // Trans
};

export const getMovies = async (req: Request, res: Response) => {
  const pageNo = parseInt(req.query.pageNo as string) || 0;
  const limit = parseInt(req.query.limit as string) || 10;
  const movieCount = await Movie.countDocuments();
  const movies = await Movie.find({})
    .sort({ createdAt: -1 })
    .skip(pageNo * limit)
    .limit(limit);

  const results = movies.map((movie) => ({
    id: movie._id,
    title: movie.title,
    poster: movie.poster?.url,
    responsivePosters: movie.poster?.responsive,
    genres: movie.genres,
    status: movie.status,
  }));

  res.json({ movies: results, totalMovieCount: movieCount });
};

export const getMovieForUpdate = async (req: Request, res: Response) => {
  const { movieId } = req.params;

  if (!isValidObjectId(movieId)) return sendError(res, "Invalid movie ID");

  // Populating Multiple Paths in Middleware
  const movie = await Movie.findById(movieId).populate<{
    director: ActorDoc;
    writer: ActorDoc;
    cast: ActorDoc[];
  }>("director writer cast");
  if (!movie) return sendError(res, "Movie not found", 404);
  // console.log(movie);

  res.json({
    movie: {
      id: movie._id,
      title: movie.title,
      storyLine: movie.storyLine,
      poster: movie.poster?.url,
      releaseDate: movie.releaseDate,
      status: movie.status,
      type: movie.type,
      genres: movie.genres,
      tags: movie.tags,
      language: movie.language,
      director: formateActor(movie.director),
      writer: formateActor(movie.writer),
      cast: movie.cast.map((c) => ({
        profile: formateActor(c),
        // roleAs: c.roleAs,
        // leadActor: c.leadActor,
      })),
    },
  });
};

export const searchMovies = async (req: Request, res: Response) => {
  const title = req.query.title as string;

  if (!title.trim()) return sendError(res, "Invalid requests"); // Trans
  const movies = await Movie.find({ title: { $regex: title, $options: "i" } });

  const results = movies.map((m) => ({
    id: m._id,
    title: m.title,
    poster: m.poster?.url,
    genres: m.genres,
    status: m.status,
  }));

  res.json({ results });
};

export const getLatestUploads = async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 5;

  const results = await Movie.find({ status: "public" }).sort("-createdAt").limit(limit);

  const movies = results.map((m) => ({
    id: m._id,
    title: m.title,
    storyLine: m.storyLine,
    poster: m.poster?.url,
    responsivePosters: m.poster?.responsive,
    video: m.video?.url,
  }));

  res.json({ movies });
};

export const getSingleMovie = async (req: Request, res: Response) => {
  const { movieId } = req.params;

  // // if use 'movieId', need to parse it to ObjectId
  // mongoose.Types.ObjectId(movieId)

  if (!isValidObjectId(movieId)) return sendError(res, "Invalid movie ID");

  const movie = await Movie.findById(movieId).populate<{
    director: ActorDoc;
    writer: ActorDoc;
    cast: ActorDoc[];
  }>("director writer cast");
  if (!movie) return sendError(res, "Movie not found", 404);

  // const [aggregatedResponse] = await Review.aggregate(
  //   averageRatingPipeline(movie._id)
  // );

  // const reviews = {};

  // if (aggregatedResponse) {
  //   const { ratingAvg, reviewCount } = aggregatedResponse;
  //   reviews.ratingAvg = parseFloat(ratingAvg).toFixed(1);
  //   reviews.reviewCount = reviewCount;
  // }

  const reviews = await getAverageRatings(movie._id);

  const {
    _id: id,
    title,
    storyLine,
    cast,
    writer,
    director,
    releaseDate,
    genres,
    tags,
    language,
    poster,
    video,
    type,
  } = movie;

  res.json({
    movie: {
      id,
      title,
      storyLine,
      releaseDate,
      genres,
      tags,
      language,
      type,
      poster: poster?.url,
      video: video?.url,
      cast: cast.map((c) => ({
        id: c._id,
        // profile: {
        // id: c.actor._id,
        name: c.name,
        avatar: c.avatar?.url,
        // },
        // leadActor: c.leadActor,
        // roleAs: c.roleAs,
      })),
      writer: {
        id: writer._id,
        name: writer.name,
      },
      director: {
        id: director._id,
        name: director.name,
      },
      reviews,
      // reviews: { ...reviews },
    },
  });
};

export const getRelatedMovies = async (req: Request, res: Response) => {
  const { movieId } = req.params;
  if (!isValidObjectId(movieId)) return sendError(res, "Invalid movie ID");

  const movie = await Movie.findById(movieId);
  if (!movie) return sendError(res, "Movie not found", 404);

  const movies = await Movie.aggregate(relatedMovieAggregation(movie.tags, movie._id));
  // console.log('controllers-movie: ', movies);

  // 一次性批量查询所有相关电影的评分，避免 N+1 查询
  const ratingsMap = await getAverageRatingsMap(movies.map((m) => m._id));

  const relatedMovies = movies.map((m) => ({
    id: m._id,
    title: m.title,
    poster: m.poster,
    responsivePosters: m.responsivePosters,
    reviews: ratingsMap.get(m._id.toString()) || {},
  }));

  res.json({ movies: relatedMovies });
};

export const getTopRatedMovies = async (req: Request, res: Response) => {
  const genre = req.query.genre as string | undefined;

  const movies = await Movie.aggregate(topRatedMoviesPipeline(genre));

  // 一次性批量查询所有电影的评分，避免 N+1 查询
  const ratingsMap = await getAverageRatingsMap(movies.map((m) => m._id));

  const topRatedMovies = movies.map((m) => ({
    id: m._id,
    title: m.title,
    poster: m.poster,
    responsivePosters: m.responsivePosters,
    reviews: ratingsMap.get(m._id.toString()) || {},
  }));

  res.json({ movies: topRatedMovies });
};

export const searchPublicMovies = async (req: Request, res: Response) => {
  const title = req.query.title as string;

  if (!title.trim()) return sendError(res, "Invalid request");
  const movies = await Movie.find({
    title: { $regex: title, $options: "i" },
    status: "public",
  });

  // 一次性批量查询所有搜索结果的评分，避免 N+1 查询
  const ratingsMap = await getAverageRatingsMap(movies.map((m) => m._id));

  const results = movies.map((m) => ({
    id: m._id,
    title: m.title,
    poster: m.poster?.url,
    responsivePosters: m.poster?.responsive,
    reviews: ratingsMap.get(m._id.toString()) || {},
  }));

  res.json({
    results,
  });
};

export const getMoviesByTag = async (req: Request, res: Response) => {
  const tag = req.query.tag as string;
  const limit = parseInt(req.query.limit as string) || 8;

  const results = await Movie.find({ status: "public", tags: { $regex: tag, $options: "i", $in: [tag] } })
    .sort("-createdAt")
    .limit(limit);

  const movies = results.map((m) => ({
    id: m._id,
    title: m.title,
    storyLine: m.storyLine,
    poster: m.poster?.url,
    responsivePosters: m.poster?.responsive,
    video: m.video?.url,
  }));

  res.json({ movies });
};
