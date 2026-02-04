#!/usr/bin/env python3
"""Simple Measurement Protocol forwarder for GA4.

Usage (example):
  export MEASUREMENT_ID=G-XXXXXXXXXX
  export API_SECRET=your_api_secret
  python scripts/measurement_forwarder.py --client_id=12345 --name=page_view --params='{"page_title":"Home"}'

This script posts events to Google Analytics Measurement Protocol.
You can host it as a small server or run it in CI to forward important server-side events.
"""
import os
import json
import argparse
import requests

MEASUREMENT_ID = os.getenv('MEASUREMENT_ID')
API_SECRET = os.getenv('API_SECRET')

def send_event(client_id, name, params=None):
    if not MEASUREMENT_ID or not API_SECRET:
        raise SystemExit('MEASUREMENT_ID and API_SECRET must be set in env')
    url = f'https://www.google-analytics.com/mp/collect?measurement_id={MEASUREMENT_ID}&api_secret={API_SECRET}'
    payload = {
        'client_id': client_id,
        'events': [
            {'name': name, 'params': params or {}}
        ]
    }
    resp = requests.post(url, json=payload, timeout=10)
    resp.raise_for_status()
    return resp.json() if resp.text else {'status':'ok'}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--client_id', required=True)
    parser.add_argument('--name', required=True)
    parser.add_argument('--params', default='{}', help='JSON string of event params')
    args = parser.parse_args()
    params = json.loads(args.params)
    r = send_event(args.client_id, args.name, params)
    print('Sent', r)

if __name__ == '__main__':
    main()
