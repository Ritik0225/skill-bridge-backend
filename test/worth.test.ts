import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

const app = createApp();

async function tokenFor(email: string): Promise<string> {
  const res = await request(app)
    .post("/api/v1/auth/register")
    .send({ name: "W", email, password: "secret123" });
  return res.body.token;
}

describe("worth routes", () => {
  it("requires auth", async () => {
    const res = await request(app)
      .post("/api/v1/worth")
      .send({ experienceYears: 2, location: "Bangalore" });
    expect(res.status).toBe(401);
  });

  it("validates the request body (missing location)", async () => {
    const token = await tokenFor("worth-val@example.com");
    const res = await request(app)
      .post("/api/v1/worth")
      .set("Authorization", `Bearer ${token}`)
      .send({ experienceYears: 2 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("validation_error");
  });

  it("400s when estimating with no profile", async () => {
    const token = await tokenFor("worth-noprofile@example.com");
    const res = await request(app)
      .post("/api/v1/worth")
      .set("Authorization", `Bearer ${token}`)
      .send({ experienceYears: 2, location: "Bangalore" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("bad_request");
  });

  it("404s when no estimate exists yet", async () => {
    const token = await tokenFor("worth-empty@example.com");
    const res = await request(app).get("/api/v1/worth").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
