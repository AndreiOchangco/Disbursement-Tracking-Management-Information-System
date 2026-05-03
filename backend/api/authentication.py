import jwt
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .models import User

class JWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        token = request.COOKIES.get('access_token')
        
        if not token:
            return None
            
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            
            if payload.get('type') != 'access':
                raise AuthenticationFailed('Invalid token type.')
                
            user = User.objects.get(id=payload['user_id'])
            if user.status != 'active':
                raise AuthenticationFailed('Account is deactivated.')
                
            return (user, token)
            
        except jwt.ExpiredSignatureError:
            # Let the frontend catch the 401 and hit the refresh endpoint
            raise AuthenticationFailed('Access token expired.')
        except (jwt.InvalidTokenError, User.DoesNotExist):
            raise AuthenticationFailed('Invalid token.')
        
    def authenticate_header(self, request):
        return 'Cookie'