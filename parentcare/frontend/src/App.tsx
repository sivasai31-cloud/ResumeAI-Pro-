import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { Parents } from './pages/Parents';
import { ParentDetail } from './pages/ParentDetail';
import { Medicines } from './pages/Medicines';
import { Appointments } from './pages/Appointments';
import { Reports } from './pages/Reports';
import { Emergency } from './pages/Emergency';
import { Notifications } from './pages/Notifications';
import { Admin } from './pages/Admin';
import { Profile } from './pages/Profile';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/parents" element={<Parents />} />
              <Route path="/parents/:id" element={<ParentDetail />} />
              <Route path="/medicines" element={<Medicines />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/emergency" element={<Emergency />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/profile" element={<Profile />} />

              {/* Admin Protected Route */}
              <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
                <Route path="/admin" element={<Admin />} />
              </Route>
            </Route>
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
