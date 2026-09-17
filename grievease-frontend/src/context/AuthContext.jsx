import { createContext, useContext, useState } from 'react';
import API from '../services/api';
import { socket } from '../services/socket';

const AuthContext = createContext();

const getStoredUser = () => {
  try {
    return JSON.parse(sessionStorage.getItem('user')) || null;
  } catch {
    sessionStorage.removeItem('user');
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  // Session storage intentionally clears when the browser/app session is closed.
  // Remove the old persistent values once so a previous login cannot be restored.
  const [user, setUser] = useState(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    return getStoredUser();
  });
  const [token, setToken] = useState(() => sessionStorage.getItem('token') || null);
  const [loading, setLoading] = useState(false);

  // Login handler
  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await API.post('/auth/login', { email, password });
      
      const userData = { _id: data._id, name: data.name, email: data.email, role: data.role, assignedStation: data.assignedStation || null };
      setUser(userData);
      setToken(data.token);

      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('user', JSON.stringify(userData));
      return { success: true, role: data.role };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  // Register handler (Supports Student, Staff, Parent)
  const register = async (formData) => {
    setLoading(true);
    try {
      const { data } = await API.post('/auth/register', formData);
      
      const userData = { _id: data._id, name: data.name, email: data.email, role: data.role, assignedStation: data.assignedStation || null };
      setUser(userData);
      setToken(data.token);

      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('user', JSON.stringify(userData));
      return { success: true, role: data.role };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const logout = () => {
    socket.disconnect();
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// This hook intentionally shares the context declared above.
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
