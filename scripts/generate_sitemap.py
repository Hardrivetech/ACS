#!/usr/bin/env python3
"""Generate a simple sitemap.xml from posts.json and index.html.
Run this in CI after posts.json is updated.
"""
import json
from datetime import datetime

def load_posts(path='posts.json'):
    try:
        with open(path,'r',encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return []

def write_sitemap(posts, domain, out='sitemap.xml'):
    now = datetime.utcnow().date().isoformat()
    urls = [f"  <url>\n    <loc>{domain}/</loc>\n    <lastmod>{now}</lastmod>\n  </url>"]
    for p in posts:
        link = p.get('link')
        if not link: continue
        last = p.get('published') or now
        urls.append(f"  <url>\n    <loc>{link}</loc>\n    <lastmod>{last}</lastmod>\n  </url>")
    body = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + '\n'.join(urls) + '\n</urlset>\n'
    with open(out,'w',encoding='utf-8') as f:
        f.write(body)
    print('Wrote', out)

def main():
    import os
    domain = os.environ.get('SITE_DOMAIN','https://your-username.github.io/your-repo')
    posts = load_posts()
    write_sitemap(posts, domain)

if __name__ == '__main__':
    main()
