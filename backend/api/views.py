import jwt
import datetime
from django.conf import settings
from django.middleware.csrf import CsrfViewMiddleware, get_token
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied
from .models import User, DV, DVArchived, DVWorkflow, DVPayment, DVParticulars, DVJE
from .serializers import UserSerializer, UserCreateUpdateSerializer,DVSerializer, DVCreateUpdateSerializer, DVWorkflowSerializer, DVArchivedSerializer
from .authentication import JWTAuthentication
from django.contrib.auth import authenticate as django_authenticate
from django.contrib.auth.models import User as DjangoUser
from django.contrib.auth import login as django_login
from django.http import HttpResponse
import os
from pathlib import Path

DEPT_STEP = {
    'accounting': 1,
    'budget': 2,
    'treasurer': 3,
    'bac_gso': 4,
    'mayors_office': 5,
}

STEP_DEPT_LABEL = {
    1: 'Accounting',
    2: 'Budget',
    3: 'Treasurer',
    4: 'BAC/GSO',
    5: "Mayor's Office",
}

# --- Custom CSRF Permission ---
class EnforceCSRF(BasePermission):
    """
    DRF disables CSRF for non-session auth. This custom permission 
    forces Django's standard CSRF check on specific endpoints.
    """
    def has_permission(self, request, view):
        # Use Django's built-in CSRF middleware manually
        check = CsrfViewMiddleware(lambda req: None)
        check.process_request(request._request)
        reason = check.process_view(request._request, None, (), {})
        
        if reason:
            raise PermissionDenied(f'CSRF Failed: {reason}')
        return True


# --- CSRF Token Endpoint ---
@api_view(['GET'])
@permission_classes([AllowAny])
def get_csrf_token(request):
    """Sets the CSRF cookie on the frontend."""
    return Response({'csrfToken': get_token(request)})

# ─────────────────── AUTH ───────────────────

def get_tokens_for_user(user):
    access_payload = {
        'user_id': user.id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=settings.JWT_EXPIRATION_HOURS),
        'iat': datetime.datetime.utcnow(),
        'type': 'access'
    }
    refresh_payload = {
        'user_id': user.id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7),
        'iat': datetime.datetime.utcnow(),
        'type': 'refresh'
    }
    
    access_token = jwt.encode(access_payload, settings.SECRET_KEY, algorithm='HS256')
    refresh_token = jwt.encode(refresh_payload, settings.SECRET_KEY, algorithm='HS256')
    
    return access_token, refresh_token

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    email = request.data.get('email', '').strip().lower()
    password = request.data.get('password', '')

    # First try to authenticate against the app's User model
    try:
        user = User.objects.get(email__iexact=email)
        # verify password stored in app user
        if not user.check_password(password):
            return Response({'error': 'Password is incorrect.'}, status=status.HTTP_401_UNAUTHORIZED)

        if user.status != 'active':
            return Response({'error': 'Account deactivated.'}, status=status.HTTP_401_UNAUTHORIZED)

    except User.DoesNotExist:
        # Fallback: attempt to authenticate using Django's built-in auth (useful for superuser)
        django_user = django_authenticate(request, username=email, password=password)
        if django_user is None:
            return Response({'error': 'Email is not yet registered.'}, status=status.HTTP_401_UNAUTHORIZED)

        # Only allow mapping for Django superusers
        if not getattr(django_user, 'is_superuser', False):
            return Response({'error': 'Email is not yet registered.'}, status=status.HTTP_401_UNAUTHORIZED)

        # Create or get corresponding app User record and map fields
        app_user, created = User.objects.get_or_create(
            email=django_user.email.lower(),
            defaults={
                'full_name': django_user.get_full_name() or django_user.username,
                'pass_hashed': django_user.password,
                'department': 'admin',
                'status': 'active'
            }
        )
        user = app_user

    access_token, refresh_token = get_tokens_for_user(user)

    response = Response({
        'access_token': access_token,
        'user': UserSerializer(user).data,
    })

    # Set the refresh token in an HttpOnly cookie
    response.set_cookie(
        key='refresh_token',
        value=refresh_token,
        httponly=True,
        secure=settings.DEBUG is False, # Use True in production (HTTPS)
        samesite='Lax', # Adjust to 'None' if frontend/backend are on different domains
        max_age=7 * 24 * 60 * 60 # 7 days in seconds
    )
    
    return response


