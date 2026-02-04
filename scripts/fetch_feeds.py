#!/usr/bin/env python3
"""Fetch RSS/Atom feeds listed in feeds.txt and write posts.json.
Intended to run in GitHub Actions daily and commit updates.
"""
import json
import feedparser
from datetime import datetime

def load_feeds(path='feeds.txt'):
    feeds=[]
    try:
        with open(path,'r',encoding='utf-8') as f:
            for line in f:
                line=line.strip()
                if not line or line.startswith('#'):
                    continue
                feeds.append(line)
    except FileNotFoundError:
        print('feeds.txt not found')
    return feeds

def parse_feeds(feeds):
    posts=[]
    for url in feeds:
        print('Fetching', url)
        d = feedparser.parse(url)
        source = d.feed.get('title') if d.feed else url
        for e in d.entries:
            title = e.get('title','')
            link = e.get('link','')
            summary = e.get('summary', e.get('description',''))
            published = None
            if e.get('published_parsed'):
                published = datetime(*e.published_parsed[:6]).isoformat()
            elif e.get('updated_parsed'):
                published = datetime(*e.updated_parsed[:6]).isoformat()
            posts.append({'title': title, 'link': link, 'summary': summary, 'published': published, 'source': source})
    return posts

def dedupe_and_sort(posts, limit=100):
    seen=set(); out=[]
    for p in posts:
        if not p.get('link'):
            continue
        if p['link'] in seen:
            continue
        seen.add(p['link'])
        out.append(p)
    out.sort(key=lambda x: x.get('published') or '', reverse=True)
    return out[:limit]

def main():
    feeds = load_feeds()
    if not feeds:
        print('No feeds configured in feeds.txt')
        return
    posts = parse_feeds(feeds)
    posts = dedupe_and_sort(posts)
    with open('posts.json','w',encoding='utf-8') as f:
        json.dump(posts, f, ensure_ascii=False, indent=2)
    print(f'Wrote {len(posts)} posts to posts.json')

if __name__ == '__main__':
    main()
