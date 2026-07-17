import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { isPublicAddress } from "../src/utils/ssrf.js";

const app = createApp();

describe("SSRF address classifier", () => {
  it("treats public addresses as safe", () => {
    expect(isPublicAddress("8.8.8.8")).toBe(true);
    expect(isPublicAddress("1.1.1.1")).toBe(true);
    expect(isPublicAddress("2606:4700:4700::1111")).toBe(true); // Cloudflare IPv6
  });

  it("blocks loopback, private, link-local and metadata addresses", () => {
    expect(isPublicAddress("127.0.0.1")).toBe(false); // loopback
    expect(isPublicAddress("10.0.0.5")).toBe(false); // private
    expect(isPublicAddress("192.168.1.10")).toBe(false); // private
    expect(isPublicAddress("172.16.5.4")).toBe(false); // private
    expect(isPublicAddress("169.254.169.254")).toBe(false); // cloud metadata
    expect(isPublicAddress("::1")).toBe(false); // IPv6 loopback
    expect(isPublicAddress("::ffff:127.0.0.1")).toBe(false); // IPv4-mapped loopback
  });

  it("treats garbage as unsafe", () => {
    expect(isPublicAddress("not-an-ip")).toBe(false);
  });
});

describe("ingestion routes require auth", () => {
  it("rejects unauthenticated github ingest with 401", async () => {
    const res = await request(app).post("/api/v1/ingest/github").send({ username: "octocat" });
    expect(res.status).toBe(401);
  });

  it("rejects unauthenticated source listing with 401", async () => {
    const res = await request(app).get("/api/v1/sources");
    expect(res.status).toBe(401);
  });

  it("validates github username when authenticated", async () => {
    // Register to get a token.
    const reg = await request(app)
      .post("/api/v1/auth/register")
      .send({ name: "T", email: "ingest@example.com", password: "secret123" });
    const token = reg.body.token as string;

    const res = await request(app)
      .post("/api/v1/ingest/github")
      .set("Authorization", `Bearer ${token}`)
      .send({ username: "invalid user name!" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("validation_error");
  });
});

describe("deleting a source", () => {
  async function tokenFor(email: string): Promise<string> {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ name: "D", email, password: "secret123" });
    return res.body.token;
  }

  it("requires auth", async () => {
    const res = await request(app).delete("/api/v1/sources/64b000000000000000000000");
    expect(res.status).toBe(401);
  });

  it("404s deleting a non-existent source", async () => {
    const token = await tokenFor("del-missing@example.com");
    const res = await request(app)
      .delete("/api/v1/sources/64b000000000000000000000")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it("deletes a source (204) then it's gone (404)", async () => {
    const token = await tokenFor("del-happy@example.com");
    const created = await request(app)
      .post("/api/v1/ingest/github")
      .set("Authorization", `Bearer ${token}`)
      .send({ username: "octocat" });
    const id = created.body.id as string;

    const del = await request(app)
      .delete(`/api/v1/sources/${id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(del.status).toBe(204);

    const after = await request(app)
      .get(`/api/v1/sources/${id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(after.status).toBe(404);
  });
});
