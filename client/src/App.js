import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import CoverLetter from './components/CoverLetter';
import Email from './components/Email';
import Navbar from './components/Navbar';
import { AuthProvider, useAuth } from './context/AuthContext';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import VerifyEmail from './components/VerifyEmail';  // Add this import

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />  {/* Add this route */}
          <Route
            path="/cover-letter"
            element={
              <PrivateRoute>
                <Navbar />
                <CoverLetter />
              </PrivateRoute>
            }
          />
          <Route
            path="/email"
            element={
              <PrivateRoute>
                <Navbar />
                <Email />
              </PrivateRoute>
            }
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;