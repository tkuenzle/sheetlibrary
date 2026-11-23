import type { Config } from "@react-router/dev/config";

export default {
  ssr: true,
  // The whole route list comes with the first page, so no page change waits
  // for a `/__manifest` round trip to find its route. See
  // openspec/specs/site-layout ("Pages known from the start").
  routeDiscovery: { mode: "initial" },
} satisfies Config;
