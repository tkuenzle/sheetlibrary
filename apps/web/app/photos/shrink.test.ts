import { describe, expect, it, vi } from "vitest";

import { type Decoded, LONG_EDGE, shrinkPhoto, shrunkSize } from "./shrink";

// Fake tools: "decoding" reads the size from the blob's text, such as
// "4032x3024", and fails on anything else. "Encoding" writes the size it is
// drawn at.
function fakeTools() {
  const closed = vi.fn();
  return {
    closed,
    tools: {
      decode: async (photo: Blob): Promise<Decoded> => {
        const size = /^(\d+)x(\d+)$/.exec(await photo.text());
        if (!size) throw new DOMException("Not an image", "InvalidStateError");
        return {
          width: Number(size[1]),
          height: Number(size[2]),
          close: closed,
        };
      },
      encode: (_image: Decoded, width: number, height: number) =>
        Promise.resolve(
          new Blob([`${String(width)}x${String(height)}`], {
            type: "image/jpeg",
          }),
        ),
    },
  };
}

describe("shrunkSize", () => {
  // Scenario "A large phone photo".
  it("fits the long edge, keeping the shape", () => {
    expect(LONG_EDGE).toBe(2236);
    expect(shrunkSize(4032, 3024)).toEqual({ width: 2236, height: 1677 });
    expect(shrunkSize(3024, 4032)).toEqual({ width: 1677, height: 2236 });
  });

  it("leaves a small photo as it is", () => {
    expect(shrunkSize(1200, 900)).toEqual({ width: 1200, height: 900 });
    expect(shrunkSize(2236, 100)).toEqual({ width: 2236, height: 100 });
  });
});

describe("shrinkPhoto", () => {
  it("draws the photo at its shrunk size as a JPEG", async () => {
    const { tools, closed } = fakeTools();
    const shrunk = await shrinkPhoto(new Blob(["4032x3024"]), tools);
    expect(shrunk?.type).toBe("image/jpeg");
    expect(await shrunk?.text()).toBe("2236x1677");
    expect(closed).toHaveBeenCalledOnce();
  });

  // Scenario "A HEIC photo on a desktop".
  it("gives nothing for a photo it can't open", async () => {
    const { tools, closed } = fakeTools();
    expect(await shrinkPhoto(new Blob(["HEIC"]), tools)).toBeUndefined();
    expect(closed).not.toHaveBeenCalled();
  });

  it("gives nothing when the photo can't be drawn, and still closes it", async () => {
    const { tools, closed } = fakeTools();
    const failing = {
      ...tools,
      encode: () => Promise.reject(new Error("No 2D canvas")),
    };
    expect(await shrinkPhoto(new Blob(["800x600"]), failing)).toBeUndefined();
    expect(closed).toHaveBeenCalledOnce();
  });
});
