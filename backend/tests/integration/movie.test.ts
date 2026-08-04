import request from "supertest";
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { Types } from "mongoose";
import app from "../../app";
import { connectTestDB, clearDB, disconnectTestDB } from "../helpers/db";
import { createUser, createActor, createMovie, createReview } from "../helpers/seed";
import Movie from "../../models/movie";
import cloudinary from "../../cloud";

// mock cloudinary：管理员上传电影文件时不触碰真实网络
vi.mock("../../cloud", () => ({
  default: { uploader: { upload: vi.fn(), destroy: vi.fn() } },
}));

const seedMovies = async () => {
  const actor = await createActor({ name: "Director A" });
  const publicMovie1 = await createMovie({
    title: "Inception 2",
    storyLine: "A heist inside dreams.",
    genres: ["Action"],
    tags: ["action", "dream"],
    status: "public",
    director: actor._id,
    writer: actor._id,
    cast: [actor._id],
  });
  const publicMovie2 = await createMovie({
    title: "The Matrix 4",
    storyLine: "Another simulation.",
    genres: ["Sci-Fi"],
    tags: ["action", "sci-fi"],
    status: "public",
  });
  const privateMovie = await createMovie({
    title: "Secret Project",
    storyLine: "Hidden.",
    genres: ["Drama"],
    tags: ["hidden"],
    status: "private",
  });
  return { actor, publicMovie1, publicMovie2, privateMovie };
};

describe("movie integration", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  describe("GET /api/movie/latest-uploads", () => {
    it("returns only public movies", async () => {
      await seedMovies();
      const res = await request(app).get("/api/movie/latest-uploads?limit=10");
      expect(res.status).toBe(200);
      const titles = res.body.movies.map((m: any) => m.title);
      expect(titles).toHaveLength(2);
      expect(titles).toContain("Inception 2");
      expect(titles).not.toContain("Secret Project");
    });
  });

  describe("GET /api/movie/single/:movieId", () => {
    it("returns a public movie with reviews", async () => {
      const { user } = await createUser();
      const { publicMovie1 } = await seedMovies();
      await createReview({ owner: user._id, parentMovie: publicMovie1._id, rating: 9 });

      const res = await request(app).get(`/api/movie/single/${publicMovie1._id}`);
      expect(res.status).toBe(200);
      expect(res.body.movie.title).toBe("Inception 2");
      expect(res.body.movie.reviews.ratingAvg).toBe("9.0");
      expect(res.body.movie.reviews.reviewCount).toBe(1);
    });

    it("returns an error for an invalid id", async () => {
      const res = await request(app).get("/api/movie/single/not-an-id");
      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid movie ID");
    });

    it("returns 404 for a missing movie", async () => {
      const res = await request(app).get(`/api/movie/single/${new Types.ObjectId()}`);
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Movie not found");
    });
  });

  describe("GET /api/movie/related/:movieId", () => {
    it("returns movies sharing tags and excludes self", async () => {
      const { publicMovie1, publicMovie2 } = await seedMovies();
      const res = await request(app).get(`/api/movie/related/${publicMovie1._id}`);
      expect(res.status).toBe(200);
      const ids = res.body.movies.map((m: any) => m.id);
      expect(ids).toContain(publicMovie2._id.toString());
      expect(ids).not.toContain(publicMovie1._id.toString());
    });
  });

  describe("GET /api/movie/top-rated", () => {
    it("sorts public movies with reviews by review count", async () => {
      const u1 = await createUser();
      const u2 = await createUser();
      const { publicMovie1, publicMovie2, privateMovie } = await seedMovies();
      await createReview({ owner: u1.user._id, parentMovie: publicMovie1._id, rating: 9 });
      await createReview({ owner: u2.user._id, parentMovie: publicMovie1._id, rating: 8 });
      await createReview({ owner: u1.user._id, parentMovie: publicMovie2._id, rating: 7 });

      const res = await request(app).get("/api/movie/top-rated");
      expect(res.status).toBe(200);
      const titles = res.body.movies.map((m: any) => m.title);
      expect(titles[0]).toBe("Inception 2");
      expect(titles).toHaveLength(2);
      expect(titles).not.toContain(privateMovie.title);
    });
  });

  describe("GET /api/movie/search-public", () => {
    it("searches public movies by title", async () => {
      await seedMovies();
      const res = await request(app).get("/api/movie/search-public?title=inception");
      expect(res.status).toBe(200);
      const titles = res.body.results.map((m: any) => m.title);
      expect(titles).toContain("Inception 2");
      expect(titles).not.toContain("Secret Project");
    });
  });

  describe("GET /api/movie/by-tag", () => {
    it("returns public movies matching a tag", async () => {
      await seedMovies();
      const res = await request(app).get("/api/movie/by-tag?tag=action");
      expect(res.status).toBe(200);
      const titles = res.body.movies.map((m: any) => m.title);
      expect(titles).toContain("Inception 2");
      expect(titles).toContain("The Matrix 4");
      expect(titles).not.toContain("Secret Project");
    });
  });

  describe("admin movie management", () => {
    it("rejects movie listing without a token", async () => {
      const res = await request(app).get("/api/movie/movies");
      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid token");
    });

    it("rejects create from a non-admin", async () => {
      const user = await createUser();
      const res = await request(app)
        .post("/api/movie/create")
        .set("Authorization", `Bearer ${user.token}`);
      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Only administrators can perform this action");
    });

    it("creates a movie with video and poster uploads", async () => {
      const admin = await createUser({ role: "admin" });
      const actor = await createActor();
      (cloudinary.uploader.upload as any)
        .mockResolvedValueOnce({ secure_url: "https://x/video.mp4", public_id: "vid1" })
        .mockResolvedValueOnce({
          secure_url: "https://x/poster.jpg",
          public_id: "post1",
          responsive_breakpoints: [{ breakpoints: [{ secure_url: "https://x/poster-small.jpg" }] }],
        });

      const res = await request(app)
        .post("/api/movie/create")
        .set("Authorization", `Bearer ${admin.token}`)
        .field("title", "New Admin Movie")
        .field("storyLine", "An admin-created movie.")
        .field("language", "English")
        .field("status", "public")
        .field("type", "movie")
        .field("genres", JSON.stringify(["Drama"]))
        .field("tags", JSON.stringify(["drama"]))
        .field("cast", JSON.stringify([actor._id.toString()]))
        .field("director", actor._id.toString())
        .attach("video", Buffer.from("fake video bytes"), "video.mp4")
        .attach("poster", Buffer.from("fake poster bytes"), "poster.jpg");

      expect(res.status).toBe(201);
      expect(res.body.movie.title).toBe("New Admin Movie");

      const movie = await Movie.findOne({ title: "New Admin Movie" });
      expect(movie).toBeTruthy();
      expect(movie!.video?.url).toBe("https://x/video.mp4");
      expect(movie!.poster?.url).toBe("https://x/poster.jpg");
    });

    it("returns an error when no file is uploaded", async () => {
      const admin = await createUser({ role: "admin" });
      const res = await request(app)
        .post("/api/movie/create")
        .set("Authorization", `Bearer ${admin.token}`)
        .field("title", "No File")
        .field("storyLine", "No file here.")
        .field("language", "English")
        .field("status", "public")
        .field("type", "movie")
        .field("genres", JSON.stringify(["Drama"]))
        .field("tags", JSON.stringify(["drama"]))
        .field("cast", JSON.stringify([]));
      expect(res.status).toBe(401);
      expect(res.body.error).toBe("File is missing");
    });
  });
});
