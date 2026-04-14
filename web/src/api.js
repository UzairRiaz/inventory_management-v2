const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

async function request(path, options = {}, token) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

export const api = {
  superadminLogin: (payload) => request('/api/auth/superadmin/login', { method: 'POST', body: JSON.stringify(payload) }),
  organizationLogin: (payload) => request('/api/auth/organization/login', { method: 'POST', body: JSON.stringify(payload) }),

  getOrganizations: (token) => request('/api/organizations', {}, token),
  createOrganization: (token, payload) => request('/api/superadmin/organizations', { method: 'POST', body: JSON.stringify(payload) }, token),
  createAdmin: (token, payload) => request('/api/superadmin/admins', { method: 'POST', body: JSON.stringify(payload) }, token),
  createOrganizationWithAdmin: (token, payload) =>
    request('/api/superadmin/organizations/with-admin', { method: 'POST', body: JSON.stringify(payload) }, token),

  getUsers: (token) => request('/api/users', {}, token),
  createUser: (token, payload) => request('/api/users', { method: 'POST', body: JSON.stringify(payload) }, token),

  getWarehouses: (token) => request('/api/warehouses', {}, token),
  createWarehouse: (token, payload) => request('/api/warehouses', { method: 'POST', body: JSON.stringify(payload) }, token),

  getItems: (token) => request('/api/items', {}, token),
  createItem: (token, payload) => request('/api/items', { method: 'POST', body: JSON.stringify(payload) }, token),
  updateItem: (token, itemId, payload) => request(`/api/items/${itemId}`, { method: 'PUT', body: JSON.stringify(payload) }, token),

  getCustomers: (token) => request('/api/customers', {}, token),
  createCustomer: (token, payload) => request('/api/customers', { method: 'POST', body: JSON.stringify(payload) }, token),
  updateCustomer: (token, customerId, payload) => request(`/api/customers/${customerId}`, { method: 'PUT', body: JSON.stringify(payload) }, token),
  getCustomerPayments: (token) => request('/api/customers/payments', {}, token),
  receiveCustomerPayment: (token, customerId, payload) =>
    request(`/api/customers/${customerId}/payments`, { method: 'POST', body: JSON.stringify(payload) }, token),

  getStock: (token, warehouseId) => request(`/api/stock${warehouseId ? `?warehouseId=${warehouseId}` : ''}`, {}, token),
  adjustStock: (token, payload) => request('/api/stock/adjust', { method: 'POST', body: JSON.stringify(payload) }, token),
  deleteStock: (token, stockId) => request(`/api/stock/${stockId}`, { method: 'DELETE' }, token),

  getNotes: (token) => request('/api/notes', {}, token),
  createNote: (token, payload) => request('/api/notes', { method: 'POST', body: JSON.stringify(payload) }, token),

  getSales: (token, from, to) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const suffix = params.toString() ? `?${params.toString()}` : '';
    return request(`/api/sales${suffix}`, {}, token);
  },
  createSale: (token, payload) => request('/api/sales', { method: 'POST', body: JSON.stringify(payload) }, token),
  deleteSale: (token, saleId) => request(`/api/sales/${saleId}`, { method: 'DELETE' }, token),
  getSalesProfit: (token, from, to) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const suffix = params.toString() ? `?${params.toString()}` : '';
    return request(`/api/sales/profit/summary${suffix}`, {}, token);
  },
  getSalesByCustomer: (token, customerId, customerName) => {
    const params = new URLSearchParams();
    if (customerId) params.set('customerId', customerId);
    if (!customerId && customerName) params.set('customerName', customerName);
    const suffix = params.toString() ? `?${params.toString()}` : '';
    return request(`/api/sales/by-customer${suffix}`, {}, token);
  },
  getOutstandingCreditSales: (token) => request('/api/sales/credits/outstanding', {}, token),
  getOutstandingByCustomer: (token) => request('/api/sales/credits/outstanding-by-customer', {}, token),
  receiveSalePayment: (token, saleId, payload) =>
    request(`/api/sales/${saleId}/payments`, { method: 'POST', body: JSON.stringify(payload) }, token),
  deleteSalePayment: (token, saleId, paymentId) =>
    request(`/api/sales/${saleId}/payments/${paymentId}`, { method: 'DELETE' }, token),
  getIncomingPayments: (token) => request('/api/sales/payments', {}, token),

  getLedger: (token, from, to) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const suffix = params.toString() ? `?${params.toString()}` : '';
    return request(`/api/ledger${suffix}`, {}, token);
  },
  createLedger: (token, payload) => request('/api/ledger', { method: 'POST', body: JSON.stringify(payload) }, token),
  deleteLedger: (token, id) => request(`/api/ledger/${id}`, { method: 'DELETE' }, token),
  getLedgerProfit: (token, from, to) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const suffix = params.toString() ? `?${params.toString()}` : '';
    return request(`/api/ledger/profit/summary${suffix}`, {}, token);
  },

  getActivity: (token) => request('/api/activity', {}, token),

  getPurchases: (token) => request('/api/purchases', {}, token),
  createPurchase: (token, payload) => request('/api/purchases', { method: 'POST', body: JSON.stringify(payload) }, token),
  getPurchaseSummary: (token) => request('/api/purchases/summary', {}, token),
  updatePurchase: (token, id, payload) => request(`/api/purchases/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, token),
  deletePurchase: (token, id) => request(`/api/purchases/${id}`, { method: 'DELETE' }, token),
  recordPurchasePayment: (token, id, payload) => request(`/api/purchases/${id}/payments`, { method: 'POST', body: JSON.stringify(payload) }, token),
};
