import request from "supertest";
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import app from "../../app";
import { connectTestDB, clearDB, disconnectTestDB } from "../helpers/db";
import { createUser, createActor } from "../helpers/seed";
import Actor from "../../models/actor";
import cloudinary from "../../cloud";

// mock cloudinary：上传头像时不触碰真实网络
vi.mock("../../cloud", () => ({
  default: { uploader: { upload: vi.fn(), destroy: vi.fn() } },
}));

describe("actor integration", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  describe("GET /api/actor/single/:id", () => {
    it("returns a public actor", async () => {
      const actor = await createActor({ name: "Keanu" });
      const res = await request(app).get(`/api/actor/single/${actor._id}`);
      expect(res.status).toBe(200);
      expect(res.body.actor.name).toBe("Keanu");
    });

    it("rejects an invalid id", async () => {
      const res = await request(app).get("/api/actor/single/not-an-id");
      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid request");
    });
  });

  describe("GET /api/actor/actors", () => {
    it("requires an admin token", async () => {
      const res = await request(app).get("/api/actor/actors");
      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid token");
    });
  });

  describe("POST /api/actor/create", () => {
    it("creates an actor with an avatar upload", async () => {
      const admin = await createUser({ role: "admin" });
      (cloudinary.uploader.upload as any).mockResolvedValue({
        secure_url: "https://x/avatar.jpg",
        public_id: "avatar-1",
      });

      const res = await request(app)
        .post("/api/actor/create")
        .set("Authorization", `Bearer ${admin.token}`)
        .field("name", "New Actor")
        .field("about", "A bio")
        .field("gender", "Female")
        .attach("avatar", Buffer.from("fake avatar"), "avatar.jpg");

      expect(res.status).toBe(201);
      expect(res.body.actor.name).toBe("New Actor");

      const actor = await Actor.findOne({ name: "New Actor" });
      expect(actor!.avatar?.url).toBe("https://x/avatar.jpg");
    });

    it("rejects missing name via validation", async () => {
      const admin = await createUser({ role: "admin" });
      const res = await request(app)
        .post("/api/actor/create")
        .set("Authorization", `Bearer ${admin.token}`)
        .field("about", "A bio")
        .field("gender", "Female");
      expect(res.body.error).toBeTruthy();
      expect(await Actor.findOne({ about: "A bio" })).toBeNull();
    });

    it("rejects non-admin users", async () => {
      const user = await createUser();
      const res = await request(app)
        .post("/api/actor/create")
        .set("Authorization", `Bearer ${user.token}`)
        .field("name", "N")
        .field("about", "A")
        .field("gender", "M");
      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Only administrators can perform this action");
    });
  });
});
