#!/usr/bin/env python3
"""Preview the site on this computer.

    python3 tools/serve.py

Then open http://localhost:4321 in a browser. Press Control-C to stop.
Edit a file, refresh the page, and you'll see the change straight away.
"""

import functools
import http.server
import os
import socketserver
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 4321


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # never cache while previewing, so a refresh always shows the latest
        self.send_header("Cache-Control", "no-store")
        http.server.SimpleHTTPRequestHandler.end_headers(self)

    def translate_path(self, path):
        # The pages are linked without ".html" — /about rather than /about.html.
        # GitHub Pages fills in the extension by itself; this makes the preview
        # behave the same way, so what you see here is what goes live.
        local = http.server.SimpleHTTPRequestHandler.translate_path(self, path)
        if not os.path.exists(local) and os.path.isfile(local + ".html"):
            return local + ".html"
        return local

    def log_message(self, fmt, *args):
        pass


def main():
    handler = functools.partial(Handler, directory=ROOT)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", PORT), handler) as httpd:
        print("Previewing the site at  http://localhost:{}".format(PORT))
        print("Press Control-C to stop.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")


if __name__ == "__main__":
    main()
