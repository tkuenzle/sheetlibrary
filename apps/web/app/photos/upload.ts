import type { PhotoAnswer } from "chordsheet";

// Sends the photos of one song to POST /api/photo-import, one "photo" field
// per page, in order, and gives the sheet read from them. It uses
// XMLHttpRequest, since only it reports upload progress in every browser.
// Aborting the signal aborts the request, which stops the model too. Any
// answer but the sheet rejects.

export interface UploadEvents {
  // How much has been sent, from 0 to 1.
  onProgress: (sent: number) => void;
  // Everything was sent; the server is reading the pages.
  onSent: () => void;
  signal: AbortSignal;
}

export type UploadPhotos = (
  photos: Blob[],
  events: UploadEvents,
) => Promise<PhotoAnswer>;

export function uploadPhotos(
  photos: Blob[],
  { onProgress, onSent, signal }: UploadEvents,
  newRequest: () => XMLHttpRequest = () => new XMLHttpRequest(),
): Promise<PhotoAnswer> {
  return new Promise((resolve, reject) => {
    const aborted = () =>
      new DOMException("The photo import was stopped", "AbortError");
    if (signal.aborted) {
      reject(aborted());
      return;
    }
    const form = new FormData();
    photos.forEach((photo, at) => {
      form.append("photo", photo, `page-${String(at + 1)}.jpg`);
    });
    const request = newRequest();
    request.open("POST", "/api/photo-import");
    request.responseType = "json";
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress(event.loaded / event.total);
      }
    });
    request.upload.addEventListener("load", onSent);
    request.addEventListener("load", () => {
      signal.removeEventListener("abort", abort);
      const answer = request.response as PhotoAnswer | null;
      if (request.status === 200 && answer?.content) resolve(answer);
      else
        reject(
          new Error(`The photos weren't read (${String(request.status)})`),
        );
    });
    request.addEventListener("error", () => {
      signal.removeEventListener("abort", abort);
      reject(new Error("The photos weren't sent"));
    });
    request.addEventListener("abort", () => {
      reject(aborted());
    });
    function abort() {
      request.abort();
    }
    signal.addEventListener("abort", abort, { once: true });
    request.send(form);
  });
}
