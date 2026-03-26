import jwt
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .models import User

class JWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return None
            
        token = auth_header.split(' ')[1]
        
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            
            if payload.get('type') != 'access':
                raise AuthenticationFailed('Invalid token type.')
                
            user = User.objects.get(id=payload['user_id'])
            if user.status != 'active':
                raise AuthenticationFailed('Account is deactivated.')
                
            return (user, token)
            
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token is expired.')
        except (jwt.InvalidTokenError, User.DoesNotExist):
            raise AuthenticationFailed('Token is invalid.')