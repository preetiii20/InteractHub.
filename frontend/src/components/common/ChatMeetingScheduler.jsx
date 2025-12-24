import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, X, Users, Send } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { authHelpers } from '../../config/auth';
import globalNotificationService from '../../services/GlobalNotificationService';

const ChatMeetingScheduler = ({ 
  recipientName = '', 
  recipientId = null,
  onMeetingScheduled = null,
  isDm = false,
  groupMembers = []
}) => {
  const [showScheduler, setShowScheduler] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '10:00',
    endTime: '11:00',
    description: ''
  });
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [loading, setLoading] = useState(false);

  const currentUserId = Number(authHelpers.getUserId());

  // Get participants list
  const getParticipantsList = () => {
    if (isDm && recipientId) {
      return [recipientId];
    } else {
      return selectedParticipants.length > 0 ? selectedParticipants : [];
    }
  };

  const handleScheduleMeeting = async () => {
    if (!formData.title.trim()) {
      alert('Please enter a meeting title');
      return;
    }

    if (!formData.date) {
      alert('Please select a date');
      return;
    }

    let participants = getParticipantsList();
    if (participants.length === 0) {
      alert('Please select at least one participant');
      return;
    }

    // If participant is an email, try to fetch the user ID
    if (isDm && participants.length === 1 && participants[0].includes('@')) {
      try {
        console.log(`🔍 Fetching user ID for email: ${participants[0]}`);
        const response = await fetch(`http://localhost:8081/api/admin/users/all`);
        if (response.ok) {
          const users = await response.json();
          const user = users.find(u => 
            u.email === participants[0] || 
            u.emailAddress === participants[0]
          );
          if (user) {
            participants = [Number(user.id || user.userId)];
            console.log(`✅ Found user ID: ${participants[0]}`);
          } else {
            alert('Could not find user with that email');
            return;
          }
        }
      } catch (error) {
        console.error('❌ Error fetching user ID:', error);
        alert('Could not fetch user information');
        return;
      }
    } else {
      // Ensure all participant IDs are numbers
      participants = participants.map(p => Number(p)).filter(p => !isNaN(p));
    }

    if (participants.length === 0) {
      alert('Invalid participant IDs');
      return;
    }

    setLoading(true);

    try {
      const meetingData = {
        title: formData.title,
        description: formData.description,
        meetingDate: formData.date,
        meetingTime: formData.time,
        meetingEndTime: formData.endTime,
        jitsiLink: `https://meet.jit.si/${uuidv4().substring(0, 8)}`,
        organizerId: currentUserId,
        organizerRole: 'user',
        participantIds: participants
      };

      console.log('📅 Scheduling meeting from chat:', meetingData);
      console.log('👥 Participant IDs:', participants);

      const userEmail = authHelpers.getUserEmail();
      const response = await fetch('http://localhost:8081/api/admin/meetings/with-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': userEmail || 'user@example.com'
        },
        body: JSON.stringify(meetingData)
      });

      console.log('📥 Backend response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Meeting scheduled successfully:', result);

        // Create notification for organizer
        const notifKey = `notifications_${currentUserId}`;
        const existingNotifs = localStorage.getItem(notifKey);
        const notifs = existingNotifs ? JSON.parse(existingNotifs) : [];

        const notification = {
          id: Date.now() + Math.random(),
          type: 'MEETING_SCHEDULED',
          title: `Meeting Scheduled: ${formData.title}`,
          message: `You have scheduled a meeting "${formData.title}" on ${formData.date} at ${formData.time}`,
          timestamp: new Date().toISOString(),
          read: false,
          data: {
            meetingId: result.meeting?.id,
            meetingTitle: formData.title,
            meetingDate: formData.date,
            meetingTime: formData.time,
            jitsiLink: meetingData.jitsiLink
          }
        };

        notifs.unshift(notification);
        localStorage.setItem(notifKey, JSON.stringify(notifs));

        // Trigger notification update
        window.dispatchEvent(new CustomEvent('notificationsUpdated', {
          detail: { userId: currentUserId }
        }));

        // Broadcast popup notification for organizer ONLY
        console.log('📢 About to broadcast notification. Current listeners:', globalNotificationService.getListenerCount());
        globalNotificationService.broadcast({
          type: 'meeting-scheduled',
          title: `Meeting Scheduled: ${formData.title}`,
          message: `You have scheduled a meeting on ${formData.date} at ${formData.time}`,
          details: `${participants.length} participant(s) invited`,
          data: {
            meetingId: result.meeting?.id,
            meetingTitle: formData.title,
            meetingDate: formData.date,
            meetingTime: formData.time,
            jitsiLink: meetingData.jitsiLink
          }
        }, currentUserId);
        console.log('📢 Broadcast complete. Listeners notified.');

        // Reset form
        setFormData({
          title: '',
          date: '',
          time: '10:00',
          endTime: '11:00',
          description: ''
        });
        setSelectedParticipants([]);
        setShowScheduler(false);

        // Send meeting details to chat
        const meetingMessage = {
          type: 'MEETING_SCHEDULED',
          meetingId: result.meeting?.id,
          title: formData.title,
          date: formData.date,
          time: formData.time,
          endTime: formData.endTime,
          description: formData.description,
          jitsiLink: meetingData.jitsiLink,
          organizerId: currentUserId
        };

        // Callback with meeting data and message info
        if (onMeetingScheduled) {
          onMeetingScheduled({
            meeting: result.meeting,
            message: meetingMessage
          });
        }

        alert('✅ Meeting scheduled successfully!');
      } else {
        const errorText = await response.text();
        console.error('❌ Backend error response:', errorText);
        throw new Error(`Backend returned status ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Error scheduling meeting:', error);
      alert(`Failed to schedule meeting: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Schedule Meeting Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowScheduler(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all"
        title="Schedule a meeting"
      >
        <Calendar className="w-4 h-4" />
        <span className="text-sm font-semibold">Schedule Call</span>
      </motion.button>

      {/* Scheduler Modal */}
      <AnimatePresence>
        {showScheduler && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full max-h-96 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-blue-600" />
                  Schedule Meeting
                </h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowScheduler(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </motion.button>
              </div>

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Meeting Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Team Sync"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time</label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">End Time</label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Participants (for group chats) */}
                {!isDm && groupMembers.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Participants
                    </label>
                    <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gray-50">
                      {groupMembers.map((member) => (
                        <label key={member} className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={selectedParticipants.includes(member)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedParticipants([...selectedParticipants, member]);
                              } else {
                                setSelectedParticipants(selectedParticipants.filter(p => p !== member));
                              }
                            }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{member}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description (Optional)</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add meeting details..."
                    rows="2"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                {/* Recipient Info (for DM) */}
                {isDm && recipientName && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700">
                      <span className="font-semibold">Meeting with:</span> {recipientName}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowScheduler(false)}
                    className="flex-1 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleScheduleMeeting}
                    disabled={loading}
                    className="flex-1 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold rounded-lg hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Scheduling...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Schedule
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatMeetingScheduler;
