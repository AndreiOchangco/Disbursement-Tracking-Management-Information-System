def generate_dv_email_template(
    type='update',
    name='Payee',
    tracking_no=None,
    dv_no=None,
    created_date=None,
    remarks=None,
):
    title_map = {
        'update': 'Disbursement Voucher Updates',
        'approved': 'Disbursement Voucher Updated',
        'rejected': 'Disbursement Voucher Rejected',
        'completed': 'Disbursement Voucher Approved',
    }

    message_map = {
        'update': 'Your disbursement voucher has been reviewed and <strong style="color:#2c5dff;">updated</strong>.',
        'rejected': 'Your disbursement voucher has been <strong style="color:#e11d48;">rejected</strong>.',
        'completed': 'Your disbursement voucher has been <strong style="color:#059669;">approved</strong>.',
    }

    show_remarks = type not in ('completed', 'update', 'rejected')
    image_url = 'https://i.ibb.co/7t0tzVXg/Muni-Luna.png'

    html = f"""
    <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
      <div style="max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden;">
        
        <div style="background: #2c5dff; color: #ffffff; padding: 20px; text-align: center;">
          <div style="margin-bottom: 15px;">
            <img src="{image_url}" alt="Muni Luna" style="max-width: 80px; height: auto;">
          </div>
          <h2 style="margin: 0;">{title_map.get(type)}</h2>
        </div>

        <div style="padding: 20px;">
          <p>Hello <strong>{name}</strong>,</p>

          <p>{message_map.get(type)}</p>

          <div style="margin: 16px 0; padding: 12px; background: #f9fafb; border-radius: 8px;">
            <p style="margin: 4px 0;"><strong>Tracking No:</strong> {tracking_no}</p>
            <p style="margin: 4px 0;"><strong>DV No:</strong> {dv_no or 'N/A'}</p>
            <p style="margin: 4px 0;"><strong>Date Submitted:</strong> {created_date}</p>
          </div>

          {f'''
          <p><strong>Remarks:</strong></p>
          <div style="background:#fee2e2; padding:12px; border-radius:8px; color:#991b1b;">
            {remarks or 'No remarks provided.'}
          </div>
          ''' if show_remarks else ''}

          <p style="margin-top:16px;">
            {"No further action is required." if type == 'approved' else "Please review the remarks and take the necessary action."}
          </p>

          <p style="margin-top:20px;">Thank you.</p>
        </div>

        <div style="background: #f3f4f6; text-align:center; padding: 12px; font-size: 12px; color:#6b7280;">
          Disbursement Tracking Management Information System
        </div>

      </div>
    </div>
    """

    return html