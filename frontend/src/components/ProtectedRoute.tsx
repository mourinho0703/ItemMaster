import React, { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Layout } from './Layout'
import { Loader2 } from 'lucide-react'

export const ProtectedRoute: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
        navigate('/login', { replace: true })
      }
    }

    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
        navigate('/login', { replace: true })
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      </div>
    )
  }

  return isAuthenticated ? (
    <Layout>
      <Outlet />
    </Layout>
  ) : null
}




