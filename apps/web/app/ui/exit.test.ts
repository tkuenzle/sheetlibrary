import { describe, expect, it } from "vitest";

import { closeAfterExit, exitFinished, stopExit } from "./exit";

// The tests run without a DOM, so the dialog and its animations are stand-ins
// with only what exit.ts uses. Playing the exits is tested in the browser
// (e2e/overlay-moves.spec.ts).

function animation(iterations: number, finished: Promise<unknown>) {
  return {
    effect: { getComputedTiming: () => ({ iterations }) },
    finished,
  } as unknown as Animation;
}

function fakeDialog(animations: Animation[] = []) {
  const attributes = new Set<string>();
  const dialog = {
    open: true,
    inert: false,
    closed: 0,
    hasAttribute: (name: string) => attributes.has(name),
    setAttribute: (name: string) => attributes.add(name),
    removeAttribute: (name: string) => attributes.delete(name),
    getAnimations: () => animations,
    onClose: [] as (() => void)[],
    addEventListener(_type: "close", listener: () => void) {
      this.onClose.push(listener);
    },
    close() {
      if (!this.open) return;
      this.open = false;
      this.closed++;
      for (const listener of this.onClose.splice(0)) listener();
    },
  };
  return dialog;
}

// Lets every pending promise settle.
function settle() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function asDialog(dialog: ReturnType<typeof fakeDialog>) {
  return dialog as unknown as HTMLDialogElement;
}

describe("closeAfterExit", () => {
  it("closes at once when there are no animations", async () => {
    const dialog = fakeDialog();
    closeAfterExit(asDialog(dialog));
    expect(dialog.hasAttribute("data-closing")).toBe(true);
    expect(dialog.inert).toBe(true);
    await settle();
    expect(dialog.closed).toBe(1);
    expect(dialog.hasAttribute("data-closing")).toBe(false);
    expect(dialog.inert).toBe(false);
  });

  it("waits for the exit, and ignores a second close meanwhile", async () => {
    let end: (value?: unknown) => void = () => undefined;
    const exit = new Promise((resolve) => (end = resolve));
    const dialog = fakeDialog([animation(1, exit)]);
    closeAfterExit(asDialog(dialog));
    closeAfterExit(asDialog(dialog));
    await settle();
    expect(dialog.closed).toBe(0);
    end();
    await settle();
    expect(dialog.closed).toBe(1);
  });

  it("unmarks a dialog that something else closed during its exit", async () => {
    const dialog = fakeDialog([animation(1, new Promise(() => undefined))]);
    closeAfterExit(asDialog(dialog));
    dialog.close();
    expect(dialog.hasAttribute("data-closing")).toBe(false);
    expect(dialog.inert).toBe(false);
    dialog.open = true;
    await settle();
    expect(dialog.open).toBe(true);
  });

  it("keeps the dialog open when its exit is stopped", async () => {
    let end: (value?: unknown) => void = () => undefined;
    const exit = new Promise((resolve) => (end = resolve));
    const dialog = fakeDialog([animation(1, exit)]);
    closeAfterExit(asDialog(dialog));
    expect(stopExit(asDialog(dialog))).toBe(true);
    expect(dialog.hasAttribute("data-closing")).toBe(false);
    expect(dialog.inert).toBe(false);
    end();
    await settle();
    expect(dialog.open).toBe(true);
    expect(stopExit(asDialog(dialog))).toBe(false);
  });

  it("does nothing to a closed dialog", () => {
    const dialog = fakeDialog();
    dialog.open = false;
    closeAfterExit(asDialog(dialog));
    expect(dialog.hasAttribute("data-closing")).toBe(false);
  });
});

describe("exitFinished", () => {
  it("doesn't wait for an animation that repeats forever", async () => {
    const never = new Promise(() => undefined);
    const element = {
      getAnimations: () => [animation(Infinity, never)],
    } as unknown as Element;
    await expect(exitFinished(element)).resolves.toBeUndefined();
  });

  it("settles when an animation is cancelled", async () => {
    const element = {
      getAnimations: () => [animation(1, Promise.reject(new Error("abort")))],
    } as unknown as Element;
    await expect(exitFinished(element)).resolves.toBeUndefined();
  });
});
