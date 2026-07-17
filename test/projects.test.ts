import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

const app = createApp();

async function tokenFor(email: string): Promise<string> {
  const res = await request(app)
    .post("/api/v1/auth/register")
    .send({ name: "P", email, password: "secret123" });
  return res.body.token;
}

describe("projects routes", () => {
  it("requires auth to generate", async () => {
    const res = await request(app).post("/api/v1/projects/generate");
    expect(res.status).toBe(401);
  });

  it("requires auth to list", async () => {
    const res = await request(app).get("/api/v1/projects");
    expect(res.status).toBe(401);
  });

  it("400s when generating with no gap analysis", async () => {
    const token = await tokenFor("projects-nogap@example.com");
    const res = await request(app)
      .post("/api/v1/projects/generate")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("bad_request");
  });

  it("returns an empty list (200) when no projects exist yet", async () => {
    const token = await tokenFor("projects-empty@example.com");
    const res = await request(app).get("/api/v1/projects").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.projects).toEqual([]);
  });
});