@api_view(['POST'])
@permission_classes([AllowAny, EnforceCSRF])
def refresh_token(request):
    """Generate a new access token using the HttpOnly refresh token cookie."""
    refresh_token = request.COOKIES.get('refresh_token')
    
    if not refresh_token:
        return Response({'error': 'Refresh token missing.'}, status=status.HTTP_401_UNAUTHORIZED)
        
    try:
        payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=['HS256'])
        if payload.get('type') != 'refresh':
            raise jwt.InvalidTokenError
            
        user = User.objects.get(id=payload['user_id'])
        if user.status != 'active':
            return Response({'error': 'Account deactivated.'}, status=status.HTTP_401_UNAUTHORIZED)
            
        access_payload = {
            'user_id': user.id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=4320),
            'iat': datetime.datetime.utcnow(),
            'type': 'access'
        }
        new_access_token = jwt.encode(access_payload, settings.SECRET_KEY, algorithm='HS256')
        
        return Response({'access_token': new_access_token})
        
    except jwt.ExpiredSignatureError:
        return Response({'error': 'Refresh token expired. Please log in again.'}, status=status.HTTP_401_UNAUTHORIZED)
    except (jwt.InvalidTokenError, User.DoesNotExist):
        return Response({'error': 'Invalid refresh token.'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([AllowAny, EnforceCSRF])
def logout(request):
    """Clear the refresh token cookie."""
    response = Response({'message': 'You have been logged out successfully.'})
    response.delete_cookie('refresh_token')
    return response


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def sso_login(request):
    """Create a Django session for the authenticated user so they can access Django admin.

    Frontend should POST to this endpoint with the current Bearer access token
    and use `fetch` with `credentials: 'include'` so the session cookie is accepted.
    """
    user = request.user
    # Only allow system administrators to SSO into Django admin
    if getattr(user, 'department', '') != 'admin':
        return Response({'error': 'Only system administrators can access Django admin.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        # Find corresponding Django auth user (required for admin session)
        try:
            dj_user = DjangoUser.objects.get(email__iexact=user.email)
        except DjangoUser.DoesNotExist:
            return Response({'error': 'No Django admin account found for this user.'}, status=status.HTTP_404_NOT_FOUND)

        if not dj_user.is_active:
            return Response({'error': 'Django admin account is inactive.'}, status=status.HTTP_403_FORBIDDEN)

        # Establish Django session using the Django auth user
        dj_request = request._request
        django_login(dj_request, dj_user)
        dj_request.session.save()

        session_key = dj_request.session.session_key
        response = Response({'next': '/admin/'})

        response.set_cookie(
            key=settings.SESSION_COOKIE_NAME,
            value=session_key,
            httponly=True,
            secure=not settings.DEBUG,
            samesite=getattr(settings, 'CSRF_COOKIE_SAMESITE', 'Lax') or 'Lax'
        )

        return response
    except Exception as e:
        # Return JSON error instead of 500 to help debugging from frontend
        return Response({'error': 'SSO failed', 'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─────────────────── USER LISTS REGISTRATION, UPDATE ───────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Register a new user."""
    data = request.data.copy()
    if 'email' in data:
        data['email'] = data['email'].lower()

    if User.objects.filter(email=data.get('email')).exists():
        return Response({'error': 'A user with this email is already registered.'}, status=status.HTTP_400_BAD_REQUEST)

    serializer = UserCreateUpdateSerializer(data=data)
    if serializer.is_valid():
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def user_list(request):
    """List all users."""
    if request.user.department != 'admin':
        return Response(
            {'error': 'You do not have permission to view the user list.'},
            status=status.HTTP_403_FORBIDDEN
        )
        
    users = User.objects.all().order_by('full_name')
    return Response(UserSerializer(users, many=True).data)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def user_detail(request, pk):
    """Retrieve, update, or delete a user (e.g., changing status to inactive)."""
    
    if request.user.department != 'admin':
        return Response(
            {'error': 'Only System Administrators have permission to view or edit user details.'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        user_obj = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(UserSerializer(user_obj).data)

    elif request.method in ['PUT', 'PATCH']:
        if user_obj.id == request.user.id and request.data.get('status') == 'inactive':
            return Response(
                {'error': 'You cannot deactivate your own admin account.'}, 
                status=status.HTTP_400_BAD_REQUEST
        )
        serializer = UserCreateUpdateSerializer(user_obj, data=request.data, partial=True)
        if serializer.is_valid():
            updated_user = serializer.save()
            return Response(UserSerializer(updated_user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        if user_obj.id == request.user.id:
            return Response(
                {'error': 'You cannot archive your own admin account.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        user_obj.status = 'archived'
        user_obj.save()
        return Response({'message': 'User archived successfully.'}, status=status.HTTP_200_OK)

# ─────────────────── DV LIST / CREATE ───────────────────

@api_view(['GET', 'POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def dv_list(request):
    if request.user.department == 'admin':
        return Response(
            {'error': 'System Administrators do not have access to Disbursement Vouchers.'},
            status=status.HTTP_403_FORBIDDEN
        )

    if request.method == 'GET':
        search = request.query_params.get('search', '').strip()
        status_filter = request.query_params.get('status', '').strip()
        show_archived = request.query_params.get('archived', 'false').lower() == 'true'

        dvs = DV.objects.all()

        if not show_archived:
            if status_filter:
                dvs = dvs.filter(status=status_filter)
            else:
                # Default: exclude archived unless explicitly requested
                if request.user.department != 'accounting':
                    dvs = dvs.exclude(status='archived')

        if search:
            dvs = dvs.filter(
                Q(dv_no__icontains=search) |
                Q(tracking_no__icontains=search) |
                Q(payee__icontains=search) |
                Q(office__icontains=search)
            )

        dvs = dvs.order_by('-created_at')
        return Response(DVSerializer(dvs, many=True).data)

    elif request.method == 'POST':
        if request.user.department != 'accounting':
            return Response(
                {'error': 'Only Accounting can create Disbursement Vouchers.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = DVCreateUpdateSerializer(data=request.data)
        if serializer.is_valid():
            dv = serializer.save(
                accounting=request.user,
                status='pending',
                current_step=1
            )
            # Log creation in workflow
            DVWorkflow.objects.create(
                dv=dv, step=1, status='submitted',
                action_by=request.user, remarks='DV created as draft.'
            )
            return Response(DVSerializer(dv).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────── DV DETAIL / UPDATE ───────────────────

@api_view(['GET', 'PUT'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def dv_detail(request, pk):
    if request.user.department == 'admin':
        return Response(
            {'error': 'System Administrators do not have access to Disbursement Vouchers.'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        dv = DV.objects.get(pk=pk)
    except DV.DoesNotExist:
        return Response({'error': 'Disbursement Voucher is not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(DVSerializer(dv).data)

    elif request.method == 'PUT':
        if request.user.department != 'accounting':
            return Response(
                {'error': 'Only Accounting personnel can edit Disbursement Vouchers.'},
                status=status.HTTP_403_FORBIDDEN
            )
        if dv.status not in ['draft', 'disapproved']:
            return Response(
                {'error': f'Cannot edit a DV with status "{dv.status}".'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = DVCreateUpdateSerializer(dv, data=request.data, partial=True)
        if serializer.is_valid():
            dv = serializer.save()
            return Response(DVSerializer(dv).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────── WORKFLOW ACTIONS ───────────────────

@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def dv_submit(request, pk):
    """Submit a draft DV to start the approval workflow."""
    try:
        dv = DV.objects.get(pk=pk)
    except DV.DoesNotExist:
        return Response({'error': 'Disbursement Voucher cannot found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.user.department != 'accounting':
        return Response({'error': 'Only Accounting personnel can submit DVs.'}, status=status.HTTP_403_FORBIDDEN)

    if dv.status != 'draft':
        return Response(
            {'error': f'Only draft Disbursement Vouchers can be submitted. Current status: {dv.status}'},
            status=status.HTTP_400_BAD_REQUEST
        )

    dv.status = 'pending'
    dv.current_step = 2  # Forward to Budget
    dv.save()

    DVWorkflow.objects.create(
        dv=dv, step=1, status='submitted',
        action_by=request.user,
        remarks='Disbursement voucher is submitted for processing.'
    )

    return Response(DVSerializer(dv).data)


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def dv_approve(request, pk):
    """Approve a DV at current step."""
    try:
        dv = DV.objects.get(pk=pk)
    except DV.DoesNotExist:
        return Response({'error': 'Disbursement Voucher cannot be found.'}, status=status.HTTP_404_NOT_FOUND)

    # Allow accounting personnel to approve at step 1; determine user's workflow step
    user_step = DEPT_STEP.get(request.user.department)

    # Allow Accounting to approve a DV in 'draft' at step 1, or allow approval when status is 'pending'
    allowed_status = ['pending']
    if user_step == 1:
        allowed_status.append('draft')

    if dv.status not in allowed_status or dv.current_step != user_step:
        return Response(
            {'error': 'You cannot approve this Disbursement Voucher at this stage.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    DVWorkflow.objects.create(
        dv=dv, step=user_step, status='approved',
        action_by=request.user,
        remarks=request.data.get('remarks', '')
    )

    if user_step == 5:  # Mayor's Office - final step
        dv.status = 'completed'
        dv.current_step = 6
    else:
        dv.current_step = user_step + 1

    dv.save()
    return Response(DVSerializer(dv).data)


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def dv_disapprove(request, pk):
    """Disapprove a DV and send back to Accounting with remarks."""
    try:
        dv = DV.objects.get(pk=pk)
    except DV.DoesNotExist:
        return Response({'error': 'Disbursement Voucher cannot found.'}, status=status.HTTP_404_NOT_FOUND)

    # Allow accounting personnel to disapprove at step 1; determine user's workflow step
    user_step = DEPT_STEP.get(request.user.department)

    if dv.status != 'pending' or dv.current_step != user_step:
        return Response(
            {'error': 'You cannot disapprove this Disbursement Voucher at this stage.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    remarks = request.data.get('remarks', '').strip()
    if not remarks:
        return Response({'error': 'Remarks/feedback are required when disapproving.'}, status=status.HTTP_400_BAD_REQUEST)

    DVWorkflow.objects.create(
        dv=dv, step=user_step, status='disapproved',
        action_by=request.user, remarks=remarks
    )

    dv.status = 'disapproved'
    dv.current_step = 1  # Back to Accounting
    dv.last_disapproved_step = user_step
    dv.save()

    return Response(DVSerializer(dv).data)


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def dv_resubmit(request, pk):
    """Resubmit a corrected DV back to the disapproving department."""
    try:
        dv = DV.objects.get(pk=pk)
    except DV.DoesNotExist:
        return Response({'error': 'Disbursement Voucher cannot found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.user.department != 'accounting':
        return Response({'error': 'Only Accounting can resubmit Disbursement Vouchers.'}, status=status.HTTP_403_FORBIDDEN)

    if dv.status != 'disapproved':
        return Response(
            {'error': 'Only disapproved Disbursement Vouchers can be resubmitted.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    resubmit_step = dv.last_disapproved_step or 2

    DVWorkflow.objects.create(
        dv=dv, step=1, status='resubmitted',
        action_by=request.user,
        remarks=request.data.get('remarks', 'Corrected and resubmitted.')
    )

    dv.status = 'pending'
    dv.current_step = resubmit_step
    dv.save()

    return Response(DVSerializer(dv).data)


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def dv_archive(request, pk):
    """Archive a DV (Accounting only)."""
    try:
        dv = DV.objects.get(pk=pk)
    except DV.DoesNotExist:
        return Response({'error': 'Disbursement Voucher not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.user.department != 'accounting':
        return Response({'error': 'Only Accounting personnel can archive Disbursement Vouchers.'}, status=status.HTTP_403_FORBIDDEN)

    if dv.status == 'archived':
        return Response({'error': 'Disbursement Voucher is already archived.'}, status=status.HTTP_400_BAD_REQUEST)

    if dv.status == 'completed':
        return Response({'error': 'Completed Disbursement Vouchers cannot be archived.'}, status=status.HTTP_400_BAD_REQUEST)

    reason = request.data.get('reason', '').strip()
    if not reason:
        return Response({'error': 'A reason for archiving is required.'}, status=status.HTTP_400_BAD_REQUEST)

    # Create archive record (avoid duplicates)
    DVArchived.objects.update_or_create(dv=dv, defaults={'reason_of_archive': reason})

    DVWorkflow.objects.create(
        dv=dv, step=1, status='archived',
        action_by=request.user, remarks=reason
    )

    dv.status = 'archived'
    dv.save()

    return Response(DVSerializer(dv).data)


# ─────────────────── DASHBOARD ───────────────────

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    user = request.user

    if user.department == 'admin':
        return Response(
            {'error': 'System Administrators do not have access to Disbursement Voucher statistics.'},
            status=status.HTTP_403_FORBIDDEN
        )

    if user.department == 'accounting':
        stats = {
            'total': DV.objects.exclude(status='archived').count(),
            'draft': DV.objects.filter(status='draft').count(),
            'pending': DV.objects.filter(status='pending').count(),
            'disapproved': DV.objects.filter(status='disapproved').count(),
            'completed': DV.objects.filter(status='completed').count(),
            'archived': DV.objects.filter(status='archived').count(),
            'for_action': DV.objects.filter(status__in=['draft', 'disapproved']).count(),
        }
    else:
        user_step = DEPT_STEP.get(user.department, 0)
        for_approval = DV.objects.filter(status='pending', current_step=user_step).count()
        approved_by_me = DVWorkflow.objects.filter(action_by=user, status='approved').count()
        disapproved_by_me = DVWorkflow.objects.filter(action_by=user, status='disapproved').count()
        stats = {
            'total': DV.objects.exclude(status='archived').count(),
            'draft': 0,
            'pending': for_approval,
            'disapproved': disapproved_by_me,
            'completed': DV.objects.filter(status='completed').count(),
            'archived': 0,
            'for_action': for_approval,
            'approved_by_me': approved_by_me,
        }

    # Recent activity
    recent_dvs = DV.objects.exclude(status='archived').order_by('-updated_at')[:5]
    recent = DVSerializer(recent_dvs, many=True).data

    return Response({**stats, 'recent_dvs': recent})



# ─────────────────── PDF GENERATION ───────────────────

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def approved_dv_pdf(request):
    """Generate a PDF containing approved/completed disbursement vouchers."""
    # Only authenticated users can access; limit further if desired
    approved_dvs = DV.objects.filter(Q(status__iexact='approved') | Q(status__iexact='completed')).order_by('-approved_date', '-created_at')

    # Build a simple HTML document
    rows = []
    for dv in approved_dvs:
        rows.append(
            f"<tr>"
            f"<td style='font-weight:600'>{dv.tracking_no or '-'}</td>"
            f"<td>{dv.dv_no or '-'}</td>"
            f"<td>{dv.amount or '-'}</td>"
            f"<td>{getattr(dv, 'approved_date', '') or dv.created_date or '-'}</td>"
            f"<td>{getattr(dv, 'accounting_name', '') or '-'}</td>"
            f"</tr>"
        )

    html = f"""
    <html>
      <head>
        <meta charset='utf-8'/>
        <style>
          body {{ font-family: Arial, sans-serif; font-size: 12px; }}
          table {{ width:100%; border-collapse: collapse; }}
          th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
          th {{ background: #f3f4f6; }}
          h2 {{ color: #2c5dff; }}
        </style>
      </head>
      <body>
        <h2>Approved Disbursement Vouchers</h2>
        <table>
          <thead>
            <tr>
              <th>Tracking #</th>
              <th>DV Number</th>
              <th>Amount</th>
              <th>Approved Date</th>
              <th>Prepared By</th>
            </tr>
          </thead>
          <tbody>
            {''.join(rows)}
          </tbody>
        </table>
      </body>
    </html>
    """

    try:
        # Import pdfkit lazily so the project can start even if the package isn't installed.
        try:
            import pdfkit
        except ModuleNotFoundError:
            return Response({'error': 'Python package "pdfkit" is not installed. Run `python -m pip install pdfkit` or `pip install -r backend/requirements.txt`.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Use wkhtmltopdf via pdfkit. Ensure wkhtmltopdf binary is available in PATH.
        options = {
            'enable-local-file-access': None,
        }

        # Try explicit configuration (env var -> project-local -> common system paths)
        wkhtmltopdf_path = getattr(settings, 'WKHTMLTOPDF_PATH', None) or os.environ.get('WKHTMLTOPDF_PATH')

        if not wkhtmltopdf_path:
            candidate = Path(settings.BASE_DIR) / 'wkhtmltopdf' / 'bin' / 'wkhtmltopdf.exe'
            if candidate.exists():
                wkhtmltopdf_path = str(candidate)

        if not wkhtmltopdf_path:
            for p in ('/usr/local/bin/wkhtmltopdf', '/usr/bin/wkhtmltopdf'):
                if os.path.exists(p):
                    wkhtmltopdf_path = p
                    break

        config = None
        if wkhtmltopdf_path:
            try:
                config = pdfkit.configuration(wkhtmltopdf=wkhtmltopdf_path)
            except Exception:
                config = None

        pdf_bytes = pdfkit.from_string(html, False, options=options, configuration=config)
    except Exception as e:
        return Response({'error': 'Failed to generate PDF.', 'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    response = HttpResponse(pdf_bytes, content_type='application/pdf')
    response['Content-Disposition'] = 'attachment; filename="approved-disbursements.pdf"'
    return response


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def wkhtmltopdf_health(request):
    """Return the detected wkhtmltopdf binary path for diagnostics."""
    wkhtmltopdf_path = getattr(settings, 'WKHTMLTOPDF_PATH', None) or os.environ.get('WKHTMLTOPDF_PATH')

    if not wkhtmltopdf_path:
        candidate = Path(settings.BASE_DIR) / 'wkhtmltopdf' / 'bin' / 'wkhtmltopdf.exe'
        if candidate.exists():
            wkhtmltopdf_path = str(candidate)

    if not wkhtmltopdf_path:
        for p in ('/usr/local/bin/wkhtmltopdf', '/usr/bin/wkhtmltopdf'):
            if os.path.exists(p):
                wkhtmltopdf_path = p
                break

    if wkhtmltopdf_path and os.path.exists(wkhtmltopdf_path):
        return Response({'wkhtmltopdf_path': wkhtmltopdf_path, 'status': 'ok'})

    return Response({
        'wkhtmltopdf_path': None,
        'status': 'missing',
        'message': 'wkhtmltopdf binary not found. Set settings.WKHTMLTOPDF_PATH or WKHTMLTOPDF_PATH env var, or place the binary under backend/wkhtmltopdf/bin.'
    }, status=status.HTTP_404_NOT_FOUND)