import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import {UserModel} from "../src/models/User.js";
import {hashToken} from "../src/utils/hash.js";

const app = createApp();
const validUser = { name: "Aarav", email: "aarav@example.com", password: "secret123" };

describe("POST /api/v1/auth/register", () => {
  it("creates a user and returns a token without leaking the password hash", async () => {
    const res = await request(app).post("/api/v1/auth/register").send(validUser);
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe("aarav@example.com");
    expect(res.body.user.id).toBeTruthy();
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it("rejects a duplicate email with 409", async () => {
    await request(app).post("/api/v1/auth/register").send(validUser);
    const res = await request(app).post("/api/v1/auth/register").send(validUser);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("conflict");
  });

  it("rejects invalid input with 400", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "not-an-email", password: "short" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("validation_error");
  });
});

describe("POST /api/v1/auth/login", () => {
  it("logs in with correct credentials", async () => {
    await request(app).post("/api/v1/auth/register").send(validUser);
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: validUser.email, password: validUser.password });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  it("rejects a wrong password with 401", async () => {
    await request(app).post("/api/v1/auth/register").send(validUser);
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: validUser.email, password: "wrongpassword" });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("unauthorized");
  });

  it("rejects an unknown email with 401", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "nobody@example.com", password: "secret123" });
    expect(res.status).toBe(401);
  });
});

describe("GET /api/v1/auth/me", () => {
  it("returns the current user with a valid token", async () => {
    const reg = await request(app).post("/api/v1/auth/register").send(validUser);
    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${reg.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(validUser.email);
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it("rejects a request with no token with 401", async () => {
    const res = await request(app).get("/api/v1/auth/me");
    expect(res.status).toBe(401);
  });

  it("rejects a request with an invalid token with 401", async () => {
    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", "Bearer not.a.real.token");
    expect(res.status).toBe(401);
  });
});

describe("password reset", () => {
  it("returns 200 for an unknown email (no user enumeration)", async () => {
    const res = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: "nobody@example.com" });
    expect(res.status).toBe(200);
  });

  it("returns 200 for a known email too (same response)", async () => {
    await request(app).post("/api/v1/auth/register").send(validUser);
    const res = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: validUser.email });
    expect(res.status).toBe(200);
  });

  it("rejects reset with an invalid token (400)", async () => {
    const res = await request(app)
      .post("/api/v1/auth/reset-password")
      .send({ token: "does-not-exist", password: "newsecret123" });
    expect(res.status).toBe(400);
  });

  it("rejects reset with an expired token (400)", async () => {
    const reg = await request(app).post("/api/v1/auth/register").send(validUser);
    await UserModel.updateOne(
      { email: validUser.email },
      { passwordResetTokenHash: hashToken("expiredtok"), passwordResetExpires: new Date(Date.now() - 1000) },
    );
    void reg;
    const res = await request(app)
      .post("/api/v1/auth/reset-password")
      .send({ token: "expiredtok", password: "newsecret123" });
    expect(res.status).toBe(400);
  });

  it("resets the password with a valid token, then the new password works", async () => {
    await request(app).post("/api/v1/auth/register").send(validUser);
    await UserModel.updateOne(
      { email: validUser.email },
      {
        passwordResetTokenHash: hashToken("goodtok"),
        passwordResetExpires: new Date(Date.now() + 60_000),
      },
    );

    const reset = await request(app)
      .post("/api/v1/auth/reset-password")
      .send({ token: "goodtok", password: "brandNew123" });
    expect(reset.status).toBe(200);

    // Old password no longer works.
    const oldLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: validUser.email, password: validUser.password });
    expect(oldLogin.status).toBe(401);

    // New password works.
    const newLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: validUser.email, password: "brandNew123" });
    expect(newLogin.status).toBe(200);

    // Token is single-use — can't be reused.
    const reuse = await request(app)
      .post("/api/v1/auth/reset-password")
      .send({ token: "goodtok", password: "another123" });
    expect(reuse.status).toBe(400);
  });
});