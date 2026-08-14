import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/components/auth-provider';

// Layouts
import AppLayout from '@/components/layout/app-layout';
import { ScrollToTop } from '@/components/layout/scroll-to-top';

// Pages
import LoginPage from '@/pages/login';
import DashboardPage from '@/pages/dashboard';
import OrdenesPage from '@/pages/ordenes';
import OrdenDetailPage from '@/pages/ordenes/detalle';
import NuevaOrdenPage from '@/pages/ordenes/nueva';
import ClientesPage from '@/pages/clientes';
import EmpleadosPage from '@/pages/empleados';
import ServiciosPage from '@/pages/servicios';
import PromocionesPage from '@/pages/promociones';
import CajaPage from '@/pages/caja';
import ReportesPage from '@/pages/reportes';
import ConfiguracionPage from '@/pages/configuracion';

import type { UserRole } from '@/lib/types';

function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}) {
  const { session, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected routes */}
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
        <Route path="ordenes" element={<OrdenesPage />} />
        <Route
          path="ordenes/nueva"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'CASHIER']}>
              <NuevaOrdenPage />
            </ProtectedRoute>
          }
        />
        <Route path="ordenes/:id" element={<OrdenDetailPage />} />
        <Route
          path="clientes"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'CASHIER']}>
              <ClientesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="empleados"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <EmpleadosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="servicios"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <ServiciosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="promociones"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <PromocionesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="caja"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'CASHIER']}>
              <CajaPage />
            </ProtectedRoute>
          }
        />
        <Route path="reportes" element={<ReportesPage />} />
        <Route path="configuracion" element={<ConfiguracionPage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    </>
  );
}

export default App;
