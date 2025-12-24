import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Call backend API to send reset email
      const response = await fetch('http://localhost:8081/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (response.ok || data.success) {
        setIsSubmitted(true);
      } else {
        setError(data.error || data.message || 'Failed to send reset email. Please try again.');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Cannot connect to server. Please make sure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-6xl relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center"
      >
        {/* Left side - Illustration */}
        <motion.div 
          className="hidden lg:flex flex-col justify-center items-center"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="relative w-full h-96">
            {/* Professional illustration - Woman with laptop */}
            <svg viewBox="0 0 400 400" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              {/* Background circle */}
              <circle cx="200" cy="200" r="180" fill="#e0e7ff" opacity="0.3" />
              
              {/* Woman figure */}
              <g>
                {/* Head */}
                <circle cx="200" cy="120" r="35" fill="#d4a574" />
                
                {/* Hair */}
                <path d="M 165 120 Q 165 85 200 85 Q 235 85 235 120" fill="#8b6f47" />
                
                {/* Body */}
                <ellipse cx="200" cy="180" rx="40" ry="50" fill="#fef3c7" />
                
                {/* Arms */}
                <ellipse cx="155" cy="170" rx="20" ry="45" fill="#d4a574" transform="rotate(-30 155 170)" />
                <ellipse cx="245" cy="170" rx="20" ry="45" fill="#d4a574" transform="rotate(30 245 170)" />
                
                {/* Laptop */}
                <rect x="120" y="200" width="160" height="100" rx="8" fill="#6366f1" opacity="0.9" />
                <rect x="125" y="205" width="150" height="80" rx="4" fill="#818cf8" />
                <rect x="130" y="210" width="140" height="70" rx="2" fill="#c7d2fe" />
                
                {/* Laptop keyboard */}
                <rect x="120" y="300" width="160" height="15" rx="4" fill="#4f46e5" />
              </g>
              
              {/* Floating elements */}
              <g opacity="0.6">
                <circle cx="320" cy="100" r="8" fill="#fbbf24" />
                <circle cx="330" cy="110" r="6" fill="#fbbf24" />
                <circle cx="340" cy="105" r="7" fill="#fbbf24" />
              </g>
              
              {/* Message bubble */}
              <g>
                <rect x="240" y="140" width="130" height="60" rx="8" fill="#a78bfa" opacity="0.8" />
                <line x1="250" y1="155" x2="360" y2="155" stroke="#ffffff" strokeWidth="2" />
                <line x1="250" y1="170" x2="360" y2="170" stroke="#ffffff" strokeWidth="2" />
                <line x1="250" y1="185" x2="330" y2="185" stroke="#ffffff" strokeWidth="2" />
              </g>
            </svg>

            {/* Animated floating elements */}
            <motion.div
              className="absolute top-20 right-10 w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full shadow-lg"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <motion.div
              className="absolute bottom-20 left-10 w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full shadow-lg"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
            />
          </div>

          <motion.p 
            className="text-center text-gray-300 mt-8 text-lg font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Secure Password Recovery
          </motion.p>
        </motion.div>

        {/* Right side - Form */}
        <motion.div
          className="w-full max-w-md mx-auto"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 p-8 relative overflow-hidden">
          {/* Animated top border */}
          <motion.div
            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
          />

          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg relative overflow-hidden"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0"
                animate={{ x: [-100, 100] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Forgot Password?
            </h2>
            <p className="text-gray-300">
              No worries! Enter your email and we'll send you reset instructions.
            </p>
          </div>

          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 transition-all duration-300 hover:bg-white/10"
                  placeholder="you@company.com"
                  required
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm"
                >
                  {error}
                </motion.div>
              )}

              <motion.button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 group-hover:translate-x-full transition-all duration-500"></div>
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2 relative z-10">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending...
                  </span>
                ) : (
                  <span className="relative z-10">Send Reset Link</span>
                )}
              </motion.button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                >
                  ← Back to Login
                </button>
              </div>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <motion.div 
                className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </motion.div>
              
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Reset Link Generated!
                </h3>
                <p className="text-gray-300">
                  Password reset link has been generated for:
                </p>
                <p className="font-semibold text-blue-400 mt-2">{email}</p>
              </div>

              <motion.div 
                className="p-4 bg-blue-500/20 border border-blue-500/50 rounded-xl text-sm text-gray-300"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <p className="font-semibold mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Check the Admin Console
                </p>
                <ul className="text-left space-y-1 text-xs">
                  <li>• Look for the reset link in the admin-service console</li>
                  <li>• Copy the link that starts with: http://localhost:3000/reset-password?token=...</li>
                  <li>• Paste it in your browser to reset your password</li>
                  <li>• The link expires in 1 hour</li>
                </ul>
              </motion.div>

              <div className="flex gap-3">
                <motion.button
                  onClick={() => setIsSubmitted(false)}
                  className="flex-1 px-4 py-3 border border-blue-400 text-blue-400 font-semibold rounded-lg hover:bg-blue-400/10 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Try Again
                </motion.button>
                <motion.button
                  onClick={() => navigate('/login')}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Back to Login
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Help Section */}
        <motion.p 
          className="text-center text-gray-400 text-xs mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          © 2024 InteractHub. All rights reserved.
        </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
