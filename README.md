# Free GeoGuessr

A one-round geography game built with React 19, Vite, Cladd, Google Maps JavaScript API, and Cloudflare Workers Static Assets.

The game drops the player into a random outdoor Street View panorama. The player explores, places a guess on the world map, and gets a score based on distance and time. Round history stays in the browser and can be imported or exported as JSON.

## Local setup

Requirements: Node.js 22.12 or newer and npm 11 or newer.

```bash
npm install
```

Create `.env.local` from `.env.example` and add a Google Maps browser key:

```dotenv
VITE_GOOGLE_MAPS_API_KEY=your_browser_key
```

Then start the app:

```bash
npm run dev
```

Open `http://localhost:5173`.

## Get a Google Maps API key

For development and prototypes, Google offers a [Maps Demo Key](https://developers.google.com/maps/documentation/javascript/demo-key) that does not require billing information. It has limited features and daily usage and must not be used for production.

For production:

1. Follow [Google Maps Platform: Get Started](https://developers.google.com/maps/get-started) to create or select a Google Cloud project and attach billing.
2. Enable **Maps JavaScript API** in that project.
3. Open **Google Maps Platform > Credentials**, select **Create credentials > API key**, and use that key in `.env.local`.
4. Set **Application restrictions** to **Websites (HTTP referrers)**. Add `http://localhost:5173/*` for local development and `https://free-geoguessr.gorlock.workers.dev/*` for the deployed app.
5. Set **API restrictions** to **Maps JavaScript API** only. Add another API only when the browser actually uses it.
6. Set conservative quotas and billing alerts. See [Google's cost controls](https://developers.google.com/maps/billing-and-pricing/manage-costs) and [current pricing/free usage caps](https://developers.google.com/maps/billing-and-pricing/pricing).

Production Google Maps is pay-as-you-go and requires billing, even when usage remains within a free monthly cap. A first eligible Google Cloud billing account may also qualify for the Google Cloud trial.

### Why the browser key is not a Cloudflare secret

`VITE_*` values are compiled into browser JavaScript. The Maps JavaScript API key also appears in the request that loads Google Maps, so it is inherently inspectable. Moving that value behind a Worker endpoint would still reveal it to every browser and would not make it secret.

The correct protection is a dedicated browser key with HTTP-referrer restrictions, API restrictions, and quotas. Follow [Google Maps API security best practices](https://developers.google.com/maps/api-security-best-practices). For more abuse protection, consider [Firebase App Check for Maps JavaScript API](https://developers.google.com/maps/documentation/javascript/maps-app-check).

## Deploy to Cloudflare Workers

The checked-in `wrangler.jsonc` deploys `dist` as a single-page application. No Worker script or database is needed for the current browser-only architecture.

```bash
npx wrangler login
npm run deploy:dry
npm run deploy
```

`npm run deploy` builds with Vite and deploys the generated static assets to [free-geoguessr.gorlock.workers.dev](https://free-geoguessr.gorlock.workers.dev).

For a custom domain, attach the domain to the Worker in **Cloudflare Dashboard > Workers & Pages > free-geoguessr > Settings > Domains & Routes**, then add that domain to the Google key restrictions.

Cloudflare SPA routing is configured with `assets.not_found_handling: "single-page-application"`, so direct visits to `/game` and `/stats` return the React app instead of a 404. See [Cloudflare's SPA deployment documentation](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/).

## Data storage

Completed rounds and preferences use versioned browser `localStorage`. Import validates every round before replacing the current field log, and deletion removes only this app's history key. No gameplay data leaves the browser.

## Commands

```bash
npm run dev         # Vite development server
npm run lint        # ESLint 10
npm run test        # Vitest
npm run build       # Production bundle in dist
npm run check       # Lint, test, and build
npm run cf:dev      # Build and serve through Wrangler
npm run deploy:dry  # Validate the Cloudflare upload
npm run deploy      # Build and deploy
```
