import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/components/auth-provider';

// Layouts
import AppLayout from '@/components/layout/app-layout';
import SuperAdminLayout from '@/components/layout/superadmin-layout';
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

// Super Admin Pages
import SuperAdminDashboardPage from '@/pages/superadmin/dashboard';
import EstablecimientosPage from '@/pages/superadmin/establecimientos';
import SuperAdminUsuariosPage from '@/pages/superadmin/usuarios';

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
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    if (user.role === 'SUPER_ADMIN') {
      return <Navigate to="/superadmin/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function RootRedirect() {
  const { user, session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'SUPER_ADMIN') {
    return <Navigate to="/superadmin/dashboard" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Root Redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Super Admin Protected Routes */}
        <Route
          path="/superadmin"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
              <SuperAdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/superadmin/dashboard" replace />} />
          <Route path="dashboard" element={<SuperAdminDashboardPage />} />
          <Route path="establecimientos" element={<EstablecimientosPage />} />
          <Route path="usuarios" element={<SuperAdminUsuariosPage />} />
        </Route>

        {/* Sede / Lavadero Protected routes */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'CASHIER', 'OPERATOR']}>
              <AppLayout />
            </ProtectedRoute>
          }
        >
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
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </>
  );
}

export default App;
