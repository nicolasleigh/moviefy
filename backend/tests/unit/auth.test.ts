import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import { isAuth, isAdmin } from "../../middlewares/auth";
import User from "../../models/user";

vi.mock("../../models/user", () => ({
  default: { findById: vi.fn() },
}));

const mockRes = () => ({ status: vi.fn().mockReturnThis(), json: vi.fn() }) as any;
const VALID_ID = "650000000000000000000000";

describe("isAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when Authorization header is missing", async () => {
    const res = mockRes();
    const next = vi.fn();
    await isAuth({ headers: {} } as any, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid token" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when token lacks Bearer prefix", async () => {
    const res = mockRes();
    const next = vi.fn();
    await isAuth({ headers: { authorization: "Token abc.def.ghi" } } as any, res, next);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid token" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 404 when user not found", async () => {
    (User.findById as any).mockResolvedValue(null);
    const token = jwt.sign({ userId: VALID_ID }, process.env.JWT_SECRET!);
    const res = mockRes();
    const next = vi.fn();
    await isAuth({ headers: { authorization: `Bearer ${token}` } } as any, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid token, user not found" });
  });

  it("sets req.user and calls next for a valid token", async () => {
    const user = { _id: VALID_ID, name: "N", email: "n@example.com", role: "user" };
    (User.findById as any).mockResolvedValue(user);
    const token = jwt.sign({ userId: VALID_ID }, process.env.JWT_SECRET!);
    const req = { headers: { authorization: `Bearer ${token}` } } as any;
    const res = mockRes();
    const next = vi.fn();
    await isAuth(req, res, next);
    expect(req.user).toBe(user);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("rejects when the JWT is invalid", async () => {
    const res = mockRes();
    const next = vi.fn();
    await expect(
      isAuth({ headers: { authorization: "Bearer garbage.token.here" } } as any, res, next)
    ).rejects.toThrow();
  });
});

describe("isAdmin", () => {
  it("calls next for an admin", () => {
    const req = { user: { role: "admin" } } as any;
    const next = vi.fn();
    isAdmin(req, {} as any, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("rejects a regular user", () => {
    const req = { user: { role: "user" } } as any;
    const res = mockRes();
    const next = vi.fn();
    isAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Only administrators can perform this action",
    });
    expect(next).not.toHaveBeenCalled();
  });
});
