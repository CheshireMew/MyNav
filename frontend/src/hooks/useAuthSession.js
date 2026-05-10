import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'

export function useAuthSession({ closeModal }) {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })

  const login = async (event) => {
    event.preventDefault()
    try {
      const data = await api.login(loginForm)
      setToken(data.token)
      localStorage.setItem('token', data.token)
      closeModal()
    } catch {
      alert('登录失败')
    }
  }

  const logout = useCallback(() => {
    setToken(null)
    localStorage.removeItem('token')
  }, [])

  useEffect(() => {
    window.addEventListener('mynav:unauthorized', logout)
    return () => window.removeEventListener('mynav:unauthorized', logout)
  }, [logout])

  return {
    token,
    loginForm,
    setLoginForm,
    login,
    logout
  }
}
