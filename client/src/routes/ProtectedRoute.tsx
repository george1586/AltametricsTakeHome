import { Navigate, Outlet } from 'react-router';
import { useAppSelector } from '../store/store.ts';

export function ProtectedRoute() {
  const token = useAppSelector((state) => state.auth.token);
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}