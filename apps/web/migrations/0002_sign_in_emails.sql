-- When each sign-in email was asked for, to limit them per address.
-- Rows older than the limit's window are deleted as new ones come in.

create table "signInEmail" ("email" text not null, "sentAt" integer not null);

create index "signInEmail_email_sentAt_idx" on "signInEmail" ("email", "sentAt");
