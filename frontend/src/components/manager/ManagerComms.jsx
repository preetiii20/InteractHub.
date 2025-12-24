import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { motion } from 'framer-motion';
import apiConfig from '../../config/api';
import { authHelpers } from '../../config/auth';
import apiClient from '../../services/apiClient';
import AnnouncementList from '../shared/AnnouncementList';
import PollList from '../shared/PollList';

const VALID_AUDIENCES = ['ALL', 'HR', 'MANAGER', 'EMPLOYEE', 'ADMIN'];
const variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const ManagerComms = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [polls, setPolls] = useState([]);
  const [globalAnnouncement, setGlobalAnnouncement] = useState({ title: '', content: '', type: 'GENERAL' });
  const [globalPoll, setGlobalPoll] = useState({ question: '', options: [''] });
  const [message, setMessage] = useState(null);
  const [userLikes, setUserLikes] = useState({});
  const [likeCounts, setLikeCounts] = useState({});
  const [comments, setComments] = useState({});
  const [pollResults, setPollResults] = useState({});
  const [userVotes, setUserVotes] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});
  const [pollChoice, setPollChoice] = useState({});

  const stompRef = useRef(null);
  const myName = authHelpers.getUserName();

  useEffect(() => {
    fetchGlobal();
    // Use chat service WebSocket for likes/comments, admin service WebSocket for deletions
    const chatSocket = new SockJS(apiConfig.websocketUrl);
    const adminSocket = new SockJS(apiConfig.adminWebsocketUrl);
    const chatClient = new Client({ webSocketFactory: () => chatSocket, reconnectDelay: 5000 });
    const adminClient = new Client({ webSocketFactory: () => adminSocket, reconnectDelay: 5000 });
    
    // Chat service WebSocket for likes/comments and new items
    chatClient.onConnect = () => {
      chatClient.subscribe('/topic/announcements.new', m => {
        try {
          const ann = JSON.parse(m.body || '{}');
          const a = (ann.targetAudience || '').toUpperCase();
          if (['ALL', 'MANAGER', 'ADMIN'].includes(a)) setAnnouncements(prev => [ann, ...prev]);
        } catch {}
      });
      chatClient.subscribe('/topic/polls.new', m => {
        try {
          const poll = JSON.parse(m.body || '{}');
          const a = (poll.targetAudience || '').toUpperCase();
          if (['ALL', 'MANAGER', 'ADMIN'].includes(a)) setPolls(prev => [poll, ...prev]);
        } catch {}
      });
      
      // Subscribe to general announcement reactions
      chatClient.subscribe('/topic/announcements.reactions', (msg) => {
        try {
          const reaction = JSON.parse(msg.body || '{}');
          if (reaction.type === 'LIKE') {
            // Update like status for the specific announcement
            setUserLikes(prev => ({ ...prev, [reaction.announcementId]: reaction.liked }));
            fetchGlobal();
          } else if (reaction.type === 'COMMENT') {
            // Refresh data when new comment is added
            console.log('Comment reaction received in manager:', reaction);
            fetchGlobal();
          }
        } catch (error) {
          console.error('Error processing announcement reaction in manager:', error);
        }
      });
    };
    
    // Admin service WebSocket for deletions
    adminClient.onConnect = () => {
      // Subscribe to deletion events
      adminClient.subscribe('/topic/announcements.deleted', (msg) => {
        try {
          const deletion = JSON.parse(msg.body || '{}');
          console.log('Announcement deleted in manager:', deletion);
          // Remove the deleted announcement from the list
          setAnnouncements(prev => prev.filter(item => item.id !== deletion.id));
        } catch (error) {
          console.error('Error processing announcement deletion in manager:', error);
        }
      });
      
      adminClient.subscribe('/topic/polls.deleted', (msg) => {
        try {
          const deletion = JSON.parse(msg.body || '{}');
          console.log('Poll deleted in manager:', deletion);
          // Remove the deleted poll from the list
          setPolls(prev => prev.filter(item => item.id !== deletion.id));
        } catch (error) {
          console.error('Error processing poll deletion in manager:', error);
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

  // Subscribe to individual announcement like and comment updates when announcements change
  useEffect(() => {
    if (stompRef.current && stompRef.current.chat && stompRef.current.chat.connected) {
      announcements.forEach(ann => {
        if (ann.id) {
          // Subscribe to likes
          stompRef.current.chat.subscribe(`/topic/announcement.${ann.id}.likes`, (msg) => {
            const count = parseInt(msg.body) || 0;
            // Refresh data to get updated like counts
            fetchGlobal();
          });
          
          // Subscribe to comments
          stompRef.current.chat.subscribe(`/topic/announcement.${ann.id}.comments`, (msg) => {
            console.log('New comment received for announcement', ann.id, ':', msg.body);
            // Refresh data to get updated comments
            fetchGlobal();
          });
        }
      });
    }
  }, [announcements]);

  const fetchGlobal = async () => {
    try {
      const userEmail = localStorage.getItem('userEmail');
      const headers = userEmail ? { 'X-User-Email': userEmail } : {};
      
      const [ra, rp] = await Promise.all([
        apiClient.get(`/admin/announcements/target/ALL`, { headers }),
        apiClient.get(`/admin/polls/target/ALL`, { headers })
      ]);
      console.log('✅ Manager announcements loaded:', ra.data?.length || 0);
      console.log('✅ Manager polls loaded:', rp.data?.length || 0);
      setAnnouncements(ra.data || []);
      setPolls(rp.data || []);
      
      // Load user's current like status for all announcements
      loadUserLikes(ra.data || []);
      loadLikeCounts(ra.data || []);
      loadComments(ra.data || []);
      (rp.data || []).forEach(p => refreshPollResults(p.id));
    } catch (error) {
      console.error('❌ Error fetching manager communications:', error);
      setMessage({ type: 'error', text: 'Could not fetch Admin communications.' });
    }
  };

  const loadUserLikes = async (announcementsList) => {
    const currentUser = authHelpers.getUserName() || 'User';
    const likes = {};
    
    for (const ann of announcementsList) {
      try {
        const base = apiConfig.chatService.replace('/api/chat','/api/interactions');
        const response = await fetch(`${base}/announcement/${ann.id}/interactions`);
        const interactions = await response.json();
        const userLike = interactions.find(i => 
          i.userName === currentUser && i.type === 'LIKE'
        );
        likes[ann.id] = !!userLike;
      } catch (error) {
        console.error(`Error loading likes for announcement ${ann.id}:`, error);
        likes[ann.id] = false;
      }
    }
    
    setUserLikes(likes);
  };

  const loadLikeCounts = async (announcementsList) => {
    const counts = {};
    
    for (const ann of announcementsList) {
      try {
        const base = apiConfig.chatService.replace('/api/chat','/api/interactions');
        const response = await fetch(`${base}/announcement/${ann.id}/likes/count`);
        const result = await response.json();
        counts[ann.id] = result.count || 0;
      } catch (error) {
        counts[ann.id] = 0;
      }
    }
    
    setLikeCounts(counts);
  };

  const loadComments = async (announcementsList) => {
    const allComments = {};
    
    for (const ann of announcementsList) {
      try {
        const base = apiConfig.chatService.replace('/api/chat','/api/interactions');
        const response = await fetch(`${base}/announcement/${ann.id}/interactions`);
        const interactions = await response.json();
        const commentList = interactions.filter(i => i.type === 'COMMENT');
        allComments[ann.id] = commentList;
      } catch (error) {
        allComments[ann.id] = [];
      }
    }
    
    setComments(allComments);
  };

  const refreshPollResults = async (pollId) => {
    try {
      const base = apiConfig.chatService.replace('/api/chat','/api/interactions');
      const res = await fetch(`${base}/poll/${pollId}/results`);
      const results = await res.json();
      setPollResults(prev => ({ ...prev, [pollId]: results || { totalVotes: 0, optionCounts: {} } }));
    } catch {}
  };

  const handleCreateGlobalAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const userEmail = localStorage.getItem('userEmail');
      const headers = userEmail ? { 'X-User-Email': userEmail } : {};
      
      const payload = {
        title: globalAnnouncement.title,
        content: globalAnnouncement.content,
        type: (globalAnnouncement.type || 'GENERAL').toUpperCase(),
        targetAudience: 'ALL',
        createdByName: myName
      };
      await apiClient.post(`/admin/announcements`, payload, { headers });
      setMessage({ type: 'success', text: 'Announcement posted.' });
      setGlobalAnnouncement({ title: '', content: '', type: 'GENERAL' });
      fetchGlobal();
    } catch (error) {
      setMessage({ type: 'error', text: error?.response?.data?.error || 'Failed to post announcement.' });
    }
  };

  const handleCreateGlobalPoll = async (e) => {
    e.preventDefault();
    try {
      const userEmail = localStorage.getItem('userEmail');
      const headers = userEmail ? { 'X-User-Email': userEmail } : {};
      
      const pollData = {
        question: globalPoll.question,
        options: (globalPoll.options || []).filter(o => (o || '').trim() !== ''),
        targetAudience: 'ALL',
        createdByName: myName,
        isActive: true
      };
      if (pollData.options.length < 2) { setMessage({ type: 'error', text: 'A poll needs at least two options.' }); return; }
      await apiClient.post(`/admin/polls`, pollData, { headers });
      setMessage({ type: 'success', text: 'Poll created.' });
      setGlobalPoll({ question: '', options: [''] });
      fetchGlobal();
    } catch (error) {
      setMessage({ type: 'error', text: error?.response?.data?.error || 'Failed to create poll.' });
    }
  };

  const handlePollOptionChange = (index, value) => {
    const next = [...(globalPoll.options || [])];
    next[index] = value;
    setGlobalPoll(p => ({ ...p, options: next }));
  };

  const likeAnnouncement = async (ann) => {
    try {
      const base = apiConfig.chatService.replace('/api/chat','/api/interactions');
      const response = await fetch(`${base}/announcement/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcementId: ann.id, userName: authHelpers.getUserName() || 'User', type: 'LIKE' })
      });
      
      if (!response.ok) return;
      
      const result = await response.json();
      setUserLikes(prev => ({ ...prev, [ann.id]: result.liked }));
      fetchGlobal();
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const commentAnnouncement = async (ann, text) => {
    const content = String(text || '').trim();
    if (!content) return;
    try {
      const base = apiConfig.chatService.replace('/api/chat','/api/interactions');
      await fetch(`${base}/announcement/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcementId: ann.id, userName: authHelpers.getUserName() || 'User', content, type: 'COMMENT' })
      });
      setCommentDrafts(p => ({ ...p, [ann.id]: '' }));
      loadComments([ann]);
    } catch {}
  };

  const votePoll = async (poll, selected) => {
    if (!selected) return;
    try {
      const base = apiConfig.chatService.replace('/api/chat','/api/interactions');
      await fetch(`${base}/poll/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId: poll.id, voterName: authHelpers.getUserName() || 'User', selectedOption: selected })
      });
      setPollChoice(p => ({ ...p, [poll.id]: '' }));
      setUserVotes(p => ({ ...p, [poll.id]: selected }));
      refreshPollResults(poll.id);
    } catch {}
  };

  const deleteAnnouncement = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      const userEmail = localStorage.getItem('userEmail');
      const headers = userEmail ? { 'X-User-Email': userEmail } : {};
      const userName = authHelpers.getUserName() || 'User';
      await apiClient.delete(`/admin/announcements/${id}`, {
        headers: { 'X-User-Name': userName, ...headers }
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
      const userEmail = localStorage.getItem('userEmail');
      const headers = userEmail ? { 'X-User-Email': userEmail } : {};
      const userName = authHelpers.getUserName() || 'User';
      await apiClient.delete(`/admin/polls/${id}`, {
        headers: { 'X-User-Name': userName, ...headers }
      });
      setMessage({ type: 'success', text: 'Poll deleted successfully.' });
      fetchGlobal();
    } catch (err) {
      setMessage({ type: 'error', text: err?.response?.data?.error || 'Failed to delete poll' });
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <h1 className="text-3xl font-bold text-blue-700">Manager Communications</h1>

      <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-600">
        <h2 className="text-xl font-semibold mb-3 text-gray-800">Create Global Announcement</h2>
        <form onSubmit={handleCreateGlobalAnnouncement} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Title" value={globalAnnouncement.title} onChange={e => setGlobalAnnouncement(p => ({ ...p, title: e.target.value }))} required />
            <select className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" value={globalAnnouncement.type} onChange={e => setGlobalAnnouncement(p => ({ ...p, type: e.target.value }))}>
              <option value="GENERAL">GENERAL</option><option value="URGENT">URGENT</option>
              <option value="POLICY">POLICY</option><option value="EVENT">EVENT</option><option value="UPDATE">UPDATE</option>
            </select>
          </div>
          <textarea className="w-full p-2 border border-gray-300 rounded h-24 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Content" value={globalAnnouncement.content} onChange={e => setGlobalAnnouncement(p => ({ ...p, content: e.target.value }))} required />
          <div className="flex justify-end"><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Post Announcement</button></div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-indigo-600">
        <h2 className="text-xl font-semibold mb-3 text-gray-800">Create Global Poll</h2>
        <form onSubmit={handleCreateGlobalPoll} className="space-y-3" onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}>
          <input className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Poll Question" value={globalPoll.question} onChange={e => setGlobalPoll(p => ({ ...p, question: e.target.value }))} required />
          <h3 className="font-medium text-sm text-gray-700">Options (Max 4)</h3>
          {(globalPoll.options || []).slice(0, 4).map((opt, idx) => (
            <div key={idx} className="flex gap-2">
              <input className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder={`Option ${idx + 1}`} value={opt} onChange={e => handlePollOptionChange(idx, e.target.value)} />
              {idx === (globalPoll.options?.length || 0) - 1 && (globalPoll.options?.length || 0) < 4 && (
                <button type="button" className="px-2 border border-gray-300 rounded hover:bg-gray-100 transition" onClick={() => setGlobalPoll(p => ({ ...p, options: [...(p.options || []), ''] }))}>+</button>
              )}
            </div>
          ))}
          <div className="flex justify-end"><button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition">Launch Poll</button></div>
        </form>
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-blue-700 border-b-2 border-blue-600 pb-2">Announcements</h2>
        <AnnouncementList 
          items={announcements} 
          onLike={likeAnnouncement} 
          onComment={commentAnnouncement} 
          onDelete={deleteAnnouncement} 
          drafts={commentDrafts} 
          setDrafts={setCommentDrafts} 
          userLikes={userLikes} 
          likeCounts={likeCounts} 
          comments={comments} 
          stompClient={stompRef.current?.chat}
          theme="blue"
        />
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-indigo-700 border-b-2 border-indigo-600 pb-2">Polls</h2>
        <PollList 
          items={polls} 
          resultsMap={pollResults} 
          onVote={votePoll} 
          onDelete={deletePoll} 
          choice={pollChoice} 
          setChoice={setPollChoice} 
          userVotes={userVotes}
          theme="blue"
        />
      </div>

      {message && (
        <motion.div className={`p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'}`} initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          {message.text}
        </motion.div>
      )}
    </motion.div>
  );
};

export default ManagerComms;
