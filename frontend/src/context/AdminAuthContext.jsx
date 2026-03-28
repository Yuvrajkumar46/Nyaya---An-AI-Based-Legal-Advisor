import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api'; // using same axios instance

const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
    // CRITICAL: start as TRUE — never false until check is done
    const [adminLoading, setAdminLoading] = useState(true);
    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
    const [adminUser, setAdminUser] = useState(null);

    useEffect(() => {
        const checkAdminAuth = () => {
            try {
                // Print ALL localStorage keys to find admin token
                console.log('=== ALL LOCALSTORAGE KEYS ===');
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    console.log(`${key}: ${localStorage.getItem(key)?.substring(0, 50)}...`);
                }
                console.log('=== END LOCALSTORAGE ===');

                // Check ALL possible token key names
                const token =
                    localStorage.getItem('adminToken') ||
                    localStorage.getItem('admin_token') ||
                    localStorage.getItem('nyaya_admin_token') ||
                    localStorage.getItem('adminAccessToken');

                const savedAdmin =
                    localStorage.getItem('adminUser') ||
                    localStorage.getItem('admin_user') ||
                    localStorage.getItem('nyaya_admin_user');

                console.log('Admin token found:', token ? 'YES' : 'NO');
                console.log('Admin token key check complete');

                if (token) {
                    setIsAdminAuthenticated(true);
                    if (savedAdmin && savedAdmin !== 'undefined') {
                        try {
                            setAdminUser(JSON.parse(savedAdmin));
                        } catch (e) {
                            console.error('Failed to parse admin user:', e);
                        }
                    }
                } else {
                    setIsAdminAuthenticated(false);
                }
            } catch (err) {
                console.error('Admin auth check failed:', err);
                setIsAdminAuthenticated(false);
            } finally {
                // CRITICAL: always set loading to false
                setAdminLoading(false);
            }
        };

        checkAdminAuth();
    }, []);

    const loginAdmin = async (username, password) => {
        try {
            const res = await api.post('/v1/admin/auth/login', { username, password });
            const data = res.data;

            console.log('=== ADMIN LOGIN RESPONSE ===');
            console.log('success:', data.success);
            console.log('token key:', data.token ? 'data.token' : data.access_token ? 'data.access_token' : 'NOT FOUND');

            // Accept either field name the backend returns
            const tokenValue = data.token || data.access_token || data.accessToken;
            const adminData = data.admin || data.user || {};

            if (tokenValue) {
                // Store under ALL possible key names — belt AND suspenders
                ['adminToken', 'admin_token', 'nyaya_admin_token'].forEach(key =>
                    localStorage.setItem(key, tokenValue)
                );
                localStorage.setItem('adminUser', JSON.stringify(adminData));

                console.log('adminToken stored:', tokenValue.substring(0, 40) + '...');

                setIsAdminAuthenticated(true);
                setAdminUser(adminData);
                return { success: true };
            } else {
                console.error('Login response missing token! Full response:', data);
                return { success: false, message: data.message || 'No token in response' };
            }
        } catch (error) {
            console.error('Admin login error:', error.response?.data || error.message);
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed'
            };
        }
    };

    const logoutAdmin = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('admin_token');
        localStorage.removeItem('adminUser');
        localStorage.removeItem('admin_user');
        setIsAdminAuthenticated(false);
        setAdminUser(null);
    };

    return (
        <AdminAuthContext.Provider value={{
            isAdminAuthenticated,
            adminLoading,
            adminUser,
            loginAdmin,
            logoutAdmin
        }}>
            {children}
        </AdminAuthContext.Provider>
    );
};

export const useAdminAuth = () => {
    const context = useContext(AdminAuthContext);
    if (!context) {
        throw new Error('useAdminAuth must be used within AdminAuthProvider');
    }
    return context;
};

export default AdminAuthContext;
