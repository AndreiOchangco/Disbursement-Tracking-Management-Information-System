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
from .models import User, DV, DVArchived, DVWorkflow, DVPayment, DVParticulars, DVJE, DVReport
from .serializers import UserSerializer, UserCreateUpdateSerializer,DVSerializer, DVCreateUpdateSerializer, DVWorkflowSerializer, DVArchivedSerializer
from .authentication import JWTAuthentication
from django.contrib.auth import authenticate as django_authenticate
from django.contrib.auth.models import User as DjangoUser
from django.contrib.auth import login as django_login
from django.http import HttpResponse
from django.core.mail import EmailMultiAlternatives
from django.utils.html import strip_tags
import os
from pathlib import Path
import base64
from num2words import num2words

def amount_to_words(amount):
    try:
        amount = float(amount)
    except (TypeError, ValueError):
        return ""

    whole = int(amount)
    cents = int(round((amount - whole) * 100))

    words = num2words(whole, lang='en').upper()

    if cents > 0:
        return f"{words} PESOS AND {cents:02d}/100"
    else:
        return f"{words} PESOS ONLY"
    
def is_checked(value, expected):
    if not value:
        return ""

    value = str(value).lower()

    mapping = {
        "gf": ["gf", "general fund"],
        "sef": ["sef"],
        "20% df": ["20% df", "20 percent df"],
        "tf": ["tf", "trust fund"],
        "5% drrmf": ["5% drrmf"],
        "philhealth": ["philhealth"],
        "gad": ["gad"],
        "calamity": ["calamity"],
        "ra7171": ["ra7171"],

        "cash": ["cash"],
        "check": ["check", "cheque"],
        "others": ["others", "other"]
    }

    valid_values = mapping.get(expected.lower(), [expected.lower()])

    for v in valid_values:
        if v in value:
            return "checked"

    return ""

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
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 10))

        dvs = DV.objects.all()

        if not show_archived:
            if status_filter:
                    dvs = dvs.filter(status=status_filter)
            else:
                # Default: exclude archived unless explicitly requested
                dvs = dvs.exclude(status='archived')

        if search:
            dvs = dvs.filter(tracking_no__icontains=search)

        dvs = dvs.order_by('-created_at')
        
        # Calculate total count before pagination
        total_count = dvs.count()
        
        # Apply pagination
        start = (page - 1) * page_size
        end = start + page_size
        paginated_dvs = dvs[start:end]
        
        # Calculate total pages
        total_pages = (total_count + page_size - 1) // page_size
        
        return Response({
            'results': DVSerializer(paginated_dvs, many=True).data,
            'total_count': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': total_pages,
            'has_next': page < total_pages,
            'has_previous': page > 1
        })

    elif request.method == 'POST':
        if request.user.department != 'accounting':
            return Response(
                {'error': 'Only Accounting can create Disbursement Vouchers.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = DVCreateUpdateSerializer(data=request.data)
        if serializer.is_valid():
            # Let the serializer/model default or provided payload determine the
            # initial `current_step`. Previously this was hard-coded to 1 which
            # prevented newly created DVs from starting at step 2 (Budget).
            dv = serializer.save(
                accounting=request.user,
                status='pending'
            )
            # Log creation in workflow
            DVWorkflow.objects.create(
                dv=dv, step=1, status='submitted',
                action_by=request.user, remarks='DV created.'
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
    
    # Create DVReport snapshot when DV is completed
    if dv.status == 'completed' and not hasattr(dv, 'report'):
        DVReport.objects.create(dv=dv, payload=DVSerializer(dv).data)
    
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


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def dv_reports_list(request):
    """List generated DV report snapshots (accounting and admin only)."""
    if request.user.department not in ('accounting', 'admin'):
        return Response({'error': 'Only Accounting or Admin can access generated reports.'}, status=status.HTTP_403_FORBIDDEN)
    # Filters
    dv_no = request.query_params.get('dv_no', '').strip()
    date_from = request.query_params.get('date_from', '').strip()
    date_to = request.query_params.get('date_to', '').strip()

    reports_qs = DVReport.objects.all().order_by('-created_at')

    if dv_no:
        reports_qs = reports_qs.filter(dv__dv_no__icontains=dv_no)

    if date_from:
        try:
            reports_qs = reports_qs.filter(created_at__date__gte=date_from)
        except Exception:
            pass

    if date_to:
        try:
            reports_qs = reports_qs.filter(created_at__date__lte=date_to)
        except Exception:
            pass

    # Pagination
    try:
        page = int(request.query_params.get('page', '1'))
        page_size = int(request.query_params.get('page_size', '10'))
    except ValueError:
        page = 1
        page_size = 10

    from django.core.paginator import Paginator, EmptyPage
    paginator = Paginator(reports_qs, max(1, min(page_size, 100)))
    try:
        page_obj = paginator.page(page)
    except EmptyPage:
        page_obj = paginator.page(paginator.num_pages)

    from .serializers import DVReportSerializer
    serializer = DVReportSerializer(page_obj.object_list, many=True)

    return Response({
        'results': serializer.data,
        'count': paginator.count,
        'page': page_obj.number,
        'total_pages': paginator.num_pages,
    })


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def dv_report_detail(request, dv_id):
    """Return a single DVReport snapshot by DV id (accounting/admin only)."""
    if request.user.department not in ('accounting', 'admin'):
        return Response({'error': 'Only Accounting or Admin can access generated reports.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        report = DVReport.objects.get(dv__id=dv_id)
    except DVReport.DoesNotExist:
        return Response({'error': 'Report not found.'}, status=status.HTTP_404_NOT_FOUND)

    from .serializers import DVReportSerializer
    serializer = DVReportSerializer(report)
    return Response(serializer.data)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def dv_report_pdf(request, dv_id):
    """Generate a PDF for a single DVReport snapshot."""
    if request.user.department not in ('accounting', 'admin'):
        return Response({'error': 'Only Accounting or Admin can access generated reports.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        report = DVReport.objects.get(dv__id=dv_id)
    except DVReport.DoesNotExist:
        return Response({'error': 'Report not found.'}, status=status.HTTP_404_NOT_FOUND)
    

    # Build an HTML representation from the stored payload
    payload = report.payload or {}

    # Extract payee name from payee object
    payee_data = payload.get('payee', {})
    payee_name = payee_data.get('name', '') if isinstance(payee_data, dict) else payee_data

    # --- BUILD PARTICULARS TABLE (For standard rows, if still needed) ---
    particular_rows = ""
    particulars = payload.get('particulars', [])

    for p in particulars:
        desc = p.get('description', '-')
        jev = p.get('jev_no', '-')
        date = p.get('date', '-')

        # Category breakdown (NP / FT / TF)
        cat_values = p.get('category_values', [])
        cat_text = ""
        for c in cat_values:
            cat_text += f"{c.get('category','')} (NP:{c.get('np',0)} FT:{c.get('ft',0)} TF:{c.get('tf',0)})<br>"

        particular_rows += f"""
        <tr>
            <td>{jev}</td>
            <td>{date}</td>
            <td>{desc}<br><small>{cat_text}</small></td>
        </tr>
        """

    if not particular_rows:
        particular_rows = "<tr><td colspan='3'>No particulars available</td></tr>"


    # --- BUILD DYNAMIC PARTICULARS DETAILS (Replaces hardcoded sentence and table) ---
    particulars_details_html = ""

    grand_total = 0
    
    for p in particulars:
        desc = p.get('description', '')
        cat_values = p.get('category_values', [])

        cat_rows = ""
        # accumulate totals for this particular's category breakdown
        total_np = 0
        total_ft = 0
        total_tf = 0
        total_sum = 0
        has_np = has_ft = has_tf = has_sum = False

        def _to_num(v):
            if isinstance(v, (int, float)):
                return v
            if isinstance(v, str):
                s = v.replace(',', '').strip()
                if s in ('', '-', None):
                    return None
                try:
                    return float(s)
                except Exception:
                    return None
            return None

        for c in cat_values:
            cat = c.get('category', '')
            np_val = c.get('np', '-')
            ft_val = c.get('ft', '-')
            tf_val = c.get('tf', '-')
            adjust_val = c.get('adjustment', '-')

            # coerce displayed values to numbers when possible
            np_num = _to_num(np_val)
            ft_num = _to_num(ft_val)
            tf_num = _to_num(tf_val)
            adj_num = _to_num(adjust_val)

            if np_num is not None and ft_num is not None and tf_num is not None:
                sum_num = np_num + ft_num + tf_num
            else:
                sum_num = None

            # apply adjustment to numeric sum and to np if needed
            if sum_num is not None and adj_num:
                sum_num += adj_num
                if np_num is not None:
                    np_num = np_num + adj_num

            # prepare display values (preserve original if non-numeric)
            if isinstance(np_num, (int, float)):
                np_disp = format(np_num, ',.2f')
            else:
                np_disp = np_val
            if isinstance(ft_num, (int, float)):
                ft_disp = format(ft_num, ',.2f')
            else:
                ft_disp = ft_val
            if isinstance(tf_num, (int, float)):
                tf_disp = format(tf_num, ',.2f')
            else:
                tf_disp = tf_val

            # accumulate totals using numeric values
            if isinstance(np_num, (int, float)):
                total_np += np_num
                has_np = True
            if isinstance(ft_num, (int, float)):
                total_ft += ft_num
                has_ft = True
            if isinstance(tf_num, (int, float)):
                total_tf += tf_num
                has_tf = True
            if isinstance(np_num, (int, float)) or isinstance(ft_num, (int, float)) or isinstance(tf_num, (int, float)):
                grand_total += ft_num

            cat_rows += f"""
                <tr>
                    <td>{cat}</td>
                    <td>{np_disp}</td>
                    <td>{ft_disp}</td>
                    <td>{tf_disp}</td>
                </tr>
            """

        # totals row (show '-' when no numeric values present)
        total_np_display = format(total_np, ',.2f') if has_np else '-'
        total_ft_display = format(total_ft, ',.2f') if has_ft else '-'
        total_tf_display = format(total_tf, ',.2f') if has_tf else '-'
        cat_rows += f"""
            <tr>
                <td></td>
                <td style="font-weight:bold; border-top:1px solid black; border-bottom:1px solid black;">{total_np_display}</td>
                <td style="font-weight:bold; border-top:1px solid black; border-bottom:1px solid black;">{total_ft_display}</td>
                <td style="font-weight:bold; border-top:1px solid black; border-bottom:1px solid black;">{total_tf_display}</td>
            </tr>
        """

        particulars_details_html += f"""
            <span style="text-align: center; display: block; margin-bottom: 6px;" class="medium">
                {desc}
            </span>
            <table style="width: 80%; margin-top: 6px; left: 0;" class="small">
                <tr>
                    <td></td>
                    <td>Net Pay</td>
                    <td>15th</td>
                    <td>31st</td>
                </tr>
                {cat_rows}
                <tr>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                </tr>
            </table>
        """

    if not particulars_details_html:
        particulars_details_html = "<span style='text-align: center; display: block;' class='medium'>No particulars available</span>"


    # --- BUILD JOURNAL ENTRIES ---
    je_rows = ""
    journal_entries = payload.get('journal_entries', [])

    for je in journal_entries:
        je_rows += f"""
        <tr>
            <td>{je.get('account_title','-')}</td>
            <td>{je.get('account_code','-')}</td>
            <td>{je.get('debit','-')}</td>
            <td>{je.get('credit','-')}</td>
        </tr>
        """

    if not je_rows:
        je_rows = "<tr><td colspan='4'>No journal entries</td></tr>"


    # --- BUILD PAYMENTS ---
    payment_info = ""
    payments = payload.get("payments", [])

    payment = payments[0] if payments else {}

    mop = (payment.get("mop") or "").strip().lower()
    mop_specify = payment.get("mop_specify", "")

    for pay in payments:
        payment_info += f"""
        Bank: {pay.get('bank','-')}<br>
        Date: {pay.get('date','-')}<br>
        Ref No: {pay.get('reference_no','-')}<br><br>
        """


    # Prepare image source: try data URI (public/MuniLuna.png), then file:// fallback, else keep original
    img_src = '/MuniLuna.png'
    candidates = [
        Path(settings.BASE_DIR) / 'public' / 'MuniLuna.png',
        Path(settings.BASE_DIR).parent / 'public' / 'MuniLuna.png',
        Path(settings.BASE_DIR) / '..' / 'public' / 'MuniLuna.png',
    ]
    for p in candidates:
        try:
            p = p.resolve()
        except Exception:
            pass
        if p.exists():
            try:
                with open(p, 'rb') as f:
                    data = base64.b64encode(f.read()).decode()
                img_src = f"data:image/png;base64,{data}"
            except Exception:
                img_src = 'file:///' + str(p).replace('\\', '/')
            break

    # second header image (LunaBaluarte.png)
    img_src_2 = '/LunaBaluarte.png'
    candidates2 = [
        Path(settings.BASE_DIR) / 'public' / 'LunaBaluarte.png',
        Path(settings.BASE_DIR).parent / 'public' / 'LunaBaluarte.png',
        Path(settings.BASE_DIR) / '..' / 'public' / 'LunaBaluarte.png',
    ]
    for p in candidates2:
        try:
            p = p.resolve()
        except Exception:
            pass
        if p.exists():
            try:
                with open(p, 'rb') as f:
                    data2 = base64.b64encode(f.read()).decode()
                img_src_2 = f"data:image/png;base64,{data2}"
            except Exception:
                img_src_2 = 'file:///' + str(p).replace('\\', '/')
            break

    amount_due = grand_total
    amount_due_display = f"{amount_due:,.2f}" if amount_due else "0.00"
    amount_in_words = amount_to_words(amount_due)

    fund_source = (payload.get('fund_source') or "").strip().lower()

    # --- MAIN HTML ---
    html = f"""
    <html>
    <head>
    <meta charset="utf-8">
    <style>
    body {{
        font-family: Arial;
        font-size: 11px;
    }}
    table {{
        width: 100%;
        border-collapse: collapse;
    }}
    td, th {{
        border: 1px solid black;
        padding: 5px;
    }}
    /* remove borders for nested/inner tables (e.g., particulars breakdown) */
    table table, table table td, table table th {{
        border: none;
    }}
    /* make first column narrow so logo/labels don't add extra width */
    table tr td:first-child {{
        width: 35px;
        padding-left: 6px;
        padding-right: 6px;
        white-space: nowrap;
        vertical-align: middle;
    }}
    .center {{ text-align: center; }}
    .left {{ text-align: left; }}
    .bold {{ font-weight: bold; }}
    .no-bold {{ font-weight: normal; }}
    .small {{ font-size: 10px; }}
    .medium {{ font-size: 12px; }}
    .large {{ font-size: 14px; }}
    .larger {{ font-size: 16px; }}
    .largest {{ font-size: 18px; }}
    .flex {{ display: flex; }}
    </style>
    </head>

    <body>

    <table>
    <tr>
        <td rowspan="2" class="center bold">
            <img src="{img_src}" alt="Seal" style="height: auto; width: 125px;">
        </td>

        <td rowspan="1" class="center bold" style="width: 85px;">
            <p class="no-bold medium" style="margin-bottom: -10px;">Republic of the Philippines</p><br>
            <h3 class="largest" style="margin-top: -3px; margin-bottom: -3px;">MUNICIPALITY OF LUNA</h3><br>
            <p class="no-bold medium" style="margin-top: -10px;">Province of La Union</p>
        </td>

        <td rowspan="2" class="center bold" style="width: 200px;">
            <img src="{img_src_2}" alt="Baluarte" style="height: auto; width: 200px; margin: 0; padding: 0; margin-top: -20px; margin-bottom: -20px;">
        </td>

        <td rowspan="1" class="left bold small" style="width: 200px;">
            <h3 style="margin-bottom: -2px;">Fund Source</h3>
            <input type="checkbox" style="transform: scale(1.5); margin-bottom: -3px;" {is_checked(fund_source, 'gf')} disabled> GF <input type="checkbox" style="transform: scale(1.5); margin-left: 80px; margin-bottom: -3px;" {is_checked(fund_source, 'sef')} disabled> SEF</br> 
            <input type="checkbox" style="transform: scale(1.5); margin-bottom: -3px;" {is_checked(fund_source, '20% df')} disabled> 20% DF <input type="checkbox" style="transform: scale(1.5); margin-left: 57px; margin-bottom: -3px;" {is_checked(fund_source, 'tf')} disabled> TF</br>
            <input type="checkbox" style="transform: scale(1.5); margin-bottom: -3px;" {is_checked(fund_source, '5% drrmf')} disabled> 5% DRRMF <input type="checkbox" style="transform: scale(1.5); margin-left: 40px; margin-bottom: -3px;" {is_checked(fund_source, 'philhealth')} disabled> PhilHealth</br>
            <input type="checkbox" style="transform: scale(1.5); margin-bottom: -3px;" {is_checked(fund_source, 'gad')} disabled> GAD <input type="checkbox" style="transform: scale(1.5); margin-left: 73px; margin-bottom: -3px;" {is_checked(fund_source, 'calamity')} disabled> Calamity</br>
            <input type="checkbox" style="transform: scale(1.5); margin-bottom: -3px;" {is_checked(fund_source, 'ra7171')} disabled> RA7171</br>
        </td>
    </tr>

    <tr>
        <td rowspan="1" class="center bold largest" style="width: 80px; height: 30px;">DISBURSEMENT VOUCHER</td>
        <td rowspan="1" class="bold small" style="width: 120px; position:relative; display:flex; align-items:center; justify-content:center;">
            <span style="position:absolute; left:8px; font-weight:600;">DV No:</span>
            <span style="text-align:center; display:block; width:100%;" class="medium">{payload.get('dv_no','')}</span>
        </td>
    </tr>

    <tr>
        <td rowspan="1" class="center bold medium">MODE OF PAYMENT</td>
        <td colspan="2" class="left bold small">
            <input type="checkbox" style="transform: scale(1.5); margin-right: 3px;" {is_checked(mop, 'cash')} disabled> CASH
            <input type="checkbox" style="transform: scale(1.5); margin-right: 3px; margin-left: 10px;" {is_checked(mop, 'check')} disabled> CHECK
            <input type="checkbox" style="transform: scale(1.5); margin-right: 3px; margin-left: 10px;" {is_checked(mop, 'others')} disabled> OTHERS
            <label style="margin-left: 10px;">Specify: <span style="text-decoration: underline; font-size: 12px; margin-left: 10px;">{mop_specify if 'others' in mop else ''}</span></label>
        </td>
        <td rowspan="1" class="bold small" style="width: 120px; position:relative; display:flex; align-items:center; justify-content:center;">
            <span style="position:absolute; margin-top: -6px;">Date:</span>
            <div style="text-align:center;" class="medium">{payload.get('dv_date','')}</div>
        </td>
    </tr>

    <tr>
        <td colspan="1" style="height: 60px;" class="center bold medium"><b>PAYEE</b></td>
        <td colspan="1" class="center bold">{payee_name}</td>
        <td rowspan="1" class="bold small" style="position:relative; display:flex; align-items:center; justify-content:center;">
            <span style="position:absolute; margin-top: -23px;">ID No. / TIN:</span>
            <div class="medium" style="text-align:center;">{payload.get('tin','')}</div>
        </td>
        <td rowspan="1" class="bold small" style="position:relative; display:flex; align-items:center; justify-content:center;">
            <span style="position:absolute; margin-top: -23px;">CAFOA No:</span>
            <div class="medium" style="text-align:center;">{payload.get('cafoa_no','')}</div>
        </td>
    </tr>

    <tr>
        <td colspan="1" class="center bold medium"><b>POSITION / OFFICE</b></td>
        <td colspan="1" class="center">{payload.get('position_office','')}</td>
        <td rowspan="2" class="bold small" style="position:relative; display:flex; align-items:center; justify-content:center;">
            <span style="position:absolute; margin-top: -25px;">Office / Unit / Project:</span>
            <div class="medium" style="text-align:center;">{payload.get('office_unit_project','')}</div>
        </td>
        <td rowspan="2" class="bold small" style="position:relative; display:flex; align-items:center; justify-content:center;">
            <span style="position:absolute; margin-top: -19px;">Responsibility Center:</span>
            <div class="medium" style="text-align:center;">{payload.get('responsibility_center','')}</div>
        </td>
    </tr>

    <tr>
        <td colspan="1" class="center bold medium"><b>ADDRESS</b></td>
        <td colspan="1" class="center">Luna, La Union</td>
    </tr>

    <tr>
        <td colspan="3" class="center bold medium"><b>PARTICULARS</b></td>
        <td colspan="1" class="center bold medium"><b>AMOUNT</b></td>
    </tr>

    <tr>
        <td colspan="3">
            {particulars_details_html}
        </td>
        <td colspan="1">{total_ft_display}</td>
    </tr>
    </table>
    <table>
        <tr>
            <td colspan="1" class="center bold medium" style="text-align: center;">Amount in </br> Words: </td>
            <td colspan="2" class="center bold medium" style="text-align: center; width: 56%;">{amount_in_words}</td>
            <td colspan="2" class="center bold medium" style="text-align: center;">Amount Due: ></td>
            <td colspan="1" class="center bold medium" style="text-align: center; width: 24.1%;">{amount_due_display}</td>
        </tr>
    </table>
    <table>
        <tr>
        </tr>
    </table>

    </body>
    </html>
    """

    try:
        try:
            import pdfkit
        except ModuleNotFoundError:
            return Response({'error': 'Python package "pdfkit" is not installed.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        options = {'enable-local-file-access': None}
        wkhtmltopdf_path = getattr(settings, 'WKHTMLTOPDF_PATH', None) or os.environ.get('WKHTMLTOPDF_PATH')
        if not wkhtmltopdf_path:
            candidate = Path(settings.BASE_DIR) / 'wkhtmltopdf' / 'bin' / 'wkhtmltopdf.exe'
            if candidate.exists():
                wkhtmltopdf_path = str(candidate)

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
    response['Content-Disposition'] = f'attachment; filename="dv_report_{report.dv.id}.pdf"'
    return response


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def dv_reports_backfill(request):
    """Admin-only: create DVReport snapshots for completed DVs missing them."""
    if request.user.department != 'admin':
        return Response({'error': 'Only Admin can run backfill.'}, status=status.HTTP_403_FORBIDDEN)

    completed = DV.objects.filter(status='completed')
    created = 0
    for dv in completed:
        try:
            if not hasattr(dv, 'report'):
                DVReport.objects.create(dv=dv, payload=DVSerializer(dv).data)
                created += 1
        except Exception:
            # ignore individual failures
            continue

    return Response({'created': created, 'checked': completed.count()})



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

@api_view(['POST'])
def send_email(request):
    subject = request.data.get('subject')
    to_email = request.data.get('to')
    html_content = request.data.get('html')
    
    # Validation
    if not all([subject, to_email, html_content]):
        return Response({"error": "Missing fields"}, status=status.HTTP_400_BAD_REQUEST)

    # Create plain text version (good practice for email clients that don't render HTML)
    text_content = strip_tags(html_content) 

    try:
        msg = EmailMultiAlternatives(
            subject, 
            text_content, 
            settings.EMAIL_HOST_USER, # From email
            [to_email]              # Recipient list
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send()
        
        return Response({"message": "Email sent!"}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)