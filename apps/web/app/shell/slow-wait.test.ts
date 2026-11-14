import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SLOW_WAIT, startWait } from "./slow-wait";

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
});
