import { apiRequest } from '../api';

export const approveDV = (id) => {
  return apiRequest(`/approve-dv/${id}/`, 'POST');
};

export const rejectDV = (id, remarks) => {
  return apiRequest(`/dv/${id}/disapprove/`, 'POST', { remarks });
};