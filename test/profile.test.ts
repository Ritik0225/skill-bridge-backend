import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { aggregateExtracted } from "../src/modules/profile/profile.aggregate.js";

const app = createApp();

describe("aggregateExtracted", () => {
  it("merges the same skill across sources (dedup, union evidence/sources, max confidence)", () => {
    const agg = aggregateExtracted([
      {
        type: "github",
        extracted: {
          skills: [{ name: "React", category: "framework", evidence: "many repos", confidence: 0.7 }],
          roles: [{ title: "Frontend Dev" }],
        },
      },
      {
        type: "resume",
        extracted: {
          skills: [{ name: "react", category: "framework", evidence: "led UI work", confidence: 0.9 }],
          roles: [{ title: "Engineer" }],
        },
      },
    ]);

    expect(agg.skills).toHaveLength(1); // React + react merged
    const react = agg.skills[0]!;
    expect(react.name).toBe("React");
    expect(react.confidence).toBe(0.9); // max
    expect(react.evidence).toHaveLength(2); // both snippets
    expect(react.sources.sort()).toEqual(["github", "resume"]);
    expect(agg.roles).toHaveLength(2);
    expect(agg.sourceTypes.sort()).toEqual(["github", "resume"]);
  });

  it("handles empty / missing extracted data safely", () => {
    const agg = aggregateExtracted([{ type: "portfolio", extracted: undefined }]);
    expect(agg.skills).toEqual([]);
    expect(agg.roles).toEqual([]);
  });
});

describe("profile routes", () => {
  async function tokenFor(email: string): Promise<string> {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ name: "P", email, password: "secret123" });
    return res.body.token;
  }

  it("requires auth to build", async () => {
    const res = await request(app).post("/api/v1/profile/build");
    expect(res.status).toBe(401);
  });

  it("400s when building with no processed sources", async () => {
    const token = await tokenFor("noprofile@example.com");
    const res = await request(app)
      .post("/api/v1/profile/build")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("bad_request");
  });

  it("404s when no profile has been built yet", async () => {
    const token = await tokenFor("emptyprofile@example.com");
    const res = await request(app).get("/api/v1/profile").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
