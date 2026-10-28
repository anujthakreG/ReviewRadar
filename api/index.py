import os
import sys

# Ensure backend root is on sys.path for Vercel serverless environment
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(current_dir, "..", "backend"))
if not os.path.exists(backend_dir):
    backend_dir = os.path.abspath(os.path.join(current_dir, "backend"))

sys.path.insert(0, backend_dir)

from app.main import app
