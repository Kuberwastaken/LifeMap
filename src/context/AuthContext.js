import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '../firebase/config';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
      console.log('Auth state changed:', user ? 'User logged in' : 'No user');
    });
    return unsubscribe;
  }, []);

  const login = async () => {
    console.log('Attempting Google login...');
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user); // Set the user after successful login
      console.log('Login successful:', result.user.displayName);
    } catch (error) {
      console.error('Login error:', error.code, error.message);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null); // Clear user on logout
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error.code, error.message);
    }
  };

  const value = {
    user,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};