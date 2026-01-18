// context/AuthContext.jsx (Updated)
import { createContext, useContext, useState, useEffect } from "react";
//import { TradingProvider } from "./TradingContext";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token') || '');
    const [userData, setUserData] = useState(() => {
        const saved = localStorage.getItem('userData');
        return saved ? JSON.parse(saved) : null;
    });
    const [isOtpSend, setIsOtpSend] = useState(false);
    const [showProfile, setShowProfile] = useState(false);

    const backendUrl = 'http://localhost:3000/'; // Changed from 3000 to 5000 (backend port)

    // Admin state
    const [AuserData, AsetUserData] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        // Check if user is admin based on role
        if (userData && userData.role === 'admin') {
            setIsAdmin(true);
            AsetUserData(userData);
        } else {
            setIsAdmin(false);
            AsetUserData(null);
        }
    }, [userData]);

    // Login function
    const login = async (email, password) => {
        try {
            const response = await fetch(`${backendUrl}api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            // Save token and user data
            setToken(data.token);
            setUserData(data.user);
            
            localStorage.setItem('token', data.token);
            localStorage.setItem('userData', JSON.stringify(data.user));

            toast.success('Login successful!');
            
            return data;
        } catch (error) {
            console.error('Login error:', error);
            toast.error(error.message || 'Login failed');
            throw error;
        }
    };

    // Register function
    const register = async (userData) => {
        try {
            const response = await fetch(`${backendUrl}api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            toast.success('Registration successful! Please verify your email.');
            
            return data;
        } catch (error) {
            console.error('Register error:', error);
            toast.error(error.message || 'Registration failed');
            throw error;
        }
    };

    // Logout function
    const logout = () => {
        setToken('');
        setUserData(null);
        setIsAdmin(false);
        AsetUserData(null);
        
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        
        toast.success('Logged out successfully');
    };

    // Check if user is verified
    const isVerified = userData?.isAccountVerified || false;
    const isKycVerified = userData?.kycStatus === 'approved';

    const value = {
        // Auth state
        isLogin: !!token,
        isVerified,
        isKycVerified,
        isAdmin,
        
        // User data
        userData,
        token,
        AuserData,
        
        // UI state
        backendUrl,
        isOtpSend,
        showProfile,
        
        // Setters
        setIsOtpSend,
        setShowProfile,
        
        // Actions
        login,
        register,
        logout,
        setToken,
        setUserData
    };

    return (
        <AuthContext.Provider value={value}>
                {children}
           
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};