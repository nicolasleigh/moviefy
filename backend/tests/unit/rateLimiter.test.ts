import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { generalLimiter } from "../../middlewares/rateLimiter";

describe("generalLimiter", () => {
  it("allows requests up to max and blocks beyond with 429", async () => {
    const app = express();
    app.use(generalLimiter);
    app.get("/ping", (_req, res) => res.json({ ok: true }));

    const agent = request(app);

    // max = 100，前 100 次应全部放行
    for (let i = 0; i < 100; i++) {
      const res = await agent.get("/ping");
      expect(res.status).toBe(200);
    }

    // 第 101 次应被限流
    const blocked = await agent.get("/ping");
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toBeTruthy();
  });
});
