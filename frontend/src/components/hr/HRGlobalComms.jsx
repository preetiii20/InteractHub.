import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { motion } from 'framer-motion';
import apiConfig from '../../config/api';
import { authHelpers } from '../../config/auth';
import LiveAnnouncementComponent from '../manager/LiveAnnouncementComponent';
import LivePollComponent from '../manager/LivePollComponent';

const variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const HRGlobalComms = () => {
  const [globalComms, setGlobalComms] = useState([]);
  const [globalAnnouncement, setGlobalAnnouncement] = useState({ title: '', content: '', type: 'GENERAL' });
  const [globalPoll, setGlobalPoll] = useState({ question: '', options: [''] });
  const [message, setMessage] = useState(null);
  const [userLikes, setUserLikes] = useState({});

  const stompRef = useRef(null);
  const myName = authHelpers.getUserName();

  useEffect(() => {
    fetchGlobal();
    const chatSocket = new SockJS(apiConfig.websocketUrl);
    const adminSocket = new SockJS(apiConfig.adminWebsocketUrl);
    const chatClient = new Client({ webSocketFactory: () => chatSocket, reconnectDelay: 5000 });
    const adminClient = new Client({ webSocketFactory: () => adminSocket, reconnectDelay: 5000 });
    
    chatClient.onConnect = () => {
      chatClient.subscribe('/topic/announcements.new', m => {
        try {
          const ann = JSON.parse(m.body || '{}');
          const a = (ann.targetAudience || '').toUpperCase();
          if (['ALL', 'HR', 'ADMIN'].includes(a)) setGlobalComms(prev => [ann, ...prev]);
        } catch {}
      });
      chatClient.subscribe('/topic/polls.new', m => {
        try {
          const poll = JSON.parse(m.body || '{}');
          const a = (poll.targetAudience || '').toUpperCase();
          if (['ALL', 'HR', 'ADMIN'].includes(a)) setGlobalComms(prev => [poll, ...prev]);
        } catch {}
      });
      
      chatClient.subscribe('/topic/announcements.reactions', (msg) => {
        try {
          const reaction = JSON.parse(msg.body || '{}');
          if (reaction.type === 'LIKE') {
            setUserLikes(prev => ({ ...prev, [reaction.announcementId]: reaction.liked }));
          } else if (reaction.type === 'COMMENT') {
            fetchGlobal();
          }
        } catch (error) {
          console.error('Error processing announcement reaction:', error);
        }
      });
    };
    
    adminClient.onConnect = () => {
      adminClient.subscribe('/topic/announcements.deleted', (msg) => {
        try {
          const deletion = JSON.parse(msg.body || '{}');
          setGlobalComms(prev => prev.filter(item => !('content' in item) || item.id !== deletion.id));
        } catch (error) {
          console.error('Error processing announcement deletion:', error);
        }
      });
      
      adminClient.subscribe('/topic/polls.deleted', (msg) => {
        try {
          const deletion = JSON.parse(msg.body || '{}');
          setGlobalComms(prev => prev.filter(item => !('question' in item) || item.id !== deletion.id));
        } catch (error) {
          console.error('Error processing poll deletion:', error);
        }
      });
    };
    
    chatClient.activate();
    adminClient.activate();
    stompRef.current = { chat: chatClient, admin: adminClient };
    return () => {
      chatClient.deactivate();
      adminClient.deactivate();
    };
  }, []);

  const fetchGlobal = async () => {
    try {
      const [ra, rp] = await Promise.all([
        axios.get(`${apiConfig.adminService}/announcements/target/ALL`),
        axios.get(`${apiConfig.adminService}/polls/target/ALL`)
      ]);
      setGlobalComms([...(ra.data || []), ...(rp.data || [])]);
      loadUserLikes(ra.data || []);
    } catch {
      setMessage({ type: 'error', text: 'Could not fetch communications.' });
    }
  };

  const loadUserLikes = async (announcements) => {
    const currentUser = authHelpers.getUserName() || 'User';
    const likes = {};
    
    for (const ann of announcements) {
      try {
        const base = apiConfig.chatService.replace('/api/chat','/api/interactions');
        const response = await fetch(`${base}/announcement/${ann.id}/interactions`);
        const interactions = await response.json();
        const userLike = interactions.find(i => 
          i.userName === currentUser && i.type === 'LIKE'
        );
        likes[ann.id] = !!userLike;
      } catch (error) {
        likes[ann.id] = false;
      }
    }
    
    setUserLikes(likes);
  };

  const handleCreateGlobalAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: globalAnnouncement.title,
        content: globalAnnouncement.content,
        type: (globalAnnouncement.type || 'GENERAL').toUpperCase(),
        targetAudience: 'ALL',
        createdByName: myName
      };
      await axios.post(`${apiConfig.adminService}/announcements`, payload);
      setMessage({ type: 'success', text: 'Announcement posted successfully!' });
      setGlobalAnnouncement({ title: '', content: '', type: 'GENERAL' });
      fetchGlobal();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error?.response?.data?.error || 'Failed to post announcement.' });
    }
  };

  const handleCreateGlobalPoll = async (e) => {
    e.preventDefault();
    try {
      const pollData = {
        question: globalPoll.question,
        options: (globalPoll.options || []).filter(o => (o || '').trim() !== ''),
        targetAudience: 'ALL',
        createdByName: myName,
        isActive: true
      };
      if (pollData.options.length < 2) { 
        setMessage({ type: 'error', text: 'A poll needs at least two options.' }); 
        return; 
      }
      await axios.post(`${apiConfig.adminService}/polls`, pollData);
      setMessage({ type: 'success', text: 'Poll created successfully!' });
      setGlobalPoll({ question: '', options: [''] });
      fetchGlobal();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error?.response?.data?.error || 'Failed to create poll.' });
    }
  };

  const handlePollOptionChange = (index, value) => {
    const next = [...(globalPoll.options || [])];
    next[index] = value;
    setGlobalPoll(p => ({ ...p, options: next }));
  };

  const deleteAnnouncement = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      const userName = authHelpers.getUserName() || 'User';
      await axios.delete(`${apiConfig.adminService}/announcements/${id}`, {
        headers: { 'X-User-Name': userName }
      });
      setMessage({ type: 'success', text: 'Announcement deleted successfully.' });
      fetchGlobal();
    } catch (err) {
      setMessage({ type: 'error', text: err?.response?.data?.error || 'Failed to delete announcement' });
    }
  };

  const deletePoll = async (id) => {
    if (!window.confirm('Are you sure you want to delete this poll?')) return;
    try {
      const userName = authHelpers.getUserName() || 'User';
      await axios.delete(`${apiConfig.adminService}/polls/${id}`, {
        headers: { 'X-User-Name': userName }
      });
      setMessage({ type: 'success', text: 'Poll deleted successfully.' });
      fetchGlobal();
    } catch (err) {
      setMessage({ type: 'error', text: err?.response?.data?.error || 'Failed to delete poll' });
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">HR Communications</h1>

      {message && (
        <motion.div 
          className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`} 
          initial={{ y: -20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }}
        >
          {message.text}
        </motion.div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-pink-500">
        <h2 className="text-xl font-semibold mb-3">Create Global Announcement</h2>
        <form onSubmit={handleCreateGlobalAnnouncement} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input 
              className="p-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none" 
              placeholder="Title" 
              value={globalAnnouncement.title} 
              onChange={e => setGlobalAnnouncement(p => ({ ...p, title: e.target.value }))} 
              required 
            />
            <select 
              className="p-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none" 
              value={globalAnnouncement.type} 
              onChange={e => setGlobalAnnouncement(p => ({ ...p, type: e.target.value }))}
            >
              <option value="GENERAL">GENERAL</option>
              <option value="URGENT">URGENT</option>
              <option value="POLICY">POLICY</option>
              <option value="EVENT">EVENT</option>
              <option value="UPDATE">UPDATE</option>
            </select>
          </div>
          <textarea 
            className="w-full p-3 border rounded-lg h-32 focus:ring-2 focus:ring-pink-500 focus:outline-none" 
            placeholder="Content" 
            value={globalAnnouncement.content} 
            onChange={e => setGlobalAnnouncement(p => ({ ...p, content: e.target.value }))} 
            required 
          />
          <div className="flex justify-end">
            <button 
              type="submit" 
              className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
            >
              Post Announcement
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
        <h2 className="text-xl font-semibold mb-3">Create Global Poll</h2>
        <form onSubmit={handleCreateGlobalPoll} className="space-y-3" onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}>
          <input 
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" 
            placeholder="Poll Question" 
            value={globalPoll.question} 
            onChange={e => setGlobalPoll(p => ({ ...p, question: e.target.value }))} 
            required 
          />
          <h3 className="font-medium text-sm text-gray-700">Options (Max 4)</h3>
          {(globalPoll.options || []).slice(0, 4).map((opt, idx) => (
            <div key={idx} className="flex gap-2">
              <input 
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" 
                placeholder={`Option ${idx + 1}`} 
                value={opt} 
                onChange={e => handlePollOptionChange(idx, e.target.value)} 
              />
              {idx === (globalPoll.options?.length || 0) - 1 && (globalPoll.options?.length || 0) < 4 && (
                <button 
                  type="button" 
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors" 
                  onClick={() => setGlobalPoll(p => ({ ...p, options: [...(p.options || []), ''] }))}
                >
                  + Add
                </button>
              )}
            </div>
          ))}
          <div className="flex justify-end">
            <button 
              type="submit" 
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Launch Poll
            </button>
          </div>
        </form>
      </div>

      <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">Live Updates</h2>
      <motion.div 
        className="space-y-4" 
        initial="hidden" 
        animate="show" 
        variants={{ show: { transition: { staggerChildren: 0.1 } } }}
      >
        {globalComms.length > 0 ? globalComms
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
          .map((item, i) => (
            <motion.div key={`${'content' in item ? 'ann' : 'poll'}-${item.id || i}`} variants={variants}>
              {'content' in item
                ? <LiveAnnouncementComponent 
                    announcement={item} 
                    onDelete={deleteAnnouncement} 
                    userLikes={userLikes} 
                    setUserLikes={setUserLikes} 
                    stompClient={stompRef.current?.chat} 
                  />
                : 'question' in item
                  ? <LivePollComponent poll={item} onDelete={deletePoll} />
                  : <div className="p-4 bg-gray-100 rounded">Unsupported item</div>
              }
            </motion.div>
          )) : <p className="text-gray-500 p-4 bg-white rounded-lg">No communications available.</p>}
      </motion.div>
    </motion.div>
  );
};

export default HRGlobalComms;
