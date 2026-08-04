import request from "supertest";
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import app from "../../app";
import { connectTestDB, clearDB, disconnectTestDB } from "../helpers/db";
import { createUser } from "../helpers/seed";
import User from "../../models/user";
import EmailVerificationToken from "../../models/emailVerificationToken";
import PasswordResetToken from "../../models/passwordResetToken";

// mock 邮件发送：避免集成测试真实连接 SMTP。vi.mock 会被提升到本文件顶部，
// 确保 user 控制器加载前 utils/mail 已被替换。
const { MAIL_OTP } = vi.hoisted(() => ({ MAIL_OTP: "1234" }));
vi.mock("../../utils/mail", () => ({
  generateOTP: vi.fn(() => MAIL_OTP),
  generateMailTransporter: vi.fn(() => ({
    verify: vi.fn((cb?: (err: Error | null) => void) => cb?.(null)),
    sendMail: vi.fn(),
  })),
}));

const registerPayload = (email = "alice@example.com") => ({
  name: "Alice",
  email,
  password: "password123",
});

describe("auth integration", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  describe("POST /api/user/create", () => {
    it("registers a user and stores a hashed password", async () => {
      const res = await request(app).post("/api/user/create").send(registerPayload());

      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe("alice@example.com");
      expect(res.body.user.id).toBeTruthy();

      const user = await User.findOne({ email: "alice@example.com" });
      expect(user).toBeTruthy();
      expect(user!.password).not.toBe("password123");
    });

    it("rejects a duplicate email", async () => {
      await request(app).post("/api/user/create").send(registerPayload());

      const res = await request(app)
        .post("/api/user/create")
        .send(registerPayload("alice@example.com"));
      expect(res.status).toBe(401);
      expect(res.body.error).toBe("This email is already in use");
    });

    it("rejects a weak password via validation", async () => {
      const res = await request(app)
        .post("/api/user/create")
        .send({ name: "Alice", email: "weak@example.com", password: "short" });
      expect(res.body.error).toBeTruthy();
      expect(await User.findOne({ email: "weak@example.com" })).toBeNull();
    });
  });

  describe("POST /api/user/verify-email", () => {
    it("verifies the user with the correct OTP and returns a JWT", async () => {
      const created = await request(app).post("/api/user/create").send(registerPayload());
      const userId = created.body.user.id;

      const res = await request(app).post("/api/user/verify-email").send({ userId, OTP: MAIL_OTP });
      expect(res.status).toBe(200);
      expect(res.body.user.isVerified).toBe(true);
      expect(res.body.user.token).toBeTruthy();

      const user = await User.findById(userId);
      expect(user!.isVerified).toBe(true);
      expect(await EmailVerificationToken.findOne({ owner: userId })).toBeNull();
    });

    it("rejects a wrong OTP", async () => {
      const created = await request(app).post("/api/user/create").send(registerPayload());
      const userId = created.body.user.id;

      const res = await request(app).post("/api/user/verify-email").send({ userId, OTP: "9999" });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid OTP");
    });
  });

  describe("POST /api/user/resend-email-verification-token", () => {
    it("issues a new OTP when no pending token exists", async () => {
      const created = await request(app).post("/api/user/create").send(registerPayload());
      const userId = created.body.user.id;
      await EmailVerificationToken.deleteOne({ owner: userId });

      const res = await request(app)
        .post("/api/user/resend-email-verification-token")
        .send({ userId });
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("New OTP has been sent to your email");
      expect(await EmailVerificationToken.findOne({ owner: userId })).toBeTruthy();
    });
  });

  describe("POST /api/user/sign-in", () => {
    it("signs in with correct credentials", async () => {
      await request(app).post("/api/user/create").send(registerPayload());

      const res = await request(app)
        .post("/api/user/sign-in")
        .send({ email: "alice@example.com", password: "password123" });
      expect(res.status).toBe(200);
      expect(res.body.user.token).toBeTruthy();
      expect(res.body.user.email).toBe("alice@example.com");
    });

    it("rejects a wrong password", async () => {
      await request(app).post("/api/user/create").send(registerPayload());

      const res = await request(app)
        .post("/api/user/sign-in")
        .send({ email: "alice@example.com", password: "wrongpass" });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Email or Password is incorrect");
    });
  });

  describe("password reset flow", () => {
    it("forget-password creates a reset token", async () => {
      await request(app).post("/api/user/create").send(registerPayload());

      const res = await request(app)
        .post("/api/user/forget-password")
        .send({ email: "alice@example.com" });
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Reset password link has been sent to your email");

      const user = await User.findOne({ email: "alice@example.com" });
      expect(await PasswordResetToken.findOne({ owner: user!._id })).toBeTruthy();
    });

    it("verifies a valid reset token", async () => {
      const created = await request(app).post("/api/user/create").send(registerPayload());
      const userId = created.body.user.id;
      const rawToken = "reset-token-abc-123";
      await PasswordResetToken.create({ owner: userId, token: rawToken });

      const res = await request(app)
        .post("/api/user/verify-pass-reset-token")
        .send({ userId, token: rawToken });
      expect(res.status).toBe(200);
      expect(res.body.valid).toBe(true);
    });

    it("rejects an invalid reset token", async () => {
      const created = await request(app).post("/api/user/create").send(registerPayload());
      const userId = created.body.user.id;

      const res = await request(app)
        .post("/api/user/verify-pass-reset-token")
        .send({ userId, token: "wrong-token" });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid request");
    });

    it("resets the password and invalidates the token", async () => {
      const created = await request(app).post("/api/user/create").send(registerPayload());
      const userId = created.body.user.id;
      const rawToken = "reset-token-abc-123";
      await PasswordResetToken.create({ owner: userId, token: rawToken });

      const res = await request(app)
        .post("/api/user/reset-password")
        .send({ userId, token: rawToken, newPassword: "newpassword123" });
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Password reset successfully");

      const user = await User.findById(userId);
      expect(await user!.comparePassword("newpassword123")).toBe(true);
      expect(await PasswordResetToken.findOne({ owner: userId })).toBeNull();
    });
  });

  describe("GET /api/user/is-auth", () => {
    it("returns the authenticated user", async () => {
      const { user, token } = await createUser();
      const res = await request(app).get("/api/user/is-auth").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(user.email);
    });

    it("rejects a missing token", async () => {
      const res = await request(app).get("/api/user/is-auth");
      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid token");
    });
  });
});
