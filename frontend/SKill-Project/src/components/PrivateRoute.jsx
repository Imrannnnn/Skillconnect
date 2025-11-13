import { useContext } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { AuthContext } from '../context/auth.js'

export default function PrivateRoute({ children }) {
  const { token } = useContext(AuthContext)
  const location = useLocation()
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />
    }
  return children
}
