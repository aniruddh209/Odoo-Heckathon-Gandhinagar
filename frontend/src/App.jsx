import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

import {
  LoginPage,
  SignupPage,
  DashboardPage,
  QuotationListPage,
  QuotationBuilderPage,
  QuotationDetailPage,
  ApprovalDetailPage,
  PipelinePage,
  FulfillmentPage,
  BillingPage,
  DealHealthPage,
  ReportsPage,
  CustomerListPage,
  CustomerDetailPage,
  UserManagementPage,
  CustomerAccountPage,
  CustomerPortalDetailPage,
  AdminCatalogPage,
  AdminGovernancePage,
  NotFoundPage,
} from './pages';

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          {/* Public Authentication */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Customer Portal Magic Link (Cryptographically Isolated, No internal CRM frame) */}
          <Route path="/portal/quote/:token" element={<CustomerPortalDetailPage />} />

          {/* Authenticated Customer Account Portal */}
          <Route
            path="/portal/my-account"
            element={
              <ProtectedRoute allowedRoles={['Customer', 'Admin']}>
                <CustomerAccountPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portal/quotations/:id"
            element={
              <ProtectedRoute allowedRoles={['Customer', 'Admin']}>
                <CustomerAccountPage />
              </ProtectedRoute>
            }
          />

          {/* Internal CRM & Sales Operations App Layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />

            {/* Core Sales Workspaces */}
            <Route path="workspace/quotations" element={<QuotationListPage />} />
            <Route path="workspace/quotations/new" element={<QuotationBuilderPage />} />
            <Route path="workspace/quotations/:id" element={<QuotationDetailPage />} />
            <Route path="workspace/pipeline" element={<PipelinePage />} />
            <Route path="workspace/customers" element={<CustomerListPage />} />
            <Route path="workspace/customers/:id" element={<CustomerDetailPage />} />

            {/* Governance & Approvals */}
            <Route
              path="workspace/approvals"
              element={
                <ProtectedRoute allowedRoles={['SalesManager', 'FinanceOperations', 'Admin']}>
                  <ApprovalDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="workspace/deal-health"
              element={
                <ProtectedRoute allowedRoles={['SalesManager', 'Admin']}>
                  <DealHealthPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="workspace/users"
              element={
                <ProtectedRoute allowedRoles={['SalesManager', 'Admin']}>
                  <UserManagementPage />
                </ProtectedRoute>
              }
            />

            {/* Operations & Revenue */}
            <Route
              path="workspace/fulfillment"
              element={
                <ProtectedRoute allowedRoles={['SalesRep', 'SalesManager', 'FinanceOperations', 'Admin']}>
                  <FulfillmentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="workspace/billing"
              element={
                <ProtectedRoute allowedRoles={['FinanceOperations', 'Admin', 'SalesManager']}>
                  <BillingPage />
                </ProtectedRoute>
              }
            />

            {/* Analytics */}
            <Route
              path="workspace/reports"
              element={
                <ProtectedRoute allowedRoles={['SalesManager', 'FinanceOperations', 'Admin']}>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />

            {/* Administration & Master Data */}
            <Route
              path="admin/products"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminCatalogPage defaultTab="products" />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/pricing"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminCatalogPage defaultTab="pricing" />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/discounts"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'SalesManager']}>
                  <AdminGovernancePage defaultTab="discounts" />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/approvals"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'SalesManager']}>
                  <AdminGovernancePage defaultTab="approvals" />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/warehouses"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'FinanceOperations']}>
                  <AdminGovernancePage defaultTab="warehouses" />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/subscriptions"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminGovernancePage defaultTab="plans" />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
