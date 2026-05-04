/* eslint-disable no-undef */
import { generateDVEmailTemplate } from '../utils/emailTemplates';
import { apiRequest } from '../api';

export const sendDVEmail = async ({ type, dv, payee, remarks = null }) => {
  if (!dv || !payee?.email) return;

  const html = generateDVEmailTemplate({
    type,
    name: payee.name,
    trackingNo: dv.tracking_no,
    dvNo: dv.dv_no,
    createdDate: formatDateMMDDYYYY(dv.created_date),
    remarks,
  });

  return apiRequest('/send-email/', 'POST', {
    to: payee.email,
    subject: `DV ${type.toUpperCase()} (Tracking #${dv.tracking_no})`,
    html,
  });
};