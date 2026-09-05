import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { PortalLayout } from './components/layout/PortalLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Role } from './types';

// Pages
import {
  LoginPage,
  SignupPage,
  CustomerLoginPage,
  DashboardPage,
  QuotationListPage,
  PipelinePage,
  QuotationBuilderPage,
  ApprovalDetailPage,
  FulfillmentPage,
  BillingPage,
  CustomerQuotationsPage,
  CustomerPortalDetailPage,
  AdminProductsPage,
  AdminPricingPage,
  AdminDiscountsPage,
  AdminApprovalsPage,
  AdminWarehousesPage,
  AdminSubscriptionsPage,
  ReportsPage,
  NotFoundPage,
} from './pages';

// Create TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute fresh cache
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/portal/login" element={<CustomerLoginPage />} />

            {/* Customer Portal Routes (Zero-Leak Surface) */}
            <Route
              path="/portal"
              element={
                <ProtectedRoute isPortalRoute>
                  <PortalLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/portal/quotes" replace />} />
              <Route path="quotes" element={<CustomerQuotationsPage />} />
              <Route path="quotes/:id" element={<CustomerPortalDetailPage />} />
            </Route>

            {/* Internal Staff Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />

              {/* Sales Workspace */}
              <Route path="quotations" element={<QuotationListPage />} />
              <Route path="quotations/new" element={<QuotationBuilderPage />} />
              <Route path="quotations/:id" element={<QuotationBuilderPage />} />
              <Route path="pipeline" element={<PipelinePage />} />

              {/* Governance & Approvals Desk */}
              <Route
                path="approvals"
                element={
                  <ProtectedRoute allowedRoles={[Role.SalesManager, Role.FinanceOperations, Role.Admin]}>
                    <ApprovalDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="approvals/:id"
                element={
                  <ProtectedRoute allowedRoles={[Role.SalesManager, Role.FinanceOperations, Role.Admin]}>
                    <ApprovalDetailPage />
                  </ProtectedRoute>
                }
              />

              {/* Multi-Warehouse Fulfillment */}
              <Route
                path="fulfillment"
                element={
                  <ProtectedRoute allowedRoles={[Role.FinanceOperations, Role.Admin, Role.SalesManager]}>
                    <FulfillmentPage />
                  </ProtectedRoute>
                }
              />

              {/* Invoicing & Subscriptions */}
              <Route
                path="billing"
                element={
                  <ProtectedRoute allowedRoles={[Role.FinanceOperations, Role.Admin]}>
                    <BillingPage />
                  </ProtectedRoute>
                }
              />

              {/* Executive Reports & Analytics */}
              <Route
                path="reports"
                element={
                  <ProtectedRoute allowedRoles={[Role.SalesManager, Role.FinanceOperations, Role.Admin]}>
                    <ReportsPage />
                  </ProtectedRoute>
                }
              />

              {/* Master Configuration & Governance Administration */}
              <Route
                path="admin/products"
                element={
                  <ProtectedRoute allowedRoles={[Role.Admin]}>
                    <AdminProductsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/pricing"
                element={
                  <ProtectedRoute allowedRoles={[Role.Admin]}>
                    <AdminPricingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/discounts"
                element={
                  <ProtectedRoute allowedRoles={[Role.Admin, Role.FinanceOperations]}>
                    <AdminDiscountsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/approvals"
                element={
                  <ProtectedRoute allowedRoles={[Role.Admin]}>
                    <AdminApprovalsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/warehouses"
                element={
                  <ProtectedRoute allowedRoles={[Role.Admin, Role.FinanceOperations]}>
                    <AdminWarehousesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/subscriptions"
                element={
                  <ProtectedRoute allowedRoles={[Role.Admin, Role.FinanceOperations]}>
                    <AdminSubscriptionsPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Catch-all 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
