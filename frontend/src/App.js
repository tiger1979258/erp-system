import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Purchases from './pages/Purchases';
import Sales from './pages/Sales';
import Inventory from './pages/Inventory';
import Production from './pages/Production';
import Finance from './pages/Finance';

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/purchases" element={<Purchases />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/production" element={<Production />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}
