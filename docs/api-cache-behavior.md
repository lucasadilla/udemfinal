# API cache policy

The API routes serving read-only data now advertise the following cache policy for GET requests:

- `Cache-Control: public, s-maxage=300, stale-while-revalidate=900`
  - `s-maxage=300` (5 minutes) is the primary TTL for CDN and reverse proxy caches.
  - `stale-while-revalidate=900` (15 minutes) allows proxies/clients to serve slightly older data while the background refresh completes.

## Endpoints

- `pages/api/articles` (GET list and GET by `id`)
- `pages/api/content` (GET)

Mutating methods (`POST`, `PUT`, `DELETE`) intentionally do **not** send cache headers so that writes bypass intermediate caches and avoid serving stale data.

## Front-end guidance

Client caches such as SWR or React Query can align with the server TTLs:

- Use a 5-minute `revalidateIfStale`/`staleTime` window to match `s-maxage=300`.
- Allow background refetches up to 15 minutes (`revalidateOnFocus` or `refetchInterval`) to mirror `stale-while-revalidate=900` without overfetching.

This keeps client-side data freshness expectations consistent with the server’s cache behavior.
