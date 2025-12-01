import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import AnnouncementCard from './AnnouncementCard';
import PollCard from './PollCard';
import { useToast } from '../common/ToastProvider';
import { authHelpers } from '../../config/auth';
import apiConfig from '../../config/api';

const CompanyUpdates = () => {
  const [activeTab, setActiveTab] = useState('announcements');
  const [announcements, setAnnouncements] = useState([]);
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLikes, setUserLikes] = useState({});
  const { addToast } = useToast();

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const loadUserLikes = async (announcements) => {
    try {
      const base = apiConfig.chatService.replace('/api/chat','/api/interactions');
      const likesMap = {};
      for (const ann of announcements) {
        try {
          const response = await fetch(`${base}/announcement/${ann.id}/likes/check?userName=${authHelpers.getUserName()}`);
          if (response.ok) {
            const data = await response.json();
            likesMap[ann.id] = data.liked || false;
          }
        } catch (e) {
          console.error('Error checking like for announcement:', ann.id, e);
        }
      }
      setUserLikes(likesMap);
    } catch (error) {
      console.error('Error loading user likes:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'announcements') {
        // Fetch directly from Admin Service like Admin Dashboard does
        const response = await axios.get('http://localhost:8081/api/admin/announcements/target/ALL');
        const announcementsData = response.data || [];
        setAnnouncements(announcementsData);
        // Load user likes
        await loadUserLikes(announcementsData);
      } else {
        // Fetch directly from Admin Service like Admin Dashboard does
        const response = await axios.get('http://localhost:8081/api/admin/polls/target/ALL');
        setPolls((response.data || []).filter(p => p.isActive));
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      addToast({ type: 'error', title: 'Error', message: 'Failed to load updates' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Company Updates</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('announcements')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'announcements'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📰 Announcements
          </button>
          <button
            onClick={() => setActiveTab('polls')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'polls'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🗳️ Polls
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : activeTab === 'announcements' ? (
          announcements.length > 0 ? (
            announcements.map((announcement) => (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <AnnouncementCard 
                  announcement={announcement} 
                  userLikes={userLikes} 
                  setUserLikes={setUserLikes}
                />
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">No announcements yet</div>
          )
        ) : polls.length > 0 ? (
          polls.map((poll) => (
            <motion.div
              key={poll.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <PollCard poll={poll} />
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-500">No active polls</div>
        )}
      </div>
    </div>
  );
};

export default CompanyUpdates;

