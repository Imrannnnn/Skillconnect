import { useState } from 'react'
import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header.jsx'
import OfflineBanner from './components/OfflineBanner.jsx'
import AiAssistant from './components/AiAssistant.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import VerifyEmail from './pages/VerifyEmail.jsx'
import ProviderList from './pages/ProviderList.jsx'
import ProviderProfile from './pages/ProviderProfile.jsx'
import DashboardClient from './pages/DashboardClient.jsx'
import DashboardProvider from './pages/DashboardProvider.jsx'
import ProviderProducts from './pages/ProviderProducts.jsx'
import Chat from './pages/Chat.jsx'
import Payments from './pages/Payments.jsx'
import WalletCallback from './pages/WalletCallback.jsx'
import PrivateRoute from './components/PrivateRoute.jsx'
import Notifications from './pages/Notifications.jsx'
import Chats from './pages/Chats.jsx'
import About from './pages/About.jsx'
import EditProfileProvider from './pages/EditProfileProvider.jsx'
import ProviderBookings from './pages/ProviderBookings.jsx'
import ClientBookings from './pages/ClientBookings.jsx'
import AccountSettings from './pages/AccountSettings.jsx'
import AdminForms from './pages/AdminForms.jsx'
import PublicForm from './pages/PublicForm.jsx'
import OrgDashboard from './pages/OrgDashboard.jsx'

function App() {
  const [_, __] = useState(null)

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Header />
      <OfflineBanner />
      <main className="flex-1 p-4 relative overflow-x-hidden">
        {/* Floating particles across all pages */}
        <span className="particle" style={{ top: "10%", left: "8%", animationDelay: "0s" }} />
        <span className="particle" style={{ top: "25%", left: "20%", animationDelay: "0.8s" }} />
        <span className="particle" style={{ top: "40%", left: "35%", animationDelay: "1.5s" }} />
        <span className="particle" style={{ top: "55%", left: "60%", animationDelay: "2.2s" }} />
        <span className="particle" style={{ top: "70%", left: "78%", animationDelay: "3s" }} />
        <span className="particle" style={{ top: "85%", left: "45%", animationDelay: "3.6s" }} />
        <span className="particle" style={{ top: "30%", left: "80%", animationDelay: "1.1s" }} />
        <span className="particle" style={{ top: "60%", left: "15%", animationDelay: "2.8s" }} />
        <span className="particle" style={{ top: "20%", left: "65%", animationDelay: "1.9s" }} />
        <span className="particle" style={{ top: "45%", left: "10%", animationDelay: "2.4s" }} />
        <span className="particle" style={{ top: "75%", left: "30%", animationDelay: "3.2s" }} />
        <span className="particle" style={{ top: "90%", left: "70%", animationDelay: "4s" }} />
        <span className="particle" style={{ top: "18%", left: "50%", animationDelay: "0.4s" }} />
        <span className="particle" style={{ top: "35%", left: "5%", animationDelay: "1.3s" }} />
        <span className="particle" style={{ top: "48%", left: "72%", animationDelay: "2.1s" }} />
        <span className="particle" style={{ top: "62%", left: "90%", animationDelay: "2.9s" }} />
        <span className="particle" style={{ top: "82%", left: "20%", animationDelay: "3.5s" }} />
        <span className="particle" style={{ top: "12%", left: "30%", animationDelay: "0.6s" }} />
        <span className="particle" style={{ top: "52%", left: "50%", animationDelay: "1.8s" }} />

        <div className="relative z-10">
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          <Route path="/providers" element={<ProviderList />} />
          <Route path="/providers/:id" element={<ProviderProfile />} />
          <Route path="/p/:id" element={<ProviderProfile />} />
          <Route path="/@:handle" element={<ProviderProfile />} />
          <Route path="/dashboard" element={<PrivateRoute><DashboardClient /></PrivateRoute>} />
          <Route path="/provider/dashboard" element={<PrivateRoute><DashboardProvider /></PrivateRoute>} />
          <Route path="/org/dashboard" element={<PrivateRoute><OrgDashboard /></PrivateRoute>} />
          <Route path="/provider/products" element={<PrivateRoute><ProviderProducts /></PrivateRoute>} />
          <Route path="/provider/edit-profile" element={<PrivateRoute><EditProfileProvider /></PrivateRoute>} />
          <Route path="/provider/bookings" element={<PrivateRoute><ProviderBookings /></PrivateRoute>} />
          <Route path="/bookings" element={<PrivateRoute><ClientBookings /></PrivateRoute>} />
          <Route path="/settings/account" element={<PrivateRoute><AccountSettings /></PrivateRoute>} />
          <Route path="/admin/forms" element={<PrivateRoute><AdminForms /></PrivateRoute>} />
          <Route path="/forms/:id" element={<PublicForm />} />
          <Route path="/chats" element={<PrivateRoute><Chats /></PrivateRoute>} />
          <Route path="/chat/:chatId" element={<PrivateRoute><Chat /></PrivateRoute>} />
          <Route path="/payments" element={<PrivateRoute><Payments /></PrivateRoute>} />
          <Route path="/wallet/callback" element={<PrivateRoute><WalletCallback /></PrivateRoute>} />
          <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <AiAssistant />
        </div>
      </main>
    </div>
  )
}

export default App
