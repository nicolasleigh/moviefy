import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { connectTestDB, clearDB, disconnectTestDB } from "../helpers/db";
import User from "../../models/user";

describe("User model", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  it("hashes the password before saving", async () => {
    const user = await User.create({ name: "N", email: "n@example.com", password: "password123" });
    expect(user.password).not.toBe("password123");
    expect(user.password).toMatch(/^\$2[aby]\$/); // bcrypt hash 前缀
  });

  it("validates passwords via comparePassword", async () => {
    const user = await User.create({ name: "N", email: "n2@example.com", password: "password123" });
    expect(await user.comparePassword("password123")).toBe(true);
    expect(await user.comparePassword("wrong")).toBe(false);
  });

  it("defaults role to user and isVerified to false", async () => {
    const user = await User.create({ name: "N", email: "n3@example.com", password: "password123" });
    expect(user.role).toBe("user");
    expect(user.isVerified).toBe(false);
  });

  it("rejects duplicate emails", async () => {
    await User.create({ name: "A", email: "dup@example.com", password: "password123" });
    await expect(
      User.create({ name: "B", email: "dup@example.com", password: "password123" })
    ).rejects.toThrow();
  });
});
