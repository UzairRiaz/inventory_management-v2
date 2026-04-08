import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import LoginChoice from './pages/auth/LoginChoice';
import SuperAdminLogin from './pages/auth/SuperAdminLogin';
import OrgLogin from './pages/auth/OrgLogin';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import RowDetail from './pages/RowDetail';
import OrgLayout from './components/OrgLayout';
import Home from './pages/org/Home';
import Inventory from './pages/org/Inventory';
import InventoryCreate from './pages/org/InventoryCreate';
import Sales from './pages/org/Sales';
import SalesCreate from './pages/org/SalesCreate';
import Payments from './pages/org/Payments';
import PaymentsCreate from './pages/org/PaymentsCreate';
import Ledger from './pages/org/Ledger';
import LedgerCreate from './pages/org/LedgerCreate';
import Profit from './pages/org/Profit';
import CustomerSales from './pages/org/CustomerSales';
import Purchase from './pages/org/Purchase';
import SetupHome from './pages/org/setup/SetupHome';
import WarehouseSetup from './pages/org/setup/WarehouseSetup';
import ItemsSetup from './pages/org/setup/ItemsSetup';
import NotesSetup from './pages/org/setup/NotesSetup';
import UsersSetup from './pages/org/setup/UsersSetup';
import ActivitySetup from './pages/org/setup/ActivitySetup';
import CustomersSetup from './pages/org/setup/CustomersSetup';

function LoadingScreen() {
  return (
    <div className="main-content">
      <div className="content-wrap">
        <div className="section">
          <div className="meta-text">Loading...</div>
        </div>
      </div>
    </div>
  );
}

function RequireAuth({ children }) {
  const { token, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function RequireRole({ allow, children }) {
  const { user } = useAuth();
  if (!user || !allow.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function TopBar() {
  const { user, token, signOut } = useAuth();

  return (
    <header className="top-bar">
      <div className="brand">Inventory Management</div>
      {token ? (
        <div className="actions-row">
          <div>{user?.name || 'User'} ({user?.role || '-'})</div>
          <button className="btn ghost" onClick={signOut}>Logout</button>
        </div>
      ) : null}
    </header>
  );
}

function AppRoutes() {
  const { token, user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route path="/" element={token ? <Navigate to={user?.role === 'superadmin' ? '/superadmin' : '/org/home'} replace /> : <Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginChoice />} />
      <Route path="/login/superadmin" element={<SuperAdminLogin />} />
      <Route path="/login/org" element={<OrgLogin />} />

      <Route
        path="/superadmin"
        element={
          <RequireAuth>
            <RequireRole allow={['superadmin']}>
              <SuperAdminDashboard />
            </RequireRole>
          </RequireAuth>
        }
      />

      <Route
        path="/org"
        element={
          <RequireAuth>
            <RequireRole allow={['admin', 'manager', 'staff']}>
              <OrgLayout />
            </RequireRole>
          </RequireAuth>
        }
      >
        <Route path="home" element={<Home />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="inventory/new" element={<InventoryCreate />} />
        <Route path="sales" element={<Sales />} />
        <Route path="sales/new" element={<SalesCreate />} />
        <Route path="payments" element={<Payments />} />
        <Route path="payments/new" element={<PaymentsCreate />} />
        <Route path="ledger" element={<Ledger />} />
        <Route path="ledger/new" element={<LedgerCreate />} />
        <Route path="purchase" element={<Purchase />} />
        <Route path="setup" element={<SetupHome />} />
        <Route path="setup/warehouses" element={<WarehouseSetup />} />
        <Route path="setup/items" element={<ItemsSetup />} />
        <Route path="setup/notes" element={<NotesSetup />} />
        <Route path="setup/users" element={<UsersSetup />} />
        <Route path="setup/customers" element={<CustomersSetup />} />
        <Route path="setup/profit" element={<Profit />} />
        <Route path="setup/activity" element={<ActivitySetup />} />
        <Route path="customer-sales" element={<CustomerSales />} />
        <Route path="detail" element={<RowDetail />} />
      </Route>

      <Route
        path="/detail"
        element={
          <RequireAuth>
            <RowDetail />
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-shell">
          <TopBar />
          <main className="main-content">
            <AppRoutes />
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
