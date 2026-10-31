const express = require('express');
const cors = require('cors');
require('dotenv').config();

const productRoutes = require('./routes/products');
const supplierRoutes = require('./routes/suppliers');
const customerRoutes = require('./routes/customers');
const purchaseRoutes = require('./routes/purchases');
const salesRoutes = require('./routes/sales');
const productionRoutes = require('./routes/production');
const financeRoutes = require('./routes/finance');
const dashboardRoutes = require('./routes/dashboard');
const seedRoutes = require('./routes/seed');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/seed', seedRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`ERP Backend running on port ${PORT}`);
});

module.exports = app;
