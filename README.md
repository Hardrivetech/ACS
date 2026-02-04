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

