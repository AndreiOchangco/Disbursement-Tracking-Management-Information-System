from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
import os
import json

USERS_JSON = os.path.join(os.path.dirname(__file__), 'users.json')

load_dotenv()

ALLOWED_ROLES = [
    'System Administrator',
    'Accountant',
    'Budget Officer',
    'Treasurer',
    'Technical Officer',
    'Secretary',
]

app = Flask(__name__)
CORS(app)

# Database config
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///./dtmis.db')
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
migrate = Migrate(app, db)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(80), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Disbursement(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    trackingno = db.Column(db.String(100), nullable=True)
    dvno = db.Column(db.Integer, nullable=True)
    project = db.Column(db.String(255), nullable=True)
    status = db.Column(db.String(50), nullable=False, default='Pending')
    date = db.Column(db.String(50), nullable=True)
    officer = db.Column(db.String(150), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'trackingno': self.trackingno,
            'dvno': self.dvno,
            'project': self.project,
            'status': self.status,
            'date': self.date,
            'officer': self.officer,
        }


@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json(force=True, silent=True) or {}
    username = (data.get('username') or '').strip()
    password = data.get('password') or ''
    role = data.get('role') or ''

    if not username or not password:
        return jsonify({'success': False, 'error': 'Username and password are required'}), 400
    if role not in ALLOWED_ROLES:
        return jsonify({'success': False, 'error': 'Invalid role'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'success': False, 'error': 'User already exists'}), 400

    u = User(username=username, role=role)
    u.set_password(password)
    db.session.add(u)
    db.session.commit()

    return jsonify({'success': True, 'user': u.to_dict()}), 201


@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json(force=True, silent=True) or {}
    username = (data.get('username') or '').strip()
    password = data.get('password') or ''

    if not username or not password:
        return jsonify({'success': False, 'error': 'Username and password are required'}), 400

    u = User.query.filter_by(username=username).first()
    if not u or not u.check_password(password):
        return jsonify({'success': False, 'error': 'Invalid credentials'}), 401

    return jsonify({'success': True, 'user': u.to_dict()}), 200


@app.route('/api/users', methods=['GET'])
def list_users():
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify({'success': True, 'users': [u.to_dict() for u in users]})


if __name__ == '__main__':
    # On first run create DB tables if they don't exist (development convenience)
    with app.app_context():
        db.create_all()
        # Migrate any legacy users stored in users.json into the database
        try:
            if os.path.exists(USERS_JSON):
                with open(USERS_JSON, 'r', encoding='utf-8') as f:
                    raw = json.load(f)
                if isinstance(raw, list):
                    migrated = 0
                    for entry in raw:
                        # accept either username or name fields
                        username = (entry.get('username') or entry.get('name')) if isinstance(entry, dict) else None
                        role = (entry.get('role') if isinstance(entry, dict) else None) or 'Accountant'
                        password = (entry.get('password') if isinstance(entry, dict) else None) or 'changeme'
                        if not username:
                            continue
                        if not User.query.filter_by(username=username).first():
                            u = User(username=username, role=role)
                            u.set_password(password)
                            db.session.add(u)
                            migrated += 1
                    if migrated:
                        db.session.commit()
                        print(f'Migrated {migrated} users from users.json into the database (default password: changeme)')
        except Exception as e:
            print('Error migrating users.json:', e)
    app.run(host='0.0.0.0', port=5000, debug=True)
