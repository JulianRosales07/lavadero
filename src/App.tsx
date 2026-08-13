import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/components/auth-provider';

// Layouts
import AppLayout from '@/components/layout/app-layout';

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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();

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

  return <>{children}</>;
}

function App() {
  return (
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
        <Route path="ordenes/nueva" element={<NuevaOrdenPage />} />
        <Route path="ordenes/:id" element={<OrdenDetailPage />} />
        <Route path="clientes" element={<ClientesPage />} />
        <Route path="empleados" element={<EmpleadosPage />} />
        <Route path="servicios" element={<ServiciosPage />} />
        <Route path="promociones" element={<PromocionesPage />} />
        <Route path="caja" element={<CajaPage />} />
        <Route path="reportes" element={<ReportesPage />} />
        <Route path="configuracion" element={<ConfiguracionPage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
