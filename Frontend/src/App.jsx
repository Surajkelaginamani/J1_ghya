import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

// --- Public Pages ---
import LandingPage from './Pages/LandingPage.jsx'
import LoginPage from './Pages/LoginPage.jsx'
import Sign_up from './Pages/Sign_up.jsx'
import CustomerForm from './Pages/CoustomerForm.jsx'
import VendorForm from './Pages/VendorForm.jsx'     

// --- Customer Dashboard Pages ---
import DashboardLayout from './Layouts/DashboardLayout.jsx';
import CustomerDashboard from './Pages/Customer_Dashboard_Pages/CustomerDashboard.jsx'
import BrowseTiffinsPage from './Pages/Customer_Dashboard_Pages/BrowseTiffinsPage.jsx'
import SubscriptionsPage from './Pages/Customer_Dashboard_Pages/SubscriptionsPage.jsx'
import OrdersPage from './Pages/Customer_Dashboard_Pages/Orderspage.jsx'
import HolidayCalendarPage from './Pages/Customer_Dashboard_Pages/HolidayCalendarPage.jsx'
import PaymentsPage from './Pages/Customer_Dashboard_Pages/PaymentsPage.jsx'
import ReviewsPage from './Pages/Customer_Dashboard_Pages/ReviewsPage.jsx'
import NotificationsPage from './Pages/Customer_Dashboard_Pages/NotificationsPage.jsx'
import ProfilePage from './Pages/Customer_Dashboard_Pages/ProfilePage.jsx'
import HomemadeStorePage from './Pages/Customer_Dashboard_Pages/HomemadeStorePage.jsx'
import WeeklyMenusPage from './Pages/Customer_Dashboard_Pages/WeeklyMenusPage.jsx'

// --- Vendor Dashboard Pages ---
import VendorDashboard from './Pages/VendorDashboard.jsx'
import Payments_Status from './Pages/Vendors_Dashboard_components/Payments_Status.jsx'
import Reviews from './Pages/Vendors_Dashboard_components/Reviews.jsx'
import MenuManagement from './Pages/Vendors_Dashboard_components/MenuManagement.jsx'
import Students from './Pages/Vendors_Dashboard_components/Students.jsx'
import LeaveManagement from './Pages/Vendors_Dashboard_components/LeaveManagement.jsx'
import LocationSummary from './Pages/Vendors_Dashboard_components/LocationSummary.jsx'
import CustomerDirectory from './Pages/Vendors_Dashboard_components/CustomerDirectory.jsx'
import AddExtraProduct from './Pages/Vendors_Dashboard_components/AddExtraProduct.jsx'
import HomemadeOrdersPage from './Pages/Vendors_Dashboard_components/HomemadeOrdersPage.jsx'
import Analytics from './Pages/Vendors_Dashboard_components/Analytics.jsx'

// --- Security ---
import ProtectedRoute from './components/ProtectedRoute.jsx' // Make sure this path is correct based on where you save it!
import VendorDetailsPage from './Pages/Customer_Dashboard_Pages/VendorDetailsPage.jsx'
import VendorProfilePage from './Pages/Vendors_Dashboard_components/VendorProfilePage.jsx'

const App = () => {
  return (
    <div>
      <Routes>
        {/* ============================== */}
        {/* 1. PUBLIC ROUTES (Unrestricted)*/}
        {/* ============================== */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/sign_up" element={<Sign_up />} />
        <Route path="/customer_form" element={<CustomerForm />} />
        <Route path="/vendor_form" element={<VendorForm />} />
        
        {/* Redirect old dashboard link to the new layout */}
        <Route path="/customer_dashboard" element={<Navigate to="/dashboard" replace />} />

        {/* ============================== */}
        {/* 2. SECURE CUSTOMER ROUTES      */}
        {/* ============================== */}
        <Route element={<ProtectedRoute allowedRole="customer" />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<CustomerDashboard />} />
            <Route path="browse" element={<BrowseTiffinsPage />} />
            <Route path="subscriptions" element={<SubscriptionsPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="homemade-store" element={<HomemadeStorePage />} />
            <Route path="weekly-menus" element={<WeeklyMenusPage />} />
            <Route path="calendar" element={<HolidayCalendarPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="reviews" element={<ReviewsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<ProfilePage />} /> 
            <Route path="Details_ven/:id" element={<VendorDetailsPage />} />
          </Route> 
        </Route>

        {/* ============================== */}
        {/* 3. SECURE VENDOR ROUTES        */}
        {/* ============================== */}
        <Route element={<ProtectedRoute allowedRole="vendor" />}>
          <Route path="/Ven_Dashboard" element={<VendorDashboard />} />     
          <Route path="/Payment_Status" element={<Payments_Status />} /> 
          <Route path="/Reviews" element={<Reviews />} /> 
          <Route path="/menu_management" element={<MenuManagement />} /> 
          <Route path="/students" element={<Students />} /> 
          <Route path="/Leave_manegment" element={<LeaveManagement />} /> 
          <Route path="/locations" element={<LocationSummary />} /> 
          <Route path="/CustomerDirectory" element={<CustomerDirectory/>} />
          <Route path="/Add" element={<AddExtraProduct/>} />
          <Route path="/homemade-orders" element={<HomemadeOrdersPage/>} />
          <Route path="/analytics" element={<Analytics/>}/>
           <Route path="/vendor-profile" element={<VendorProfilePage/>}/>
        </Route>
     
      </Routes>
    </div>
  )
}

export default App



