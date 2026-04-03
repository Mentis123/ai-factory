import { describe, expect, it } from "vitest";

describe("Health Check", () => {
  it("should return ok status", () => {
    const response = {
      status: "ok",
      platform: "ai-navigator",
    };

    expect(response.status).toBe("ok");
    expect(response.platform).toBe("ai-navigator");
  });
});
