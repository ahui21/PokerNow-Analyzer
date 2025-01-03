from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
from urllib.parse import parse_qs
import cgi
import os
import sys
import traceback
from werkzeug.utils import secure_filename

# Add the src directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
src_path = os.path.join(current_dir, 'src')
sys.path.append(src_path)

from poker_analyzer import PokerAnalyzer

UPLOAD_FOLDER = os.path.join(current_dir, 'uploads')
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def do_POST(self):
        if self.path == '/analyze':
            try:
                # Parse the multipart form data
                content_type = self.headers.get('Content-Type')
                if not content_type or not content_type.startswith('multipart/form-data'):
                    self.send_error(400, "Expected multipart/form-data")
                    return

                form = cgi.FieldStorage(
                    fp=self.rfile,
                    headers=self.headers,
                    environ={'REQUEST_METHOD': 'POST',
                            'CONTENT_TYPE': self.headers['Content-Type']}
                )

                if 'file' not in form:
                    self.send_error(400, "No file uploaded")
                    return

                fileitem = form['file']
                if not fileitem.filename:
                    self.send_error(400, "No file selected")
                    return

                if not fileitem.filename.endswith('.csv'):
                    self.send_error(400, "Invalid file type")
                    return

                # Save the file
                filename = secure_filename(fileitem.filename)
                filepath = os.path.join(UPLOAD_FOLDER, filename)
                
                try:
                    with open(filepath, 'wb') as f:
                        f.write(fileitem.file.read())

                    # Process the file
                    analyzer = PokerAnalyzer()
                    analyzer.parse_log(filepath)
                    stats = analyzer.get_stats()

                    # Send response
                    self.send_response(200)
                    self.send_cors_headers()
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps(stats).encode())

                finally:
                    if os.path.exists(filepath):
                        os.remove(filepath)

            except Exception as e:
                self.send_error(500, str(e))
                traceback.print_exc()
        else:
            self.send_error(404, "Not Found")

    def send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', 'http://localhost:3000')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Max-Age', '86400')

def run(server_class=HTTPServer, handler_class=CORSRequestHandler, port=5001):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print(f'Starting server on port {port}...')
    httpd.serve_forever()

if __name__ == '__main__':
    run() 