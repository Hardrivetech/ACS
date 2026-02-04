# AI Productivity Tools — Automated Curated Site

This repo scaffolds a minimal, zero-cost automated static site that aggregates RSS/Atom feeds and can be hosted on GitHub Pages.

Quick start (locally):

1. Install Python deps and run the aggregator once:

```bash
python -m pip install --upgrade pip
pip install feedparser
python scripts/fetch_feeds.py
```

2. Preview the site:

```bash
python -m http.server 8000
# then open http://localhost:8000
```

3. To enable automation: push this repo to GitHub, enable GitHub Pages (branch: `main`, folder: `/`), and the included workflow will run daily to update `posts.json`.

Monetization placeholders are present in `index.html`. Replace with your affiliate links, donation URL, and lead magnet file.
Analytics: add your analytics ID manually. The site includes a placeholder spot in `index.html` where you can paste your analytics script. For privacy-first tracking consider Plausible or Fathom (paid) or self-hosted solutions.

Sitemap: the repository includes `scripts/generate_sitemap.py` to build `sitemap.xml` from `posts.json`. Configure `SITE_DOMAIN` in CI or edit `robots.txt` to point to your published sitemap URL.

Social sharing automation: a GitHub Action `share-to-mastodon.yml` posts the latest headline to a Mastodon account automatically. To enable it:

- Create the following repository secrets in GitHub: `MASTODON_INSTANCE` (e.g. mastodon.social) and `MASTODON_TOKEN` (access token).
- The workflow runs daily by default; you can trigger it manually under the Actions tab or edit the cron schedule.

Note: the workflow posts the top item from `posts.json`. Be careful of duplicate posts; you can tune the workflow to dedupe by keeping a small state file or checking history.

Hosting & monitoring notes
- Set the repository secret `SITE_DOMAIN` (Settings → Secrets → Actions) to your published site URL, for example `https://your-username.github.io/someidea`.
- The repo includes a site monitor workflow `.github/workflows/site-monitor.yml` that checks the site every 6 hours and will open an issue if the site doesn't return HTTP 200.
- For improved uptime and caching, consider fronting GitHub Pages with Cloudflare (free tier) and enabling Automatic Platform Optimization and the CDN.

Performance optimizations applied
- `style.css` and `script.js` are preloaded to improve first render. Consider further optimizations:
	- Serve optimized images (use WebP, sized images).
	- Minify CSS/JS in a build step (a GitHub Action can do this on push).
	- Use a small analytics provider (Plausible/Fathom) or Cloudflare analytics to keep privacy-friendly tracking.

Analytics setup
- The site includes a lightweight analytics loader that reads `analytics.json` at runtime and injects the appropriate script. An example is provided at `analytics.json.example`.
- To enable analytics, copy `analytics.json.example` to `analytics.json` and edit the values:

	- Plausible example:

		```json
		{
			"provider": "plausible",
			"domain": "yourdomain.com"
		}
		```

	- Google Analytics (GA4) example:

		```json
		{
			"provider": "ga4",
			"measurementId": "G-XXXXXXXXXX"
		}
		```

- Commit `analytics.json` if you are comfortable storing the domain/measurement ID in the repo; these are not secret values. If you prefer to keep IDs out of the repo, you can modify the loader to read from a generated file in CI or inject the snippet at publish time.

Consent & privacy
- The loader supports `requireConsent` in `analytics.json` (default: true). If `requireConsent` is true the site will show a consent banner on first visit; analytics only loads after the user clicks "Accept".
- Example `analytics.json` for GA4 with consent and IP anonymization:

```json
{
	"provider": "ga4",
	"measurementId": "G-XXXXXXXXXX",
	"requireConsent": true,
	"anonymize_ip": true
}
```

This implements a privacy-first flow; consider adding a `Privacy Policy` page (TODO in repo).

Server-side Measurement Protocol forwarding
- The repo includes `scripts/measurement_forwarder.py` which can forward server-side events to GA4 using the Measurement Protocol.
- To use it you need a GA4 `MEASUREMENT_ID` and an `API_SECRET` (create in Google Analytics > Admin > Data Streams > Measurement Protocol API secrets).
- Example usage:

```bash
export MEASUREMENT_ID=G-XXXXXXXXXX
export API_SECRET=YOUR_API_SECRET
python scripts/measurement_forwarder.py --client_id=server-1 --name=page_view --params '{"page_title":"Home"}'
```

- You can host this as a small server or call it from your backend for events you want tracked without exposing client-side IDs. Keep `API_SECRET` private (store as a secret in your hosting or CI).
 - Privacy & consent note: if you forward events server-side, ensure you respect user consent captured by the frontend (e.g., only forward when consent granted).

Cloudflare Worker: Measurement Protocol forwarder
- A Cloudflare Worker example is included at `workers/ga-forwarder-worker.js`. It accepts POST requests with JSON body `{ "client_id": "...", "name": "event_name", "params": {...} }` and forwards to GA4 Measurement Protocol.
- Deploy with Wrangler or via Cloudflare dashboard. Store `MEASUREMENT_ID` and `API_SECRET` as Worker environment variables (not in the repo).

Example `wrangler.toml` snippet:

```toml
name = "ga-forwarder"
type = "javascript"

[vars]
MEASUREMENT_ID = "G-XXXXXXXXXX"
API_SECRET = "YOUR_API_SECRET"
```

Example curl to forward an event to the Worker (replace `https://your-worker.example.workers.dev`):

```bash
curl -X POST https://your-worker.example.workers.dev -H "Content-Type: application/json" -d '{"client_id":"server-1","name":"page_view","params":{"page_title":"Home"}}'
```

Security: keep `API_SECRET` private and only call the Worker from trusted backends, or add an authentication layer to the Worker.

Auth & client relay options
- The Worker supports two protection modes (set via Worker env vars):
	- `FORWARDER_TOKEN`: a secret token. If set, requests must include header `x-forwarder-token: <token>`.
	- `ALLOWED_ORIGIN`: an allowed origin (e.g. `https://your-username.github.io`). If set and `FORWARDER_TOKEN` is not set, the Worker allows requests only when the `Origin` header equals `ALLOWED_ORIGIN`.

Note: `ALLOWED_ORIGIN` is a convenience for client-side relays but is less secure than a token. For high-security setups use `FORWARDER_TOKEN` and call the Worker from trusted backends.

Client-side relay example
- Add `workerUrl` to `analytics.json` (see `analytics.json.example`). When the user accepts analytics, the frontend will POST a `consent_granted` event to the Worker, which then forwards it to GA4.
- If you prefer the Worker to accept client-side calls without a token, set `ALLOWED_ORIGIN` to your Pages domain and leave `FORWARDER_TOKEN` unset.


