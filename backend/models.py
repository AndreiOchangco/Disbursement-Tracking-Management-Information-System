from django.db import models
from werkzeug.security import generate_password_hash, check_password_hash

class User(models.Model):
    username = models.CharField(max_length=150, unique=True)
    password_hash = models.CharField(max_length=255)
    role = models.CharField(max_length=80)
    created_at = models.DateTimeField(auto_now_add=True)

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

class Disbursement(models.Model):
    trackingno = models.CharField(max_length=100, unique=True)
    dvno = models.IntegerField(null=True, blank=True)
    project = models.CharField(max_length=255, null=True, blank=True)
    status = models.CharField(max_length=50)
    date = models.DateTimeField()
    officer = models.CharField(max_length=150)

    def to_dict(self):
        return {
            'id': self.id,
            'trackingno': self.trackingno,
            'dvno': self.dvno,
            'project': self.project,
            'status': self.status,
            'date': self.date.isoformat() if self.date else None,
            'officer': self.officer,
        }