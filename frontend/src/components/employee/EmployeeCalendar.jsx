import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, X, Clock, AlertCircle, Video, Users } from 'lucide-react';
import { authHelpers } from '../../config/auth';
import JitsiMeetingWrapper from '../common/JitsiMeetingWrapper';

const EmployeeCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', type: 'personal' });
  const [editingId, setEditingId] = useState(null);
  const [viewingEvent, setViewingEvent] = useState(null);
  const [activeMeeting, setActiveMeeting] = useState(null);

  // Load events from backend API and localStorage
  useEffect(() => {
    const loadEvents = async () => {
      const userId = Number(authHelpers.getUserId());
      
      // Load personal events from localStorage
      const saved = localStorage.getItem('employeeCalendarEvents');
      const localEvents = saved ? JSON.parse(saved) : [];
      
      try {
        // Fetch meetings from backend API
        console.log(`📅 Fetching meetings for employee user ${userId} from backend...`);
        const response = await fetch(`http://localhost:8081/api/admin/meetings/user/${userId}`);
        
        if (response.ok) {
          const backendMeetings = await response.json();
          console.log(`✅ Loaded ${backendMeetings.length} meetings from backend for employee ${userId}`);
          
          // Convert backend meetings to calendar events format
          const convertedEvents = backendMeetings.map(meeting => ({
            id: meeting.id,
            date: meeting.meetingDate,
            title: meeting.title,
            description: meeting.description,
            type: 'meeting',
            time: meeting.meetingTime,
            endTime: meeting.meetingEndTime,
            isMeeting: true,
            jitsiLink: meeting.jitsiLink,
            participants: [],
            participantIds: meeting.participantIds || [],
            organizerId: meeting.organizerId,
            createdAt: meeting.createdAt,
            isBackendMeeting: true
          }));
          
          // Merge with local events
          const allEvents = [...convertedEvents, ...localEvents];
          setEvents(allEvents);
          console.log(`📊 Total events loaded: ${allEvents.length} (${convertedEvents.length} meetings, ${localEvents.length} personal)`);
        } else {
          console.log('⚠️ Backend not available, using localStorage only');
          setEvents(localEvents);
        }
      } catch (error) {
        console.log('⚠️ Error fetching meetings from backend:', error.message);
        setEvents(localEvents);
      }
    };

    loadEvents();
    const interval = setInterval(loadEvents, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Save only personal events to localStorage (not backend meetings)
  useEffect(() => {
    const personalEvents = events.filter(e => !e.isBackendMeeting);
    localStorage.setItem('employeeCalendarEvents', JSON.stringify(personalEvents));
  }, [events]);

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const getEventsForDate = (day) => {
    if (!day) return [];
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const handleAddEvent = (day) => {
    setSelectedDate(day);
    setFormData({ title: '', description: '', type: 'personal' });
    setEditingId(null);
    setShowModal(true);
  };

  const handleSaveEvent = () => {
    if (!formData.title.trim()) return;

    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;

    if (editingId) {
      setEvents(events.map(e => e.id === editingId ? { ...e, ...formData, date: dateStr } : e));
    } else {
      setEvents([...events, { id: Date.now(), date: dateStr, ...formData }]);
    }

    setShowModal(false);
    setFormData({ title: '', description: '', type: 'personal' });
  };

  const handleDeleteEvent = (id) => {
    const eventToDelete = events.find(e => e.id === id);
    
    if (eventToDelete && eventToDelete.isBackendMeeting) {
      alert('You cannot delete meetings that were scheduled by others. Only the meeting organizer can delete this meeting.');
      return;
    }
    
    setEvents(events.filter(e => e.id !== id));
  };

  const handleEditEvent = (event) => {
    setSelectedDate(parseInt(event.date.split('-')[2]));
    setFormData({ title: event.title, description: event.description, type: event.type });
    setEditingId(event.id);
    setShowModal(true);
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const typeColors = {
    personal: { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-700', badge: 'bg-blue-500' },
    important: { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-700', badge: 'bg-red-500' },
    reminder: { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-700', badge: 'bg-yellow-500' },
    holiday: { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-700', badge: 'bg-green-500' },
    meeting: { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-700', badge: 'bg-purple-500' }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Calendar</h1>
          <p className="text-gray-600 mt-1">Manage your personal events and important dates</p>
        </div>
      </motion.div>

      {/* Main Calendar Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-8">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={previousMonth}
              className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-blue-600" />
            </motion.button>

            <h2 className="text-2xl font-bold text-gray-800">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={nextMonth}
              className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-blue-600" />
            </motion.button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-semibold text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, idx) => {
              const dayEvents = day ? getEventsForDate(day) : [];
              const isToday = day && new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

              return (
                <motion.div
                  key={idx}
                  whileHover={day ? { scale: 1.05 } : {}}
                  onClick={() => day && handleAddEvent(day)}
                  className={`min-h-24 p-2 rounded-lg border-2 transition-all cursor-pointer ${
                    day
                      ? isToday
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-blue-300'
                      : 'bg-gray-50 border-gray-100'
                  }`}
                >
                  {day && (
                    <>
                      <div className={`text-sm font-bold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                        {day}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map(event => (
                          <motion.div
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingEvent(event);
                            }}
                            className={`text-xs px-2 py-1 rounded truncate cursor-pointer hover:shadow-md ${typeColors[event.type].bg} ${typeColors[event.type].text} ${event.isMeeting ? 'font-semibold' : ''}`}
                          >
                            {event.isMeeting && <Video className="w-3 h-3 inline mr-1" />}
                            {event.title}
                          </motion.div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-gray-500 px-2">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Sidebar - Upcoming Events */}
        <div className="space-y-6">
          {/* Legend */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
          >
            <h3 className="font-bold text-gray-800 mb-4">Event Types</h3>
            <div className="space-y-3">
              {Object.entries(typeColors).map(([type, colors]) => (
                <div key={type} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${colors.badge}`}></div>
                  <span className="text-sm text-gray-700 capitalize">{type}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Today's Events */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
          >
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Today's Events
            </h3>
            <div className="space-y-3">
              {getEventsForDate(new Date().getDate()).length > 0 ? (
                getEventsForDate(new Date().getDate()).map(event => (
                  <div key={event.id} className={`p-3 rounded-lg border-l-4 ${typeColors[event.type].bg} ${typeColors[event.type].border}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className={`font-semibold text-sm ${typeColors[event.type].text} flex items-center gap-1`}>
                          {event.isMeeting && <Video className="w-3 h-3" />}
                          {event.title}
                        </p>
                        {event.time && <p className="text-xs text-gray-600 mt-1">⏰ {event.time}</p>}
                        {event.description && <p className="text-xs text-gray-600 mt-1">{event.description}</p>}
                      </div>
                      {event.isMeeting && (
                        <motion.button
                          onClick={() => {
                            setActiveMeeting({
                              link: event.jitsiLink,
                              title: event.title,
                              participants: event.participants || []
                            });
                          }}
                          className="ml-2 px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600"
                        >
                          Join
                        </motion.button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No events today</p>
              )}
            </div>
          </motion.div>

          {/* Quick Add */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setSelectedDate(new Date().getDate());
              handleAddEvent(new Date().getDate());
            }}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Event Today
          </motion.button>
        </div>
      </motion.div>

      {/* Modal */}
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                {editingId ? 'Edit Event' : 'Add Event'}
              </h3>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-6 h-6 text-gray-600" />
              </motion.button>
            </div>

            <div className="space-y-4">
              {/* Date Display */}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-semibold text-gray-800">
                  {monthNames[currentDate.getMonth()]} {selectedDate}, {currentDate.getFullYear()}
                </p>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Event Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter event title"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add notes or details"
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Event Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="personal">Personal</option>
                  <option value="important">Important</option>
                  <option value="reminder">Reminder</option>
                  <option value="holiday">Holiday</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                {editingId && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      handleDeleteEvent(editingId);
                      setShowModal(false);
                    }}
                    className="flex-1 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveEvent}
                  className="flex-1 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Event Viewing Modal */}
      {viewingEvent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setViewingEvent(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                {viewingEvent.isMeeting && <Video className="w-6 h-6 text-purple-600" />}
                {viewingEvent.title}
              </h3>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewingEvent(null)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-6 h-6 text-gray-600" />
              </motion.button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600"><span className="font-semibold">Date:</span> {viewingEvent.date}</p>
              {viewingEvent.time && (
                <p className="text-sm text-gray-600"><span className="font-semibold">Time:</span> {viewingEvent.time} - {viewingEvent.endTime}</p>
              )}
              {viewingEvent.description && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Description</p>
                  <p className="text-sm text-gray-600">{viewingEvent.description}</p>
                </div>
              )}
              {viewingEvent.isMeeting && (
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm font-semibold text-purple-700 mb-1 flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    Meeting Details
                  </p>
                  <p className="text-xs text-purple-600">
                    {viewingEvent.isBackendMeeting ? 'You are invited to this meeting' : 'Personal meeting'}
                  </p>
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                {viewingEvent.isMeeting && viewingEvent.jitsiLink && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setActiveMeeting({
                        link: viewingEvent.jitsiLink,
                        title: viewingEvent.title,
                        participants: viewingEvent.participants || []
                      });
                      setViewingEvent(null);
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <Video className="w-5 h-5" />
                    Join Meeting
                  </motion.button>
                )}
                
                {!viewingEvent.isBackendMeeting && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      handleEditEvent(viewingEvent);
                      setViewingEvent(null);
                    }}
                    className="flex-1 py-2 bg-blue-100 text-blue-700 font-semibold rounded-lg hover:bg-blue-200"
                  >
                    Edit
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Meeting Wrapper */}
      {activeMeeting && (
        <div className="fixed inset-0 z-50">
          <JitsiMeetingWrapper
            meetingLink={activeMeeting.link}
            meetingTitle={activeMeeting.title}
            participants={activeMeeting.participants}
            onClose={() => setActiveMeeting(null)}
          />
        </div>
      )}
    </div>
  );
};

export default EmployeeCalendar;
