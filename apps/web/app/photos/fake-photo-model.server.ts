import type { PhotoModel } from "./photo-model.server";

// What the fake answers for any photos: "Amazing Grace" (John Newton, 1779),
// public domain, written by hand in the photo answer format. It reads into
// the editor's seed song.
export const fakeAnswer = `{title: Amazing Grace}

{start_of_verse: Verse 1}
[G]Amazing [G7]grace, how [C]sweet the [G]sound
That saved a wretch like [D]me
I [G]once was [G7]lost, but [C]now am [G]found
Was [Em]blind, but [D]now I [G]see
{end_of_verse}

{start_of_verse: Verse 2}
'Twas [G]grace that [G7]taught my [Cmaj7]heart to [G]fear
And grace my fears re[D]lieved
How [G]precious [G7]did that [C]grace ap[G]pear
The [Em]hour I [D]first be[G]lieved
{end_of_verse}
`;

// The model for local dev and the tests. It never calls a real model. It can
// wait before answering, to try long requests and progress.
export function fakePhotoModel(delaySeconds = 0): PhotoModel {
  return async (_photos, signal) => {
    await wait(delaySeconds * 1000, signal);
    return fakeAnswer;
  };
}

// Waits, or rejects with the signal's reason as soon as it aborts.
function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason as Error);
      return;
    }
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", stop);
      resolve();
    }, ms);
    function stop() {
      clearTimeout(timer);
      reject(signal.reason as Error);
    }
    signal.addEventListener("abort", stop, { once: true });
  });
}
