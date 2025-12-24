import { motion } from 'framer-motion';
import { Calendar, Clock, Users, Video, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const ChatMeetingCard = ({ 
  meeting = {},
  onJoinClick = null,
  isUpcoming = true
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!meeting || !meeting.title) {
    return null;
  }

  const meetingDate = new Date(meeting.meetingDate);
  const today = new Date();
  const isToday = meetingDate.toDateString() === today.toDateString();
  const isTomorrow = meetingDate.toDateString() === new Date(today.getTime() + 86400000).toDateString();

  const getDateLabel = () => {
    if (isToday) return 'Today';
    if (isTomorrow) return 'Tomorrow';
    return meetingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const participantCount = meeting.participantIds?.length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200 overflow-hidden shadow-md hover:shadow-lg transition-shadow"
    >
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-blue-500 to-cyan-600">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 bg-white/20 rounded-lg">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-lg truncate">{meeting.title}</h3>
              <p className="text-blue-100 text-sm mt-1">
                {getDateLabel()}, {meeting.meetingTime} - {meeting.meetingEndTime}
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setExpanded(!expanded)}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <ChevronDown 
              className={`w-5 h-5 text-white transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
          </motion.button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Meeting Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-gray-700">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-sm">
              <span className="font-semibold">{meeting.meetingTime}</span> - <span className="font-semibold">{meeting.meetingEndTime}</span>
            </span>
          </div>

          {participantCount > 0 && (
            <div className="flex items-center gap-3 text-gray-700">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-sm">
                <span className="font-semibold">{participantCount}</span> participant{participantCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        {meeting.description && expanded && (
          <div className="pt-2 border-t border-blue-200">
            <p className="text-sm text-gray-600">{meeting.description}</p>
          </div>
        )}

        {/* Join Button */}
        {isUpcoming && meeting.jitsiLink && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onJoinClick && onJoinClick(meeting)}
            className="w-full mt-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:shadow-lg flex items-center justify-center gap-2 transition-all"
          >
            <Video className="w-4 h-4" />
            Join Call
          </motion.button>
        )}

        {/* Status Badge */}
        <div className="flex justify-center pt-2">
          {isUpcoming ? (
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
              Upcoming
            </span>
          ) : (
            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
              Completed
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMeetingCard;
