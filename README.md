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
