import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRole }) => {
  // 1. Check if the user has a token
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  // 2. If no token or user data, kick them to login
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // 3. If they are trying to access a dashboard that doesn't belong to their role
  if (allowedRole && user.role !== allowedRole.toLowerCase()) {
    alert("Unauthorized access. Redirecting to home.");
    return <Navigate to="/" replace />;
  }

  // 4. If everything is good, render the protected pages!
  return <Outlet />;
};

export default ProtectedRoute;
