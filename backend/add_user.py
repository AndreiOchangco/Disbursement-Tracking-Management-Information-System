"""Create a user directly in the SQLAlchemy database (development helper).

Usage (from backend/):
  python add_user.py --username admin --password secret --role "System Administrator"

This script imports the Flask app and SQLAlchemy models, so run it with the backend virtualenv active.
"""
import argparse
from app import app, db, User

parser = argparse.ArgumentParser()
parser.add_argument('--username', required=True)
parser.add_argument('--password', required=True)
parser.add_argument('--role', required=True)
args = parser.parse_args()

with app.app_context():
    if User.query.filter_by(username=args.username).first():
        print('User already exists')
    else:
        u = User(username=args.username, role=args.role)
        u.set_password(args.password)
        db.session.add(u)
        db.session.commit()
        print('User created:', args.username)
