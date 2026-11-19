import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SKELETON_HOLD, SLOW_WAIT, startWait } from "./slow-wait";

describe("startWait", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows nothing for a wait shorter than the delay", () => {
    const show = vi.fn();
    const hide = vi.fn();
    const end = startWait(show, hide);
    vi.advanceTimersByTime(SLOW_WAIT - 1);
    end();
    vi.advanceTimersByTime(SLOW_WAIT);
    expect(show).not.toHaveBeenCalled();
    expect(hide).not.toHaveBeenCalled();
  });

  it("shows a longer wait, and hides it when it ends", () => {
    const show = vi.fn();
    const hide = vi.fn();
    const end = startWait(show, hide);
    vi.advanceTimersByTime(SLOW_WAIT);
    expect(show).toHaveBeenCalledOnce();
    expect(hide).not.toHaveBeenCalled();
    end();
    expect(hide).toHaveBeenCalledOnce();
  });

  // Skeleton bars: once shown, they stay for the hold, so they never flash.
  it("keeps a shown wait for its hold, also when it ends sooner", () => {
    const show = vi.fn();
    const hide = vi.fn();
    const end = startWait(show, hide, SLOW_WAIT, SKELETON_HOLD);
    vi.advanceTimersByTime(SLOW_WAIT + 50);
    end();
    expect(hide).not.toHaveBeenCalled();
    vi.advanceTimersByTime(SKELETON_HOLD - 51);
    expect(hide).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(hide).toHaveBeenCalledOnce();
  });

  it("hides at once a wait that showed for longer than its hold", () => {
    const hide = vi.fn();
    const end = startWait(vi.fn(), hide, SLOW_WAIT, SKELETON_HOLD);
    vi.advanceTimersByTime(SLOW_WAIT + SKELETON_HOLD);
    end();
    expect(hide).toHaveBeenCalledOnce();
  });
});
