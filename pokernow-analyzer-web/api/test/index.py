from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                "message": "Test endpoint working!",
                "path": self.path
            }
            
            self.wfile.write(json.dumps(response).encode('utf-8'))
        except Exception as e:
            print(f"Error in test handler: {str(e)}")
            self.send_error(500, f"Internal error: {str(e)}")
        return 