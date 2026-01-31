import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = () => {
  // const token = localStorage.getItem('token');
  
  // Basic check: if no token, redirect to login
  // In a real app, you might want to validate the token expiry here
  // return token ? <Outlet /> : <Navigate to="/login" replace />;
  return <Outlet />; // Bypassed for frontend-only preview
};

export default PrivateRoute;
