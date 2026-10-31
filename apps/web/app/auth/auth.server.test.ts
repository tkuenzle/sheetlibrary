import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { testEnv } from "../db/local-env.test-helper";
import { getAuth } from "./auth.server";
import { tooManyEmails } from "./sign-in-email.server";

const origin = "https://sheetlibrary.com";

function askForLink(email: string, ip: string) {
  return new Request(`${origin}/api/auth/sign-in/magic-link`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin,
      "cf-connecting-ip": ip,
    },
    body: JSON.stringify({ email, callbackURL: "/account" }),
  });
}

async function send(env: Env, request: Request) {
  return getAuth(env, request).handler(request);
}

describe("sign-in emails", () => {
  let test: Awaited<ReturnType<typeof testEnv>>;
  beforeEach(async () => {
    test = await testEnv();
  });
  afterEach(() => test.dispose());

  it("sends a link", async () => {
    const response = await send(
      test.env,
      askForLink("ana@example.com", "1.1.1.1"),
    );
    expect(response.status).toBe(200);
    expect(test.send).toHaveBeenCalledOnce();
  });

  // Scenario "Too many requests", for one address.
  it("stops sending to an address after too many requests", async () => {
    const statuses = [];
    for (let i = 0; i < 4; i++) {
      const response = await send(
        test.env,
        askForLink("ana@example.com", `1.1.1.${String(i)}`),
      );
      statuses.push(response.status);
      if (response.status === 429) {
        expect(await response.json()).toMatchObject({ code: tooManyEmails });
      }
    }
    expect(statuses).toEqual([200, 200, 200, 429]);
    expect(test.send).toHaveBeenCalledTimes(3);
  });

  // Scenario "Too many requests", for one visitor.
  it("stops sending for a visitor after too many requests", async () => {
    const statuses = [];
    for (let i = 0; i < 11; i++) {
      const response = await send(
        test.env,
        askForLink(`person${String(i)}@example.com`, "2.2.2.2"),
      );
      statuses.push(response.status);
    }
    expect(statuses.slice(0, 10)).toEqual(Array(10).fill(200));
    expect(statuses[10]).toBe(429);
    expect(test.send).toHaveBeenCalledTimes(10);
  });
});
