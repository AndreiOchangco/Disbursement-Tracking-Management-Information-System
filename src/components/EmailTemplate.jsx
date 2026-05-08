export const generateDVEmailTemplate = (
  type = 'update',
  name = 'Payee',
  tracking_no = null,
  dv_no = null,
  created_date = null,
  remarks = null,
  department = ''
) => {
  const titleMap = {
    update: 'Disbursement Voucher Entry Updates',
    approved: 'Disbursement Voucher Entry Submitted',
    rejected: 'Disbursement Voucher Entry Rejected',
    completed: 'Disbursement Voucher Entry Approved',
  };

  const messageMap = {
    update: 'Your disbursement voucher has been reviewed and <strong style="color:#2c5dff;">updated</strong>.',
    rejected: 'Your disbursement voucher has been <strong style="color:#e11d48;">rejected</strong>.',
    completed: 'Your disbursement voucher has been <strong style="color:#059669;">approved</strong>.',
  };

  const showRemarks = type !== 'completed' && type !== 'update' && type !== 'rejected';

  const imageUrl = 'https://i.ibb.co/7t0tzVXg/Muni-Luna.png';

  const html = `
    <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
      <div style="max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden;">
        
        <div style="background: #2c5dff; color: #ffffff; padding: 20px; text-align: center;">
          <div style="margin-bottom: 15px;">
            <img src="${imageUrl}" alt="Muni Luna" style="max-width: 80px; height: auto;">
          </div>
          <h2 style="margin: 0;">${titleMap[type] || titleMap.update}</h2>
        </div>

        <div style="padding: 20px;">
          <p>Hello <strong>${name}</strong>,</p>

          <p>${messageMap[type] || messageMap.update}</p>

          <div style="margin: 16px 0; padding: 12px; background: #f9fafb; border-radius: 8px;">
            <p style="margin: 4px 0;"><strong>Tracking No:</strong> ${tracking_no || 'N/A'}</p>
            <p style="margin: 4px 0;"><strong>DV No:</strong> ${dv_no || 'N/A'}</p>
            <p style="margin: 4px 0;"><strong>Date Submitted:</strong> ${created_date || 'N/A'}</p>
          </div>

          ${remarks && showRemarks ? `
          <p><strong>Remarks:</strong></p>
          <div style="background:#fee2e2; padding:12px; border-radius:8px; color:#991b1b;">
            ${remarks || 'No remarks provided.'}
          </div>
          ` : ''}

          <p style="margin-top:16px;">
            ${type === 'completed' ? 'No further action is required.' : 'Please review the remarks and take the necessary action.'}
          </p>

          <p style="margin-top:20px;">Thank you.</p>
        </div>

        <div style="background: #f3f4f6; text-align:center; padding: 12px; font-size: 12px; color:#6b7280;">
          Disbursement Tracking Management Information System
        </div>

      </div>
    </div>
  `;

  return html;
};

const EmailTemplate = ({
  type = 'update',
  name = 'Payee',
  trackingNo = null,
  dvNo = null,
  createdDate = null,
  remarks = null,
  department = '',
}) => {
  const htmlContent = generateDVEmailTemplate(
    type,
    name,
    trackingNo,
    dvNo,
    createdDate,
    remarks,
    department
  );

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
      <div
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        style={{ maxWidth: '600px', margin: '0 auto' }}
      />
    </div>
  );
};

export default EmailTemplate;
