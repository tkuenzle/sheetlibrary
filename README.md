# Sheet Library

A library for personal sheet music, starting with chord sheets.

Sheet Library is a web app for keeping your sheets in one place:

- **Library**: store and browse your chord sheets.
- **Editing**: write and edit sheets right in the app.
- **Collections and sets**: group sheets into collections, and put together ordered sets, e.g. for a gig or rehearsal.

Status: early development. See the [roadmap](docs/roadmap.md) for where it's heading.

## Development

You need Node 24, [pnpm](https://pnpm.io) and [just](https://just.systems).

```sh
just install                                        # install dependencies
pnpm --filter web exec playwright install chromium  # once, for end-to-end tests
just dev                                            # run the app at http://localhost:5173
just check                                          # run all checks, same as CI
just fix                                            # fix formatting and lint
just spec-check                                     # validate the OpenSpec specs and changes
```

Run `just` to see all recipes.
