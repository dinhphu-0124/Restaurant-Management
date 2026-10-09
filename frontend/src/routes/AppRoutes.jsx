import { lazy, Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ScrollToTop from "../components/ScrollToTop";
import PageLoadingSpinner from "../components/common/PageLoadingSpinner";
import AdminToast from "../components/admin/AdminToast";

// Lazy loading Customer Pages
const Home = lazy(() => import("../pages/Home"));
const Register = lazy(() => import("../pages/Register"));
const Login = lazy(() => import("../pages/Login"));
const VerifyEmailPage = lazy(() => import("../pages/VerifyEmailPage"));
const MenuPage = lazy(() => import("../pages/MenuPage"));
const CartPage = lazy(() => import("../pages/CartPage"));
const CheckoutPage = lazy(() => import("../pages/CheckoutPage"));
const PaymentQRPage = lazy(() => import("../pages/PaymentQRPage"));
const OrderSuccessPage = lazy(() => import("../pages/OrderSuccessPage"));
const OrderDetailPage = lazy(() => import("../pages/OrderDetailPage"));
const BookingPage = lazy(() => import("../pages/BookingPage"));
const BookingSuccessPage = lazy(() => import("../pages/BookingSuccessPage"));
const BookingDetailPage = lazy(() => import("../pages/BookingDetailPage"));
const DealsPage = lazy(() => import("../pages/DealsPage"));
const DealDetailPage = lazy(() => import("../pages/DealDetailPage"));
const AboutPage = lazy(() => import("../pages/AboutPage"));
const ContactPage = lazy(() => import("../pages/ContactPage"));
const ProfilePage = lazy(() => import("../pages/ProfilePage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));

// Lazy loading Admin Pages
const AdminLoginPage = lazy(() => import("../pages/admin/AdminLoginPage"));
const AdminLayout = lazy(() => import("../layouts/AdminLayout"));
const AdminProtectedRoute = lazy(() => import("../components/admin/AdminProtectedRoute"));
const AdminDashboardPage = lazy(() => import("../pages/admin/AdminDashboardPage"));
const AdminOrdersPage = lazy(() => import("../pages/admin/AdminOrdersPage"));
const AdminBookingsPage = lazy(() => import("../pages/admin/AdminBookingsPage"));
const AdminMenuPage = lazy(() => import("../pages/admin/AdminMenuPage"));
const AdminDealsPage = lazy(() => import("../pages/admin/AdminDealsPage"));
const AdminUsersPage = lazy(() => import("../pages/admin/AdminUsersPage"));
const AdminRevenuePage = lazy(() => import("../pages/admin/AdminRevenuePage"));
const AdminTablesPage = lazy(() => import("../pages/admin/AdminTablesPage"));
const AdminSpacesPage = lazy(() => import("../pages/admin/AdminSpacesPage"));
const AdminRolesPage = lazy(() => import("../pages/admin/AdminRolesPage"));
const AdminActivityLogsPage = lazy(() => import("../pages/admin/AdminActivityLogsPage"));
const AdminReportPage = lazy(() => import("../pages/admin/AdminReportPage"));

function MainLayout({ children }) {
  const location = useLocation();

  const pathToPage = {
    "/": "home",
    "/home": "home",
    "/menu": "menu",
    "/cart": "cart",
    "/checkout": "cart",
    "/booking": "booking",
    "/deals": "deals",
    "/about": "about",
    "/contact": "contact",
    "/profile": "profile",
  };

  let currentPage = pathToPage[location.pathname] || "";

  if (location.pathname.startsWith("/deals/")) {
    currentPage = "deals";
  }

  if (location.pathname.startsWith("/profile")) {
    currentPage = "profile";
  }

  if (location.pathname.startsWith("/booking")) {
    currentPage = "booking";
  }

  return (
    <>
      <Header currentPage={currentPage} />
      <div className="h-16"></div>
      {children}
      <Footer />
    </>
  );
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AdminToast />
      <Suspense fallback={<PageLoadingSpinner />}>
        <Routes>
          <Route
            path="/"
            element={
              <MainLayout>
                <Home />
              </MainLayout>
            }
          />

          <Route
            path="/home"
            element={
              <MainLayout>
                <Home />
              </MainLayout>
            }
          />

          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          
          {/* Menu */}
          <Route
            path="/menu"
            element={
              <MainLayout>
                <MenuPage />
              </MainLayout>
            }
          />
          
          {/* Giỏ hàng */}
          <Route
            path="/cart"
            element={
              <MainLayout>
                <CartPage />
              </MainLayout>
            }
          />
          
          {/* Hình thức phục vụ */}
          <Route
            path="/checkout"
            element={
              <MainLayout>
                <CheckoutPage />
              </MainLayout>
            }
          />
          
          {/* Thanh toán */}
          <Route
            path="/payment-qr"
            element={
              <MainLayout>
                <PaymentQRPage />
              </MainLayout>
            }
          />
          <Route path="/order-success" element={<OrderSuccessPage />} />
          <Route
            path="/profile/order-detail/:id"
            element={
              <MainLayout>
                <OrderDetailPage />
              </MainLayout>
            }
          />
          
          {/* Đặt bàn */}
          <Route
            path="/booking"
            element={
              <MainLayout>
                <BookingPage />
              </MainLayout>
            }
          />
          <Route
            path="/booking-success"
            element={
              <MainLayout>
                <BookingSuccessPage />
              </MainLayout>
            }
          />
          
          {/* Khuyến mãi */}
          <Route
            path="/deals"
            element={
              <MainLayout>
                <DealsPage />
              </MainLayout>
            }
          />
          <Route
            path="/deals/:dealId"
            element={
              <MainLayout>
                <DealDetailPage />
              </MainLayout>
            }
          />
          
          {/* Giới thiệu & Liên hệ */}
          <Route
            path="/about"
            element={
              <MainLayout>
                <AboutPage />
              </MainLayout>
            }
          />
          <Route
            path="/contact"
            element={
              <MainLayout>
                <ContactPage />
              </MainLayout>
            }
          />
          
          {/* Trang cá nhân */}
          <Route
            path="/profile"
            element={
              <MainLayout>
                <ProfilePage />
              </MainLayout>
            }
          />
          <Route
            path="/profile/booking-detail/:id"
            element={
              <MainLayout>
                <BookingDetailPage />
              </MainLayout>
            }
          />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminLayout />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="bookings" element={<AdminBookingsPage />} />
            <Route path="tables" element={<AdminTablesPage />} />
            <Route path="spaces" element={<AdminSpacesPage />} />
            <Route path="menu" element={<AdminMenuPage />} />
            <Route path="deals" element={<AdminDealsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="revenue" element={<AdminRevenuePage />} />
            <Route path="reports" element={<AdminReportPage />} />
            <Route path="roles" element={<AdminRolesPage />} />
            <Route path="logs" element={<AdminActivityLogsPage />} />
          </Route>

          {/* 404 Not Found */}
          <Route
            path="*"
            element={
              <MainLayout>
                <NotFoundPage />
              </MainLayout>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default AppRoutes;
