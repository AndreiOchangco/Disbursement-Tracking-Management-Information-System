export const generateDVEmailTemplate = ({
  type = 'update', // 'update' | 'rejected' | 'approved'
  name = 'Payee',
  trackingNo,
  dvNo,
  createdDate,
  remarks = null,
}) => {
  const titleMap = {
    update: 'Disbursement Voucher Updates',
    rejected: 'Disbursement Voucher Rejected',
    approved: 'Disbursement Voucher Approved',
  };

  const messageMap = {
    update: `Your disbursement voucher has been reviewed and <strong style="color:#2c5dff;">updated</strong>.`,
    rejected: `Your disbursement voucher has been <strong style="color:#e11d48;">rejected</strong>.`,
    approved: `Your disbursement voucher has been <strong style="color:#059669;">approved</strong>.`,
  };

  const showRemarks = type !== 'approved';

  return `
    <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
      <div style="max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden;">
        
        <div style="background: #2c5dff; color: #ffffff; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">${titleMap[type]}</h2>
        </div>

        <div style="padding: 20px;">
          <p>Hello <strong>${name}</strong>,</p>

          <p>${messageMap[type]}</p>

          <div style="margin: 16px 0; padding: 12px; background: #f9fafb; border-radius: 8px;">
            <p style="margin: 4px 0;"><strong>Tracking No:</strong> ${trackingNo}</p>
            <p style="margin: 4px 0;"><strong>DV No:</strong> ${dvNo || 'N/A'}</p>
            <p style="margin: 4px 0;"><strong>Date Submitted:</strong> ${createdDate}</p>
          </div>

          ${
            showRemarks
              ? `
            <p><strong>Remarks:</strong></p>
            <div style="background:#fee2e2; padding:12px; border-radius:8px; color:#991b1b;">
              ${remarks || 'No remarks provided.'}
            </div>
          `
              : ''
          }

          <p style="margin-top:16px;">
            ${
              type === 'approved'
                ? 'No further action is required.'
                : 'Please review the remarks and take the necessary action.'
            }
          </p>

          <p style="margin-top:20px;">Thank you.</p>
        </div>

        <div style="background: #f3f4f6; text-align:center; padding: 12px; font-size: 12px; color:#6b7280;">
          Disbursement Tracking Management Information System
        </div>

      </div>
    </div>
  `;
};