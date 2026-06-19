import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import CartDrawer from '../components/cart/CartDrawer';

export default function NoFooterLayout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1, paddingTop: '72px' }}>
        <Outlet />
      </main>
      <CartDrawer />
    </div>
  );
}
