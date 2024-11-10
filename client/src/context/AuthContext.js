import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);

    const register = async (name, email, phoneNumber, password, country) => {
        try {
            const response = await axios.post('http://localhost:5000/api/register', {
                name,
                email,
                phoneNumber,
                password,
                country,
            });

            if (response.data.success) {
                localStorage.setItem('token', response.data.token);
                setUser(response.data.user);
                setIsAuthenticated(true);
                return response.data;
            }
        } catch (error) {
            console.error('Registration error:', error.response?.data || error.message);
            throw error;
        }
    };

    const login = async (email, password) => {
        try {
            const response = await axios.post('http://localhost:5000/api/login', {
                email,
                password,
            });

            if (response.data.success) {
                localStorage.setItem('token', response.data.token);
                setUser(response.data.user);
                setIsAuthenticated(true);
                return response.data;
            }
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ 
            isAuthenticated, 
            user, 
            login, 
            register, 
            logout 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);