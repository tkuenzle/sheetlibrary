import { APIError } from "better-auth/api";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { testEnv } from "../db/local-env.test-helper";
import { notInvited, tooManyEmails } from "./error-codes";
import { emailsPerAddress, sendSignInEmail } from "./sign-in-email.server";

const link = "https://sheetlibrary.com/api/auth/magic-link/verify?token=abc";

describe("sendSignInEmail", () => {
  let test: Awaited<ReturnType<typeof testEnv>>;
  beforeEach(async () => {
    test = await testEnv();
  });
  afterEach(() => test.dispose());

  it("sends the link to the address", async () => {
    await sendSignInEmail(test.env, "ana@example.com", link);
    const message = test.send.mock.lastCall?.[0] as EmailMessageBuilder;
    expect(message).toMatchObject({
      to: "ana@example.com",
      subject: "Sign in to Sheet Library",
    });
    expect(message.text).toContain(link);
  });

  it("reports an uninvited email", async () => {
    test.send.mockRejectedValue(
      new Error("destination address is not a verified address"),
    );
    const sending = sendSignInEmail(test.env, "eve@example.com", link);
    await expect(sending).rejects.toBeInstanceOf(APIError);
    await expect(sending).rejects.toMatchObject({
      statusCode: 403,
      body: {
        code: notInvited,
        message: "Sheet Library is invite-only for now.",
      },
    });
  });

  it("passes other failures on", async () => {
    const failure = new Error("email service unavailable");
    test.send.mockRejectedValue(failure);
    await expect(
      sendSignInEmail(test.env, "ana@example.com", link),
    ).rejects.toBe(failure);
  });

  it("limits the emails per address, in any case", async () => {
    for (let i = 0; i < emailsPerAddress.max; i++) {
      await sendSignInEmail(test.env, "ana@example.com", link);
    }
    await expect(
      sendSignInEmail(test.env, "ANA@example.com", link),
    ).rejects.toMatchObject({ statusCode: 429, body: { code: tooManyEmails } });
    expect(test.send).toHaveBeenCalledTimes(emailsPerAddress.max);
    await sendSignInEmail(test.env, "bo@example.com", link);
    expect(test.send).toHaveBeenCalledTimes(emailsPerAddress.max + 1);
  });
});
