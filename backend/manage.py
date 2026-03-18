"""Simple manage wrapper to expose Flask CLI via python manage.py

Usage examples:
  python manage.py run
  python manage.py db init
  python manage.py db migrate -m "initial"
  python manage.py db upgrade

This forwards arguments to Flask's CLI so you can run flask-migrate commands
without setting environment variables manually.
"""
import os
import sys

if __name__ == '__main__':
    # Ensure Flask app is discoverable when running from backend/ or repo root
    os.environ.setdefault('FLASK_APP', 'app.py')
    # Allow 'python manage.py run' as shorthand for 'flask run'
    if len(sys.argv) > 1 and sys.argv[1] == 'run':
        sys.argv[1] = 'run'
    # Delegate to flask CLI
    from flask.cli import main

    sys.exit(main())
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dtmis.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
