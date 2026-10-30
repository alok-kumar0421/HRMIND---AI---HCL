import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import HRDashboard from './pages/HRDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import Policies from './pages/Policies';
import EmployeeManagement from './pages/EmployeeManagement';

const RootRedirect = () => {
  const { user, token } = useAuth();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (user.is_temporary_password) return <Navigate to="/change-password" replace />;
  return <Navigate to={user.role === 'HR' ? '/hr-dashboard' : '/dashboard'} replace />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/change-password" element={<ChangePassword />} />
          
          {/* HR Routes */}
          <Route element={<ProtectedRoute allowedRoles={['HR']} />}>
            <Route path="/hr-dashboard" element={<HRDashboard />} />
            <Route path="/policies" element={<Policies />} />
            <Route path="/employees" element={<EmployeeManagement />} />
          </Route>
          
          {/* Employee Routes */}
          <Route element={<ProtectedRoute allowedRoles={['EMPLOYEE']} />}>
            <Route path="/dashboard" element={<EmployeeDashboard />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
