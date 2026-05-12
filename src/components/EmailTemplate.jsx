// EmailTemplate.jsx
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

  // Humanize raw department names (e.g. 'mayors_office' -> "Mayor's Office", 'accounting' -> "Accounting Department")
  const formatDepartment = (dept) => {
    if (!dept) return 'the designated department';
    const formatted = dept
      .replace(/[_-]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    if (formatted.toLowerCase().includes('office') || formatted.toLowerCase().includes('gso')) {
      return formatted;
    }
    return `${formatted} Department`;
  };

  const deptName = formatDepartment(department);

  const messageMap = {
    update: 'Your disbursement voucher has been reviewed and <strong style="color:#2c5dff;">updated</strong>.',
    approved: `Your disbursement voucher has been <strong style="color:#2c5dff;">approved</strong> by ${deptName} and is currently under review by next department.`,
    rejected: `Your disbursement voucher has been <strong style="color:#e11d48;">rejected</strong> by ${deptName}.`,
    completed: `Your disbursement voucher has been <strong style="color:#059669;">approved</strong> by ${deptName}.`,
  };

  // Show remarks block only for updates or rejections
  const showRemarks = type === 'rejected' || type === 'update';

  const imageUrl = 'https://plain-apac-prod-public.komododecks.com/202605/08/Dz5pUM6CMXopOfEP5aOC/image.png';

  const getRemarkTheme = () => {
    if (type === 'rejected') {
      return { bg: '#fee2e2', text: '#991b1b', border: '#e11d48' }; // High-contrast Alert Red
    }
    return { bg: '#eff6ff', text: '#1e40af', border: '#2c5dff' };   // High-contrast Info Blue (matches update theme)
  };

  const theme = getRemarkTheme();
  
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
          <p style="margin-top: 16px; margin-bottom: 4px;"><strong>Remarks:</strong></p>
          <div style="background: ${theme.bg}; color: ${theme.text}; border-left: 4px solid ${theme.border}; padding: 12px; border-radius: 8px;">
            ${remarks || 'No remarks provided.'}
          </div>
          ` : ''}

          <p style="margin-top:16px;">
            ${type === 'completed' ? 'No further action is required.' : 'Please review the status details and take any necessary action.'}
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