import { useState } from 'react'
import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header.jsx'
import OfflineBanner from './components/OfflineBanner.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import ProviderList from './pages/ProviderList.jsx'
import ProviderProfile from './pages/ProviderProfile.jsx'
import DashboardClient from './pages/DashboardClient.jsx'
import DashboardProvider from './pages/DashboardProvider.jsx'
import Chat from './pages/Chat.jsx'
import Payments from './pages/Payments.jsx'
import PrivateRoute from './components/PrivateRoute.jsx'
import Notifications from './pages/Notifications.jsx'
import Chats from './pages/Chats.jsx'
import About from './pages/About.jsx'
import EditProfileProvider from './pages/EditProfileProvider.jsx'
import ProviderBookings from './pages/ProviderBookings.jsx'
import ClientBookings from './pages/ClientBookings.jsx'

function App() {
  const [_, __] = useState(null)

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <OfflineBanner />
      <main className="flex-1 p-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/providers" element={<ProviderList />} />
          <Route path="/providers/:id" element={<ProviderProfile />} />
          <Route path="/dashboard" element={<PrivateRoute><DashboardClient /></PrivateRoute>} />
          <Route path="/provider/dashboard" element={<PrivateRoute><DashboardProvider /></PrivateRoute>} />
          <Route path="/provider/edit-profile" element={<PrivateRoute><EditProfileProvider /></PrivateRoute>} />
          <Route path="/provider/bookings" element={<PrivateRoute><ProviderBookings /></PrivateRoute>} />
          <Route path="/bookings" element={<PrivateRoute><ClientBookings /></PrivateRoute>} />
          <Route path="/chats" element={<PrivateRoute><Chats /></PrivateRoute>} />
          <Route path="/chat/:chatId" element={<PrivateRoute><Chat /></PrivateRoute>} />
          <Route path="/payments" element={<PrivateRoute><Payments /></PrivateRoute>} />
          <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
