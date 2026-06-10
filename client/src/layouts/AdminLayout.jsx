import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminSidebar from '../components/layout/AdminSidebar';
import './AdminLayout.css';

export default function AdminLayout() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontSize:'1.5rem', color:'var(--neon-blue)' }}>Loading...</div>;
  if (!user || user.role !== 'admin') return <Navigate to="/admin/login" replace />;
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-layout__main">
        <Outlet />
      </main>
    </div>
  );
}
