import jwt
import datetime
from django.conf import settings
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
from rest_framework.authentication import BaseAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import AuthenticationFailed
from .models import User, DV, DVArchived, DVWorkflow, DVPayment, DVParticulars, DVJE
from .serializers import UserSerializer, UserCreateUpdateSerializer,DVSerializer, DVCreateUpdateSerializer, DVWorkflowSerializer, DVArchivedSerializer
from .authentication import JWTAuthentication

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

# ─────────────────── AUTH ───────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    email = request.data.get('email', '').strip().lower()
    password = request.data.get('password', '')

    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        return Response({'error': 'Email is not yet registered. Contact the system administrator to register this email.'}, status=status.HTTP_401_UNAUTHORIZED)

    if not user.check_password(password):
        return Response({'error': 'Password is incorrect.'}, status=status.HTTP_401_UNAUTHORIZED)

    if user.status != 'active':
        return Response(
            {'error': 'Your account has been deactivated. Contact the system administrator.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    payload = {
        'user_id': user.id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24),
        'iat': datetime.datetime.utcnow(),
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

    return Response({
        'access_token': token,
        'user': UserSerializer(user).data,
    })


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)


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


@api_view(['GET', 'PUT', 'PATCH'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def user_detail(request, pk):
    """Retrieve or update a user (e.g., changing status to inactive)."""
    
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
        serializer = UserCreateUpdateSerializer(user_obj, data=request.data, partial=True)
        if serializer.is_valid():
            updated_user = serializer.save()
            return Response(UserSerializer(updated_user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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
                status='draft',
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

    if request.user.department == 'accounting':
        return Response({'error': 'Accounting personnel cannot approve DVs.'}, status=status.HTTP_403_FORBIDDEN)

    user_step = DEPT_STEP.get(request.user.department)

    if dv.status != 'pending' or dv.current_step != user_step:
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

    if request.user.department == 'accounting':
        return Response({'error': 'Accounting personnel cannot disapprove Disbursement Vouchers.'}, status=status.HTTP_403_FORBIDDEN)

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