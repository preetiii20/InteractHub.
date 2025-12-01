import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { authHelpers } from '../../config/auth';

const MANAGER_SERVICE_URL = 'http://localhost:8083/api/manager';

const OnboardEmployee = () => {
    const [employeeData, setEmployeeData] = useState({ 
        fullName: '', 
        email: '', 
        phone: '', 
        department: '', 
        roleTitle: '' 
    });
    const [message, setMessage] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleOnboard = async (e) => {
        e.preventDefault();
        setMessage(null);
        setIsSubmitting(true);

        try {
            // Get auth headers for API calls
            const authHeaders = {
                'X-User-Name': authHelpers.getUserEmail() || 'manager',
                'X-User-Role': 'MANAGER',
                'X-Manager-Id': authHelpers.getUserId().toString()
            };

            const response = await axios.post(`${MANAGER_SERVICE_URL}/onboard`, employeeData, { headers: authHeaders });
            
            setMessage({ type: 'success', text: 'Onboarding request created successfully! HR will review and approve.' });
            setEmployeeData({ fullName: '', email: '', phone: '', department: '', roleTitle: '' }); // Clear form
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to create onboarding request. Check console.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEmployeeData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl space-y-6">
            <h1 className="text-3xl font-bold text-ih-dark">Onboard New Team Member</h1>
            <p className="text-gray-600">The employee will receive a system-generated password via email.</p>
            
            {message && (
                <motion.div 
                    className={`p-4 rounded-lg font-medium ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                >
                    {message.text}
                </motion.div>
            )}

            <form onSubmit={handleOnboard} className="bg-white p-6 rounded-xl shadow-lg space-y-5">
                <input type="text" name="fullName" placeholder="Full Name" value={employeeData.fullName} onChange={handleInputChange} required className="w-full p-3 border rounded-lg focus:border-ih-primary transition" />
                <input type="email" name="email" placeholder="Email Address" value={employeeData.email} onChange={handleInputChange} required className="w-full p-3 border rounded-lg focus:border-ih-primary transition" />
                <input type="tel" name="phone" placeholder="Phone Number (Optional)" value={employeeData.phone} onChange={handleInputChange} className="w-full p-3 border rounded-lg focus:border-ih-primary transition" />
                <input type="text" name="department" placeholder="Department" value={employeeData.department} onChange={handleInputChange} required className="w-full p-3 border rounded-lg focus:border-ih-primary transition" />
                <input type="text" name="roleTitle" placeholder="Role/Job Title" value={employeeData.roleTitle} onChange={handleInputChange} required className="w-full p-3 border rounded-lg focus:border-ih-primary transition" />
                
                <motion.button
                    type="submit"
                    className="w-full py-3 text-white font-bold bg-ih-primary rounded-lg hover:bg-indigo-700 transition duration-300 transform"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Processing...' : 'Create Onboarding Request'}
                </motion.button>
            </form>
        </motion.div>
    );
};

export default OnboardEmployee;