import { describe, it, expect, vi } from "vitest";
import { validationResult } from "express-validator";
import type { ValidationChain } from "express-validator";
import {
  userValidator,
  signInValidator,
  validateMovie,
  validateRatings,
  validate,
} from "../../middlewares/validator";

const runChains = async (chains: ValidationChain[], body: unknown) => {
  const req = { body, params: {}, query: {}, cookies: {}, headers: {} } as any;
  for (const chain of chains) {
    await chain.run(req);
  }
  return validationResult(req).array();
};

describe("userValidator", () => {
  it("rejects invalid email", async () => {
    const errors = await runChains(userValidator, { name: "N", email: "not-an-email", password: "password123" });
    expect(errors.map((e) => e.msg)).toContain("Email is invalid");
  });

  it("rejects short password", async () => {
    const errors = await runChains(userValidator, { name: "N", email: "n@example.com", password: "short" });
    expect(errors.map((e) => e.msg)).toContain("Password must be between 8 to 20 characters long");
  });

  it("rejects missing name", async () => {
    const errors = await runChains(userValidator, { name: "", email: "n@example.com", password: "password123" });
    expect(errors.map((e) => e.msg)).toContain("Name is missing");
  });

  it("accepts a valid payload", async () => {
    const errors = await runChains(userValidator, { name: "N", email: "n@example.com", password: "password123" });
    expect(errors).toHaveLength(0);
  });
});

describe("signInValidator", () => {
  it("accepts email + password", async () => {
    const errors = await runChains(signInValidator, { email: "n@example.com", password: "password123" });
    expect(errors).toHaveLength(0);
  });

  it("rejects missing password", async () => {
    const errors = await runChains(signInValidator, { email: "n@example.com", password: "" });
    expect(errors.map((e) => e.msg)).toContain("Password is missing");
  });
});

describe("validateMovie", () => {
  it("rejects invalid genre", async () => {
    const errors = await runChains(validateMovie, {
      title: "T",
      storyLine: "S",
      language: "English",
      status: "public",
      type: "movie",
      genres: ["NotAGenre"],
      tags: ["tag"],
      cast: [],
    });
    expect(errors.map((e) => e.msg)).toContain("Invalid genre");
  });

  it("rejects invalid cast id", async () => {
    const errors = await runChains(validateMovie, {
      title: "T",
      storyLine: "S",
      language: "English",
      status: "public",
      type: "movie",
      genres: ["Drama"],
      tags: ["tag"],
      cast: ["not-an-object-id"],
    });
    expect(errors.map((e) => e.msg)).toContain("Invalid actor ID inside cast");
  });

  it("accepts a valid movie payload", async () => {
    const errors = await runChains(validateMovie, {
      title: "T",
      storyLine: "S",
      language: "English",
      status: "public",
      type: "movie",
      genres: ["Drama"],
      tags: ["tag"],
      cast: [],
    });
    expect(errors).toHaveLength(0);
  });
});

describe("validateRatings", () => {
  it("rejects rating above 10", async () => {
    const errors = await runChains([validateRatings], { rating: 11 });
    expect(errors).toHaveLength(1);
  });

  it("rejects rating below 0", async () => {
    const errors = await runChains([validateRatings], { rating: -1 });
    expect(errors).toHaveLength(1);
  });

  it("accepts rating within range", async () => {
    const errors = await runChains([validateRatings], { rating: 8 });
    expect(errors).toHaveLength(0);
  });
});

describe("validate middleware", () => {
  it("responds with first error message when invalid", async () => {
    const req = { body: { email: "not-an-email" }, params: {}, query: {}, cookies: {}, headers: {} } as any;
    await userValidator[1].run(req);
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
    const next = vi.fn();
    validate(req, res, next);
    expect(res.json).toHaveBeenCalledWith({ error: "Email is invalid" });
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next when no errors", () => {
    const req = { body: {}, params: {}, query: {}, cookies: {}, headers: {} } as any;
    const res = {} as any;
    const next = vi.fn();
    validate(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
