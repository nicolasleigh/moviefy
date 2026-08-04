import request from "supertest";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { Types } from "mongoose";
import app from "../../app";
import { connectTestDB, clearDB, disconnectTestDB } from "../helpers/db";
import { createUser, createMovie, createReview } from "../helpers/seed";
import Movie from "../../models/movie";
import Review from "../../models/review";

describe("review integration", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  describe("POST /api/review/add/:movieId", () => {
    it("rejects unauthenticated requests", async () => {
      const movie = await createMovie();
      const res = await request(app)
        .post(`/api/review/add/${movie._id}`)
        .send({ content: "x", rating: 8 });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid token");
    });

    it("rejects a rating out of range via validation", async () => {
      const { user, token } = await createUser();
      const movie = await createMovie();
      const res = await request(app)
        .post(`/api/review/add/${movie._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ content: "x", rating: 11 });
      expect(res.body.error).toBeTruthy();
    });

    it("adds a review and updates the movie", async () => {
      const { user, token } = await createUser();
      const movie = await createMovie();
      const res = await request(app)
        .post(`/api/review/add/${movie._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ content: "Loved it", rating: 9 });
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Your review has been added");
      expect(res.body.reviews.ratingAvg).toBe("9.0");
      expect(res.body.reviews.reviewCount).toBe(1);

      const updatedMovie = await Movie.findById(movie._id);
      expect(updatedMovie!.reviews).toHaveLength(1);
    });

    it("prevents reviewing the same movie twice", async () => {
      const { user, token } = await createUser();
      const movie = await createMovie();
      await createReview({ owner: user._id, parentMovie: movie._id, rating: 8 });

      const res = await request(app)
        .post(`/api/review/add/${movie._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ content: "Again", rating: 7 });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe("You have already reviewed this movie");
    });

    it("returns 404 when the movie is missing", async () => {
      const { user, token } = await createUser();
      const res = await request(app)
        .post(`/api/review/add/${new Types.ObjectId()}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ content: "x", rating: 8 });
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Movie not found");
    });
  });

  describe("PATCH /api/review/:reviewId", () => {
    it("updates own review", async () => {
      const { user, token } = await createUser();
      const movie = await createMovie();
      await createReview({ owner: user._id, parentMovie: movie._id, content: "First", rating: 7 });
      const review = await Review.findOne({ owner: user._id });

      const res = await request(app)
        .patch(`/api/review/${review!._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ content: "Updated", rating: 10 });
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Your review has been updated");

      const updated = await Review.findById(review!._id);
      expect(updated!.content).toBe("Updated");
      expect(updated!.rating).toBe(10);
    });
  });

  describe("DELETE /api/review/:reviewId", () => {
    it("removes the review and detaches it from the movie", async () => {
      const { user, token } = await createUser();
      const movie = await createMovie();
      await createReview({ owner: user._id, parentMovie: movie._id });
      const review = await Review.findOne({ owner: user._id });

      const res = await request(app)
        .delete(`/api/review/${review!._id}`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Review removed successfully");

      expect(await Review.findById(review!._id)).toBeNull();
      const updatedMovie = await Movie.findById(movie._id);
      expect(updatedMovie!.reviews).toHaveLength(0);
    });
  });

  describe("GET /api/review/get-reviews-by-movie/:movieId", () => {
    it("returns reviews with owner info", async () => {
      const { user } = await createUser({ name: "Reviewer" });
      const movie = await createMovie({ title: "Review Target" });
      await createReview({ owner: user._id, parentMovie: movie._id, content: "Nice", rating: 8 });

      const res = await request(app).get(`/api/review/get-reviews-by-movie/${movie._id}`);
      expect(res.status).toBe(200);
      expect(res.body.movie.title).toBe("Review Target");
      expect(res.body.movie.reviews).toHaveLength(1);
      expect(res.body.movie.reviews[0]).toMatchObject({
        content: "Nice",
        rating: 8,
        owner: { name: "Reviewer" },
      });
    });

    it("rejects an invalid movie id", async () => {
      const res = await request(app).get("/api/review/get-reviews-by-movie/not-an-id");
      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid movie ID");
    });
  });
});
