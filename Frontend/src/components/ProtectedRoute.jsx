import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRole }) => {
  const token = localStorage.getItem('token');
  const [user, setUser] = useState(() => {
    const userString = localStorage.getItem('user');
    return userString ? JSON.parse(userString) : null;
  });
  const [isCheckingSession, setIsCheckingSession] = useState(Boolean(token && !user));

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      if (!token || user) {
        setIsCheckingSession(false);
        return;
      }

      try {
        const response = await fetch('https://meal-mitra-vhcd.onrender.com/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (isMounted) setUser(null);
          } else {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              if (isMounted) setUser(JSON.parse(storedUser));
            } else if (isMounted) {
              setUser(null);
            }
          }
          return;
        }

        const restoredUser = await response.json();
        const normalizedUser = {
          id: restoredUser._id || restoredUser.id,
          name: restoredUser.name,
          email: restoredUser.email,
          role: restoredUser.role
        };

        localStorage.setItem('user', JSON.stringify(normalizedUser));
        if (isMounted) {
          setUser(normalizedUser);
        }
      } catch (error) {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          if (isMounted) setUser(JSON.parse(storedUser));
        } else if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, [token, user]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (isCheckingSession) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole.toLowerCase()) {
    alert("Unauthorized access. Redirecting to home.");
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;

