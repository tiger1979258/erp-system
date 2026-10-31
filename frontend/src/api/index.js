import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Products
export const getProducts = () => api.get('/products');
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);

// Suppliers
export const getSuppliers = () => api.get('/suppliers');
export const createSupplier = (data) => api.post('/suppliers', data);
export const updateSupplier = (id, data) => api.put(`/suppliers/${id}`, data);
export const deleteSupplier = (id) => api.delete(`/suppliers/${id}`);

// Customers
export const getCustomers = () => api.get('/customers');
export const createCustomer = (data) => api.post('/customers', data);
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, data);
export const deleteCustomer = (id) => api.delete(`/customers/${id}`);

// Purchases
export const getPurchases = () => api.get('/purchases');
export const getPurchase = (id) => api.get(`/purchases/${id}`);
export const createPurchase = (data) => api.post('/purchases', data);
export const updatePurchase = (id, data) => api.put(`/purchases/${id}`, data);
export const deletePurchase = (id) => api.delete(`/purchases/${id}`);

// Sales
export const getSales = () => api.get('/sales');
export const getSale = (id) => api.get(`/sales/${id}`);
export const createSale = (data) => api.post('/sales', data);
export const deleteSale = (id) => api.delete(`/sales/${id}`);

// Production
export const getProductions = () => api.get('/production');
export const getProduction = (id) => api.get(`/production/${id}`);
export const createProduction = (data) => api.post('/production', data);
export const updateProduction = (id, data) => api.put(`/production/${id}`, data);
export const deleteProduction = (id) => api.delete(`/production/${id}`);

// Finance
export const getFinanceRecords = (params) => api.get('/finance', { params });
export const getFinanceSummary = (params) => api.get('/finance/summary/stats', { params });
export const createFinanceRecord = (data) => api.post('/finance', data);
export const updateFinanceRecord = (id, data) => api.put(`/finance/${id}`, data);
export const deleteFinanceRecord = (id) => api.delete(`/finance/${id}`);

// Dashboard
export const getDashboardOverview = () => api.get('/dashboard/overview');
export const getInventoryDetail = () => api.get('/dashboard/inventory');

// Seed
export const seedDemoData = () => api.post('/seed');

export default api;
