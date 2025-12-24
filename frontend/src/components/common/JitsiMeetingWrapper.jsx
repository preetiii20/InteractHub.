import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Video, X, Clock, Users, ExternalLink } from 'lucide-react';

const JitsiMeetingWrapper = ({ 
  meetingLink, 
  meetingTitle, 
  meetingTime, 
  meetingEndTime,
  participants = [],
  onClose 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [showRedirectPrompt, setShowRedirectPrompt] = useState(false);

  useEffect(() => {
    // Simulate Jitsi loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleMeetingEnd = () => {
    setShowRedirectPrompt(true);
  };

  const handleReturnToDashboard = () => {
    if (onClose) {
      onClose();
    }
    // Also close the window if opened in new tab
    if (window.opener) {
      window.close();
    }
  };

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 shadow-lg"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Video className="w-6 h-6" />
            <div>
              <h1 className="text-xl font-bold">{meetingTitle}</h1>
              <p className="text-sm text-blue-100">
                {meetingTime} {meetingEndTime && `- ${meetingEndTime}`}
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReturnToDashboard}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </motion.button>
        </div>
      </motion.div>

      {/* Jitsi Container */}
      <div className="flex-1 relative overflow-hidden">
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ delay: 1 }}
            className="absolute inset-0 bg-slate-900 flex items-center justify-center z-50"
          >
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white text-lg font-semibold">Loading meeting...</p>
            </div>
          </motion.div>
        )}

        <iframe
          src={meetingLink}
          style={{
            width: '100%',
            height: '100%',
            border: 'none'
          }}
          allow="camera; microphone; display-capture; clipboard-read; clipboard-write"
          title="Jitsi Meeting"
          onLoad={() => setIsLoading(false)}
        />
      </div>

      {/* Footer with Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800 text-white p-4 border-t border-slate-700"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {participants && participants.length > 0 && (
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                <span className="text-sm">{participants.length} participant(s)</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <span className="text-sm">{meetingTime}</span>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReturnToDashboard}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Return to Dashboard
          </motion.button>
        </div>
      </motion.div>

      {/* Redirect Prompt Modal */}
      {showRedirectPrompt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Meeting Ended</h3>
            <p className="text-gray-600 mb-6">Thank you for joining the meeting. Would you like to return to the dashboard?</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleReturnToDashboard}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Return to Dashboard
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default JitsiMeetingWrapper;
