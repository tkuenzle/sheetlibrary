// Shrinks a photo in the browser before it is sent: upright, at most
// LONG_EDGE on its long edge, as a JPEG. A photo the browser can't decode,
// such as HEIC on a desktop, gives nothing. See openspec/specs/library-page.

// The API reads a 4:3 photo at up to about this many pixels on its long edge
// (docs/photo-import-spike.md). #102 may pick another size.
export const LONG_EDGE = 2236;
export const JPEG_QUALITY = 0.9;

// The size to draw a photo at: scaled down to fit LONG_EDGE, never up.
export function shrunkSize(
  width: number,
  height: number,
): { width: number; height: number } {
  const scale = Math.min(1, LONG_EDGE / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

// A decoded photo, upright, and what draws it at a size as a JPEG. Tests
// give fakes; the browser's are below.
export interface Decoded {
  width: number;
  height: number;
  close: () => void;
}

export interface ImageTools<Image extends Decoded> {
  decode: (photo: Blob) => Promise<Image>;
  encode: (image: Image, width: number, height: number) => Promise<Blob>;
}

export async function shrinkPhoto<Image extends Decoded>(
  photo: Blob,
  tools: ImageTools<Image>,
): Promise<Blob | undefined> {
  let image: Image;
  try {
    image = await tools.decode(photo);
  } catch {
    return undefined;
  }
  try {
    const { width, height } = shrunkSize(image.width, image.height);
    return await tools.encode(image, width, height);
  } catch {
    return undefined;
  } finally {
    image.close();
  }
}

// `createImageBitmap` turns the photo upright from its orientation tag, as
// its `imageOrientation` is "from-image" by default.
export const browserImageTools: ImageTools<ImageBitmap> = {
  decode: (photo) => createImageBitmap(photo),
  encode: (image, width, height) =>
    new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("No 2D canvas"));
        return;
      }
      context.drawImage(image, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("The photo couldn't be encoded"));
        },
        "image/jpeg",
        JPEG_QUALITY,
      );
    }),
};
