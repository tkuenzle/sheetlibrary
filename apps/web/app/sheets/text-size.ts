// The play view's text size, as a step from MIN_TEXT_STEP to MAX_TEXT_STEP,
// 0 by default. It is kept in a cookie on this device, so the server renders
// the sheet at its size and nothing wraps again after load. See
// openspec/specs/play-page.

export const MIN_TEXT_STEP = -2;
export const MAX_TEXT_STEP = 3;

// Each step's share of the play view's base size, from the smallest.
const SCALES = [0.8, 0.9, 1, 1.15, 1.3, 1.5];

const NAME = "play-text-size";

// Browsers keep a cookie for 400 days at most.
const maxAge = 400 * 24 * 60 * 60;

// The step this device keeps, from a request's Cookie header. A missing or
// wrong value gives the default.
export function readTextStep(cookieHeader: string | null): number {
  for (const cookie of (cookieHeader ?? "").split(";")) {
    const [name, value] = cookie.trim().split("=");
    if (name !== NAME || value === undefined || !/^-?\d$/.test(value)) {
      continue;
    }
    const step = Number(value);
    if (step >= MIN_TEXT_STEP && step <= MAX_TEXT_STEP) return step;
  }
  return 0;
}

// Keeps the step on this device. `Secure` only over https, since some
// browsers refuse it on http://localhost.
export function keepTextStep(
  step: number,
  target: { cookie: string; location: { protocol: string } } = document,
): void {
  const secure = target.location.protocol === "https:" ? "; Secure" : "";
  target.cookie = `${NAME}=${String(step)}; Path=/; Max-Age=${String(maxAge)}; SameSite=Lax${secure}`;
}

// The lyrics' size for a step, as a CSS length on the play view's base size,
// which is smaller on a phone.
export function textSize(step: number): string {
  const scale = SCALES[step - MIN_TEXT_STEP] ?? 1;
  return scale === 1
    ? "var(--play-text-base)"
    : `calc(var(--play-text-base) * ${String(scale)})`;
}
