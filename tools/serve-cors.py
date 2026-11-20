"""Puente local de solo lectura para armar páginas desde la consola o la extensión de Chrome.

Sirve esta carpeta (o la que le pases) en http://127.0.0.1:8766 con CORS limitado a TU tenant, para que una
pestaña de SharePoint pueda hacer fetch() de sp-builder.js, listas.json o imágenes sin pasarlas por el chat.

Uso:
    python tools/serve-cors.py https://TU-TENANT.sharepoint.com [carpeta]

Solo escucha en 127.0.0.1 y solo permite GET. Ciérralo cuando termines."""
import http.server, os, socketserver, sys

if len(sys.argv) < 2:
    sys.exit("Falta el origen: python tools/serve-cors.py https://TU-TENANT.sharepoint.com [carpeta]")
ORIGIN = sys.argv[1].rstrip("/")
ROOT = os.path.abspath(sys.argv[2]) if len(sys.argv) > 2 else os.path.dirname(os.path.abspath(__file__))
PORT = 8766

class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", ORIGIN)
        self.send_header("Access-Control-Allow-Private-Network", "true")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

os.chdir(ROOT)
socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("127.0.0.1", PORT), H) as s:
    print(f"sirviendo {ROOT} en http://127.0.0.1:{PORT}  (CORS: {ORIGIN})")
    s.serve_forever()
