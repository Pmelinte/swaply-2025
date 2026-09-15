import { describe, expect, it } from "vitest";
import { buildHomeWorld, DOMAIN_IDS, multiply } from "./homeWorld";

describe("Home 3D geometry", () => {
  const world = buildHomeWorld();
  it("contains all four independent domain islands", () => {
    expect(world.batches.slice(0, 4).map(batch => batch.domain)).toEqual(DOMAIN_IDS);
    expect(new Set(world.batches.slice(0, 4).map(batch => batch.centre.join(","))).size).toBe(4);
  });
  it("uses genuine triangle geometry with a bounded vertex budget", () => {
    expect(world.vertices.length % 30).toBe(0);
    expect(world.vertices.length / 30).toBeGreaterThan(30000);
    expect(world.vertices.length / 30).toBeLessThan(100000);
  });
  it("contains no NaN or infinite coordinates, normals or colours", () => {
    expect(world.vertices.every(Number.isFinite)).toBe(true);
  });
  it("has contiguous, non-overlapping render ranges", () => {
    let end = 0;
    for (const batch of world.batches) {
      expect(batch.start).toBe(end);
      expect(batch.count % 3).toBe(0);
      expect(batch.count).toBeGreaterThan(0);
      end += batch.count;
    }
    expect(end * 10).toBe(world.vertices.length);
  });
  it("rebuilds deterministically for reproducible visual checks", () => {
    const again = buildHomeWorld();
    expect(again.batches).toEqual(world.batches);
    expect(again.vertices).toEqual(world.vertices);
  });
  it("preserves matrices when multiplied by the identity", () => {
    const identity = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
    const translation = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 4,5,6,1]);
    expect(multiply(identity, translation)).toEqual(translation);
    expect(multiply(translation, identity)).toEqual(translation);
  });
});
