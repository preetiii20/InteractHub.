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

const variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const HRGlobalComms = () => {
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
    const chatSocket = new SockJS(apiConfig.websocketUrl);
    const adminSocket = new SockJS(apiConfig.adminWebsocketUrl);
    const chatClient = new Client({ webSocketFactory: () => chatSocket, reconnectDelay: 5000 });
    const adminClient = new Client({ webSocketFactory: () => adminSocket, reconnectDelay: 5000 });
    
    chatClient.onConnect = () => {
      chatClient.subscribe('/topic/announcements.new', m => {
        try {
          const ann = JSON.parse(m.body || '{}');
          const a = (ann.targetAudience || '').toUpperCase();
          if (['ALL', 'HR', 'ADMIN'].includes(a)) setAnnouncements(prev => [ann, ...prev]);
        } catch {}
      });
      chatClient.subscribe('/topic/polls.new', m => {
        try {
          const poll = JSON.parse(m.body || '{}');
          const a = (poll.targetAudience || '').toUpperCase();
          if (['ALL', 'HR', 'ADMIN'].includes(a)) setPolls(prev => [poll, ...prev]);
        } catch {}
      });
      
      chatClient.subscribe('/topic/announcements.reactions', (msg) => {
        try {
          const reaction = JSON.parse(msg.body || '{}');
          if (reaction.type === 'LIKE') {
            setUserLikes(prev => ({ ...prev, [reaction.announcementId]: reaction.liked }));
            fetchGlobal();
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
          setAnnouncements(prev => prev.filter(item => item.id !== deletion.id));
        } catch (error) {
          console.error('Error processing announcement deletion:', error);
        }
      });
      
      adminClient.subscribe('/topic/polls.deleted', (msg) => {
        try {
          const deletion = JSON.parse(msg.body || '{}');
          setPolls(prev => prev.filter(item => item.id !== deletion.id));
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
      console.log('📡 Fetching HR announcements and polls...');
      const userEmail = localStorage.getItem('userEmail');
      const headers = userEmail ? { 'X-User-Email': userEmail } : {};
      
      const [ra, rp] = await Promise.all([
        apiClient.get(`/admin/announcements/target/ALL`, { headers }),
        apiClient.get(`/admin/polls/target/ALL`, { headers })
      ]);
      console.log('✅ HR announcements loaded:', ra.data?.length || 0);
      console.log('✅ HR polls loaded:', rp.data?.length || 0);
      setAnnouncements(ra.data || []);
      setPolls(rp.data || []);
      loadUserLikes(ra.data || []);
      loadLikeCounts(ra.data || []);
      loadComments(ra.data || []);
      (rp.data || []).forEach(p => refreshPollResults(p.id));
    } catch (error) {
      console.error('❌ Error fetching HR communications:', error);
      setMessage({ type: 'error', text: 'Could not fetch communications.' });
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
      console.log('📤 Creating announcement:', payload);
      await apiClient.post(`/admin/announcements`, payload, { headers });
      setMessage({ type: 'success', text: 'Announcement posted successfully!' });
      setGlobalAnnouncement({ title: '', content: '', type: 'GENERAL' });
      fetchGlobal();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('❌ Error creating announcement:', error);
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
      if (pollData.options.length < 2) { 
        setMessage({ type: 'error', text: 'A poll needs at least two options.' }); 
        return; 
      }
      console.log('📤 Creating poll:', pollData);
      await apiClient.post(`/admin/polls`, pollData, { headers });
      setMessage({ type: 'success', text: 'Poll created successfully!' });
      setGlobalPoll({ question: '', options: [''] });
      fetchGlobal();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('❌ Error creating poll:', error);
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
      <h1 className="text-3xl font-bold text-blue-700">HR Communications</h1>

      {message && (
        <motion.div 
          className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`} 
          initial={{ y: -20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }}
        >
          {message.text}
        </motion.div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-600">
        <h2 className="text-xl font-semibold mb-3">Create Global Announcement</h2>
        <form onSubmit={handleCreateGlobalAnnouncement} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input 
              className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" 
              placeholder="Title" 
              value={globalAnnouncement.title} 
              onChange={e => setGlobalAnnouncement(p => ({ ...p, title: e.target.value }))} 
              required 
            />
            <select 
              className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" 
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
            className="w-full p-3 border rounded-lg h-32 focus:ring-2 focus:ring-blue-500 focus:outline-none" 
            placeholder="Content" 
            value={globalAnnouncement.content} 
            onChange={e => setGlobalAnnouncement(p => ({ ...p, content: e.target.value }))} 
            required 
          />
          <div className="flex justify-end">
            <button 
              type="submit" 
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Post Announcement
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-indigo-600">
        <h2 className="text-xl font-semibold mb-3">Create Global Poll</h2>
        <form onSubmit={handleCreateGlobalPoll} className="space-y-3" onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}>
          <input 
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
            placeholder="Poll Question" 
            value={globalPoll.question} 
            onChange={e => setGlobalPoll(p => ({ ...p, question: e.target.value }))} 
            required 
          />
          <h3 className="font-medium text-sm text-gray-700">Options (Max 4)</h3>
          {(globalPoll.options || []).slice(0, 4).map((opt, idx) => (
            <div key={idx} className="flex gap-2">
              <input 
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
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
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Launch Poll
            </button>
          </div>
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
    </motion.div>
  );
};

export default HRGlobalComms;
