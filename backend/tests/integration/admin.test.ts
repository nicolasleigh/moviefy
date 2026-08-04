import request from "supertest";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import app from "../../app";
import { connectTestDB, clearDB, disconnectTestDB } from "../helpers/db";
import { createUser, createMovie, createReview } from "../helpers/seed";

describe("admin integration", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  describe("GET /api/admin/app-info", () => {
    it("requires a token", async () => {
      const res = await request(app).get("/api/admin/app-info");
      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid token");
    });

    it("rejects non-admin users", async () => {
      const { token } = await createUser();
      const res = await request(app).get("/api/admin/app-info").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Only administrators can perform this action");
    });

    it("returns resource counts for an admin", async () => {
      const { token } = await createUser({ role: "admin" });
      const { user } = await createUser();
      const movie = await createMovie();
      await createReview({ owner: user._id, parentMovie: movie._id });

      const res = await request(app).get("/api/admin/app-info").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.appInfo).toEqual({ movieCount: 1, reviewCount: 1, userCount: 2 });
    });
  });

  describe("GET /api/admin/most-rated", () => {
    it("returns the most-rated movies for an admin", async () => {
      const { token } = await createUser({ role: "admin" });
      const { user } = await createUser();
      const movie = await createMovie({ title: "Most Rated" });
      await createReview({ owner: user._id, parentMovie: movie._id, rating: 10 });

      const res = await request(app).get("/api/admin/most-rated").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.movies).toHaveLength(1);
      expect(res.body.movies[0].title).toBe("Most Rated");
    });

    it("requires a token", async () => {
      const res = await request(app).get("/api/admin/most-rated");
      expect(res.status).toBe(401);
    });
  });
});
