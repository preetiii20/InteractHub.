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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="card-gradient p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-white text-3xl mx-auto mb-4 shadow-lg"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🔒
            </motion.div>
            <h2 className="text-3xl font-bold gradient-text mb-2">
              Forgot Password?
            </h2>
            <p className="text-gray-600">
              No worries! Enter your email and we'll send you reset instructions.
            </p>
          </div>

          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-modern"
                  placeholder="Enter your email"
                  required
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-3 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm"
                >
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="spinner w-5 h-5"></div>
                    Sending...
                  </span>
                ) : (
                  'Send Reset Link'
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
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
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-4xl">✅</span>
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Reset Link Generated! 🎉
                </h3>
                <p className="text-gray-600">
                  Password reset link has been generated for:
                </p>
                <p className="font-semibold text-blue-600 mt-2">{email}</p>
              </div>

              <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl text-sm text-gray-700">
                <p className="font-semibold mb-2">📋 Check the Admin Console</p>
                <ul className="text-left space-y-1 text-xs">
                  <li>• Look for the reset link in the admin-service console</li>
                  <li>• Copy the link that starts with: http://localhost:3000/reset-password?token=...</li>
                  <li>• Paste it in your browser to reset your password</li>
                  <li>• The link expires in 1 hour</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="btn-outline flex-1"
                >
                  Try Again
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="btn-primary flex-1"
                >
                  Back to Login
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-center"
        >
          <p className="text-sm text-gray-600">
            Need help?{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
              Contact Support
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
