import axios from 'axios';

const ADMIN_SERVICE_URL = 'http://localhost:8081/api';
const EMPLOYEE_SERVICE_URL = 'http://localhost:8084/api/employee';

const setAuthData = (user, role, token) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('role', role);
    if (token) {
        localStorage.setItem('token', token);
    }
};

export const loginUser = async (email, password) => {
    // All authentication through Admin Service (handles ADMIN, MANAGER, HR, EMPLOYEE)
    try {
        console.log('🔐 Logging in via Admin Service...');
        const response = await axios.post(`${ADMIN_SERVICE_URL}/auth/login`, { email, password });
        const { user, role, token } = response.data;
        
        console.log('✅ Login successful for role:', role);
        setAuthData(user, role, token);
        return { user, role, token };
    } catch (error) {
        console.error('❌ Login failed:', error.response?.data);
        throw error.response?.data?.error || 'Login failed.';
    }
};

export const getCurrentRole = () => {
    return localStorage.getItem('role');
};

export const getToken = () => {
    return localStorage.getItem('token');
};

export const logout = () => {
    localStorage.clear();
};