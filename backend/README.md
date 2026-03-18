Local Python backend for DTMIS (login)

Setup

1. Install dependencies:

   pip install -r requirements.txt

Run

Start the dev server:

   python app.py

This starts a Flask server on port 5000 with a JSON endpoint:

- POST /api/login  -> { name, role }  (returns user object)
- GET  /api/users  -> list of logged-in users

CORS is enabled so you can call this from the Vite frontend at `http://localhost:5173`.

Notes

- This is a simple development backend. Do not use it as-is in production.
- You can extend authentication (tokens, sessions) and persistent storage as needed.

Database & migrations

This project uses SQLAlchemy with Flask-Migrate for schema migrations. By default it uses SQLite (`DATABASE_URL=sqlite:///./dtmis.db`).

Quick setup with migrations:

1. Install dependencies (inside venv):

   pip install -r requirements.txt

2. Initialize migrations (only first time):

   flask db init
   flask db migrate -m "initial"
   flask db upgrade

Or, for a quick start without migrations, the app will create tables automatically on first run.

API endpoints

- POST /api/register -> { username, password, role }  (creates user)
- POST /api/login    -> { username, password }        (returns user on success)
- GET  /api/users    -> list registered users

Remember to set `DATABASE_URL` in a `.env` file for production (or use a managed DB). Use HTTPS and proper auth for production deployments.
