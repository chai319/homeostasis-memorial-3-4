#!/usr/bin/env python3
"""Serve this game's directory on loopback; enough backlog for parallel media requests."""
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
import argparse
parser=argparse.ArgumentParser();parser.add_argument('port',type=int,nargs='?',default=8766);args=parser.parse_args()
class Handler(SimpleHTTPRequestHandler):
 protocol_version='HTTP/1.1'
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(Path(__file__).resolve().parents[1]),**kw)
 def handle(self):
  try:super().handle()
  except (BrokenPipeError,ConnectionResetError):pass # Browser cancelled an obsolete media request.
class Server(ThreadingHTTPServer):
 request_queue_size=128
 daemon_threads=True
with Server(('127.0.0.1',args.port),Handler) as server:
 print('Serving 3-4 at http://127.0.0.1:'+str(args.port),flush=True)
 try:server.serve_forever()
 except KeyboardInterrupt:pass
