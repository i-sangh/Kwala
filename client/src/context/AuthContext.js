import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Function to set up axios default headers
    const setAuthToken = (token) => {
        if (token) {
            console.log('Setting auth token:', token.substring(0, 20) + '...');
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            localStorage.setItem('token', token);
        } else {
            console.log('Removing auth token');
            delete axios.defaults.headers.common['Authorization'];
            localStorage.removeItem('token');
        }
    };

    // Check token and load user data
    useEffect(() => {
        const initializeAuth = async () => {
            console.log('Initializing authentication...');
            setLoading(true);
            const token = localStorage.getItem('token');
            
            console.log('Token from localStorage:', token ? token.substring(0, 20) + '...' : 'no token');
            
            if (token) {
                setAuthToken(token);
                try {
                    console.log('Verifying token with backend...');
                    const response = await axios.get(`${API_URL}/api/verify-token`);
                    console.log('Token verification response:', response.data);
                    
                    if (response.data.success) {
                        console.log('Token verification successful');
                        setUser(response.data.user);
                        setIsAuthenticated(true);
                    } else {
                        console.log('Token verification failed');
                        setAuthToken(null);
                        setIsAuthenticated(false);
                        setUser(null);
                    }
                } catch (error) {
                    console.error('Token verification error:', error.response?.data || error.message);
                    setAuthToken(null);
                    setIsAuthenticated(false);
                    setUser(null);
                }
            } else {
                console.log('No token found');
                setIsAuthenticated(false);
                setUser(null);
            }
            setLoading(false);
        };

        initializeAuth();
    }, []);

    const login = async (email, password) => {
        try {
            console.log('Attempting login...');
            const response = await axios.post(`${API_URL}/api/login`, {
                email,
                password,
            });

            console.log('Login response:', response.data);

            if (response.data.success) {
                const { token, user } = response.data;
                console.log('Login successful, setting token and user');
                setAuthToken(token);
                setUser(user);
                setIsAuthenticated(true);
                return response.data;
            }
        } catch (error) {
            console.error('Login error:', error.response?.data || error.message);
            throw error;
        }
    };

    const logout = () => {
        console.log('Logging out');
        setAuthToken(null);
        setUser(null);
        setIsAuthenticated(false);
    };

    const register = async (name, email, phoneNumber, password, country) => {
        try {
            console.log('Attempting registration...');
            const response = await axios.post(`${API_URL}/api/register`, {
                name,
                email,
                phoneNumber,
                password,
                country
            });

            console.log('Registration response:', response.data);

            if (response.data.success) {
                const { token, user } = response.data;
                console.log('Registration successful, setting token and user');
                setAuthToken(token);
                setUser(user);
                setIsAuthenticated(true);
                return response.data;
            }
        } catch (error) {
            console.error('Registration error:', error.response?.data || error.message);
            throw error;
        }
    };

    // Add state debug log
    useEffect(() => {
        console.log('Auth state updated:', {
            isAuthenticated,
            user,
            loading
        });
    }, [isAuthenticated, user, loading]);

    return (
        <AuthContext.Provider value={{ 
            isAuthenticated, 
            user, 
            login, 
            logout,
            register,
            loading 
        }}>
            {!loading ? children : (
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: '100vh' 
                }}>
                    Loading...
                </div>
            )}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === null) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
