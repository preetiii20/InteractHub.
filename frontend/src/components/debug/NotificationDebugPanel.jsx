import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bug, Send, Check, Trash2, Users, Calendar } from 'lucide-react';
import { notificationDebug } from '../../utils/notificationDebug';

const NotificationDebugPanel = ({ currentUserId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [testUserId, setTestUserId] = useState('2');
  const [meetingTitle, setMeetingTitle] = useState('Debug Test Meeting');
  const [participants, setParticipants] = useState('2,3,20');
  const [results, setResults] = useState([]);

  const addResult = (message, type = 'info') => {
    const result = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    };
    setResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
  };

  const testNotificationStorage = () => {
    try {
      const notification = notificationDebug.testNotificationStorage(testUserId);
      addResult(`✅ Test notification sent to user ${testUserId}`, 'success');
    } catch (error) {
      addResult(`❌ Error: ${error.message}`, 'error');
    }
  };

  const checkNotifications = () => {
    try {
      const notifications = notificationDebug.checkNotifications(testUserId);
      addResult(`📬 User ${testUserId} has ${notifications.length} notifications`, 'info');
    } catch (error) {
      addResult(`❌ Error: ${error.message}`, 'error');
    }
  };

  const clearNotifications = () => {
    try {
      notificationDebug.clearNotifications(testUserId);
      addResult(`🗑️ Cleared notifications for user ${testUserId}`, 'success');
    } catch (error) {
      addResult(`❌ Error: ${error.message}`, 'error');
    }
  };

  const testCompleteFlow = async () => {
    try {
      const participantIds = participants.split(',').map(id => id.trim()).filter(id => id);
      addResult(`🚀 Testing complete flow with participants: ${participantIds.join(', ')}`, 'info');
      
      const result = await notificationDebug.testCompleteFlow(currentUserId || 16, participantIds, meetingTitle);
      
      if (result) {
        addResult(`✅ Complete flow test successful! Meeting ID: ${result.meeting.id}`, 'success');
      } else {
        addResult(`❌ Complete flow test failed`, 'error');
      }
    } catch (error) {
      addResult(`❌ Error: ${error.message}`, 'error');
    }
  };

  const sendMeetingNotification = () => {
    try {
      const meetingData = {
        title: meetingTitle,
        date: '2025-12-22',
        time: '14:00',
        jitsiLink: 'https://meet.jit.si/debug-test'
      };
      
      notificationDebug.sendMeetingNotification(testUserId, meetingData);
      addResult(`📬 Meeting notification sent to user ${testUserId}`, 'success');
    } catch (error) {
      addResult(`❌ Error: ${error.message}`, 'error');
    }
  };

  if (!isOpen) {
    return (
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-red-500 text-white p-3 rounded-full shadow-lg hover:bg-red-600 z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Bug className="w-6 h-6" />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed top-4 right-4 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-96 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-red-500 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bug className="w-5 h-5" />
          <h3 className="font-bold">Notification Debug</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:bg-red-600 p-1 rounded"
        >
          ✕
        </button>
      </div>

      {/* Controls */}
      <div className="p-4 space-y-3 border-b border-gray-200">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Test User ID</label>
          <input
            type="text"
            value={testUserId}
            onChange={(e) => setTestUserId(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            placeholder="e.g., 2"
          />
        </div>
        
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Meeting Title</label>
          <input
            type="text"
            value={meetingTitle}
            onChange={(e) => setMeetingTitle(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            placeholder="Debug Test Meeting"
          />
        </div>
        
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Participants (comma-separated)</label>
          <input
            type="text"
            value={participants}
            onChange={(e) => setParticipants(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            placeholder="2,3,20"
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={testNotificationStorage}
            className="flex items-center justify-center gap-1 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
          >
            <Send className="w-3 h-3" />
            Test Storage
          </button>
          
          <button
            onClick={checkNotifications}
            className="flex items-center justify-center gap-1 px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
          >
            <Check className="w-3 h-3" />
            Check Notifs
          </button>
          
          <button
            onClick={sendMeetingNotification}
            className="flex items-center justify-center gap-1 px-2 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600"
          >
            <Calendar className="w-3 h-3" />
            Send Meeting
          </button>
          
          <button
            onClick={clearNotifications}
            className="flex items-center justify-center gap-1 px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        </div>
        
        <button
          onClick={testCompleteFlow}
          className="w-full flex items-center justify-center gap-1 px-2 py-2 bg-indigo-500 text-white rounded text-sm hover:bg-indigo-600"
        >
          <Users className="w-4 h-4" />
          Test Complete Flow
        </button>
      </div>

      {/* Results */}
      <div className="p-4 max-h-48 overflow-y-auto">
        <h4 className="text-xs font-semibold text-gray-700 mb-2">Results:</h4>
        {results.length > 0 ? (
          <div className="space-y-1">
            {results.map(result => (
              <div
                key={result.id}
                className={`text-xs p-2 rounded ${
                  result.type === 'success' ? 'bg-green-50 text-green-700' :
                  result.type === 'error' ? 'bg-red-50 text-red-700' :
                  'bg-blue-50 text-blue-700'
                }`}
              >
                <span className="font-mono text-gray-500">{result.timestamp}</span>
                <br />
                {result.message}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500">No results yet. Click buttons above to test.</p>
        )}
      </div>
    </motion.div>
  );
};

export default NotificationDebugPanel;