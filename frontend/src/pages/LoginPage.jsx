import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/AuthService';
import { authHelpers } from '../config/auth';

const loginVariants = {
  hidden: { opacity: 0, y: -50, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, type: 'spring', stiffness: 100, staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
        const resp = await loginUser(email, password);
        
        // Backend returns: { user: {...}, message: "...", role: "ADMIN" }
        if (resp && resp.user && resp.user.id) {
          const user = resp.user;
          
          authHelpers.setUser({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            name: user.firstName + ' ' + user.lastName,
            role: user.role || resp.role,
            departmentId: user.departmentId || null
          });
          
          // Also set token if provided
          if (resp.token) {
            authHelpers.setToken(resp.token);
          }
        }
        const role = (resp.role || resp.user?.role || 'admin').toLowerCase();
        navigate(`/dashboard/${role}`); 
    } catch (err) {
        setError(typeof err === 'string' ? err : 'An error occurred during login.');
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
      <motion.div
        className="w-full max-w-lg p-10 space-y-8 bg-white rounded-2xl shadow-2xl"
        variants={loginVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="flex flex-col items-center space-y-4" variants={itemVariants}>
            <motion.div 
                className="text-6xl text-ih-primary" 
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, type: "tween" }}
            >
                🏢 
            </motion.div>
            <h2 className="text-4xl font-extrabold text-gray-800">Welcome to InteractHub</h2>
            <p className="text-md text-gray-500">Log in to manage your organization.</p>
        </motion.div>

        <form onSubmit={handleLogin} className="space-y-6">
          
          <motion.div variants={itemVariants}>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-3 border border-gray-300 rounded-lg focus:ring-ih-primary focus:border-ih-primary transition duration-300 shadow-sm"
              placeholder="Enter your email"
              required
            />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-semibold text-gray-700">Password</label>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Forgot Password?
              </button>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-3 border border-gray-300 rounded-lg focus:ring-ih-primary focus:border-ih-primary transition duration-300 shadow-sm"
              placeholder="Enter your password"
              required
            />
          </motion.div>
          
          {error && (
            <motion.p 
                className="text-red-600 text-sm font-medium p-2 bg-red-100 rounded-md"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
            >
                {error}
            </motion.p>
          )}

          <motion.button
            type="submit"
            className="w-full py-3.5 text-white font-bold bg-ih-primary rounded-lg hover:bg-indigo-700 transition duration-300 transform shadow-xl text-lg flex items-center justify-center"
            whileHover={{ scale: 1.02, boxShadow: "0 10px 20px rgba(99, 102, 241, 0.4)" }}
            whileTap={{ scale: 0.98 }}
            variants={itemVariants}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Authenticating...' : 'Access Portal'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default LoginPage;