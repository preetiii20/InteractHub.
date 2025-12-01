import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import apiConfig from '../../config/api';
import { authHelpers } from '../../config/auth';
import AnnouncementList from '../shared/AnnouncementList';
import PollList from '../shared/PollList';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

const GlobalCommunications = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [polls, setPolls] = useState([]);
  const [message, setMessage] = useState(null);

  const [formAnn, setFormAnn] = useState({ title: '', content: '', type: 'GENERAL' });
  const [formPoll, setFormPoll] = useState({ question: '', options: [''] });

  const [commentDrafts, setCommentDrafts] = useState({});
  const [pollChoice, setPollChoice] = useState({});
  const [pollResults, setPollResults] = useState({});
  const [userLikes, setUserLikes] = useState({}); // Track which announcements user has liked
  const [userVotes, setUserVotes] = useState({}); // Track which polls user has voted on
  const [likeCounts, setLikeCounts] = useState({}); // Track like counts for announcements
  const [comments, setComments] = useState({}); // Track comments for announcements

  const stompRef = useRef(null);

  const loadAll = async () => {
    try {
      console.log('Loading communications...');
      
      // Try target-specific endpoint first, fallback to all announcements
      let announcementsData = [];
      let pollsData = [];
      
      try {
        const ra = await axios.get(`${apiConfig.adminService}/announcements/target/ALL`);
        announcementsData = ra.data || [];
      } catch (error) {
        console.log('Fallback: Loading all announcements...');
        const ra = await axios.get(`${apiConfig.adminService}/announcements`);
        announcementsData = ra.data || [];
      }
      
      try {
        const rp = await axios.get(`${apiConfig.adminService}/polls/target/ALL`);
        pollsData = rp.data || [];
      } catch (error) {
        console.log('Fallback: Loading all polls...');
        const rp = await axios.get(`${apiConfig.adminService}/polls`);
        pollsData = rp.data || [];
      }
      
      console.log('Announcements loaded:', announcementsData);
      console.log('Polls loaded:', pollsData);
      
      setAnnouncements(announcementsData);
      setPolls(pollsData);
      pollsData.forEach(p => refreshPollResults(p.id));
      
      // Load additional data only if we have announcements
      if (announcementsData && announcementsData.length > 0) {
        // Load user's current like status for all announcements
        loadUserLikes(announcementsData);
        // Load like counts for all announcements
        loadLikeCounts(announcementsData);
        // Load comments for all announcements
        loadComments(announcementsData);
      }
    } catch (error) {
      console.error('Error loading communications:', error);
      setMessage({ type: 'error', text: `Failed to fetch communications: ${error.message}` });
      // Set empty arrays on error
      setAnnouncements([]);
      setPolls([]);
    }
  };

  const loadUserLikes = async (announcements) => {
    const currentUser = authHelpers.getUserName() || 'User';
    const likes = {};
    
    // If no announcements, return early
    if (!announcements || announcements.length === 0) {
      setUserLikes(likes);
      return;
    }
    
    // Process announcements in batches to avoid overwhelming the server
    const batchSize = 3;
    for (let i = 0; i < announcements.length; i += batchSize) {
      const batch = announcements.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (ann) => {
        try {
          const base = apiConfig.chatService.replace('/api/chat','/api/interactions');
          const response = await fetch(`${base}/announcement/${ann.id}/interactions`);
          if (!response.ok) {
            console.error(`Failed to load interactions for announcement ${ann.id}:`, response.status);
            return { id: ann.id, liked: false };
          }
          const interactions = await response.json();
          const userLike = interactions.find(i => 
            i.userName === currentUser && i.type === 'LIKE'
          );
          return { id: ann.id, liked: !!userLike };
        } catch (error) {
          console.error(`Error loading likes for announcement ${ann.id}:`, error);
          return { id: ann.id, liked: false };
        }
      });
      
      try {
        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(result => {
          likes[result.id] = result.liked;
        });
        
        // Small delay between batches to prevent overwhelming the server
        if (i + batchSize < announcements.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error('Error processing batch:', error);
        // Set all announcements in this batch to not liked
        batch.forEach(ann => {
          likes[ann.id] = false;
        });
      }
    }
    
    setUserLikes(likes);
  };

  const loadLikeCounts = async (announcements) => {
    const counts = {};
    
    // If no announcements, return early
    if (!announcements || announcements.length === 0) {
      setLikeCounts(counts);
      return;
    }
    
    // Process announcements in batches to avoid overwhelming the server
    const batchSize = 5;
    for (let i = 0; i < announcements.length; i += batchSize) {
      const batch = announcements.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (ann) => {
        try {
          const base = apiConfig.chatService.replace('/api/chat','/api/interactions');
          const response = await fetch(`${base}/announcement/${ann.id}/likes/count`);
          if (!response.ok) {
            console.error(`Failed to load like count for announcement ${ann.id}:`, response.status);
            return { id: ann.id, count: 0 };
          }
          const result = await response.json();
          return { id: ann.id, count: result.count || 0 };
        } catch (error) {
          console.error(`Error loading like count for announcement ${ann.id}:`, error);
          return { id: ann.id, count: 0 };
        }
      });
      
      try {
        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(result => {
          counts[result.id] = result.count;
        });
        
        // Small delay between batches to prevent overwhelming the server
        if (i + batchSize < announcements.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      } catch (error) {
        console.error('Error processing like counts batch:', error);
        // Set all announcements in this batch to 0 likes
        batch.forEach(ann => {
          counts[ann.id] = 0;
        });
      }
    }
    
    setLikeCounts(counts);
  };

  const loadComments = async (announcements) => {
    const allComments = {};
    
    // If no announcements, return early
    if (!announcements || announcements.length === 0) {
      setComments(allComments);
      return;
    }
    
    // Process announcements in batches to avoid overwhelming the server
    const batchSize = 5;
    for (let i = 0; i < announcements.length; i += batchSize) {
      const batch = announcements.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (ann) => {
        try {
          const base = apiConfig.chatService.replace('/api/chat','/api/interactions');
          const response = await fetch(`${base}/announcement/${ann.id}/interactions`);
          if (!response.ok) {
            console.error(`Failed to load comments for announcement ${ann.id}:`, response.status);
            return { id: ann.id, comments: [] };
          }
          const interactions = await response.json();
          const commentList = interactions.filter(i => i.type === 'COMMENT');
          return { id: ann.id, comments: commentList };
        } catch (error) {
          console.error(`Error loading comments for announcement ${ann.id}:`, error);
          return { id: ann.id, comments: [] };
        }
      });
      
      try {
        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(result => {
          allComments[result.id] = result.comments;
        });
        
        // Small delay between batches to prevent overwhelming the server
        if (i + batchSize < announcements.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      } catch (error) {
        console.error('Error processing comments batch:', error);
        // Set all announcements in this batch to empty comments
        batch.forEach(ann => {
          allComments[ann.id] = [];
        });
      }
    }
    
    setComments(allComments);
  };

  useEffect(() => {
    loadAll();
    // Use chat service WebSocket for likes/comments, admin service WebSocket for deletions
    const chatSocket = new SockJS(apiConfig.websocketUrl);
    const adminSocket = new SockJS(apiConfig.adminWebsocketUrl);
    const chatClient = new Client({ webSocketFactory: () => chatSocket, reconnectDelay: 3000 });
    const adminClient = new Client({ webSocketFactory: () => adminSocket, reconnectDelay: 3000 });
    
    // Chat service WebSocket for likes/comments
    chatClient.onConnect = () => {
      chatClient.subscribe('/topic/announcements.new', () => loadAll());
      chatClient.subscribe('/topic/polls.new', () => loadAll());
      chatClient.subscribe('/topic/polls.votes', (msg) => {
        try {
          const v = JSON.parse(msg.body || '{}');
          if (v?.pollId) refreshPollResults(v.pollId);
        } catch {}
      });
      
      // Subscribe to general announcement reactions
      chatClient.subscribe('/topic/announcements.reactions', (msg) => {
        try {
          const reaction = JSON.parse(msg.body || '{}');
          if (reaction.type === 'LIKE') {
            // Update like status for the specific announcement
            setUserLikes(prev => ({ ...prev, [reaction.announcementId]: reaction.liked }));
            // Also refresh the data to get updated like counts
            loadAll();
          } else if (reaction.type === 'COMMENT') {
            // Refresh comments when new comment is added
            console.log('Comment reaction received:', reaction);
            // Refresh all data to get updated comments
            loadAll();
          }
        } catch (error) {
          console.error('Error processing announcement reaction:', error);
        }
      });
    };
    
    // Admin service WebSocket for deletions
    adminClient.onConnect = () => {
      // Subscribe to deletion events
      adminClient.subscribe('/topic/announcements.deleted', (msg) => {
        try {
          const deletion = JSON.parse(msg.body || '{}');
          console.log('Announcement deleted:', deletion);
          // Remove the deleted announcement from the list
          setAnnouncements(prev => prev.filter(ann => ann.id !== deletion.id));
        } catch (error) {
          console.error('Error processing announcement deletion:', error);
        }
      });
      
      adminClient.subscribe('/topic/polls.deleted', (msg) => {
        try {
          const deletion = JSON.parse(msg.body || '{}');
          console.log('Poll deleted:', deletion);
          // Remove the deleted poll from the list
          setPolls(prev => prev.filter(poll => poll.id !== deletion.id));
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

  // Subscribe to individual announcement like and comment updates when announcements change
  useEffect(() => {
    if (stompRef.current && stompRef.current.chat && stompRef.current.chat.connected) {
      announcements.forEach(ann => {
        // Subscribe to likes
        stompRef.current.chat.subscribe(`/topic/announcement.${ann.id}.likes`, (msg) => {
          const count = parseInt(msg.body) || 0;
          // Refresh all data to get updated like counts
          loadAll();
        });
        
        // Subscribe to comments
        stompRef.current.chat.subscribe(`/topic/announcement.${ann.id}.comments`, (msg) => {
          console.log('New comment received for announcement', ann.id, ':', msg.body);
          // Refresh all data to get updated comments
          loadAll();
        });
      });
    }
  }, [announcements]);

  const refreshPollResults = async (pollId) => {
    try {
      const base = apiConfig.chatService.replace('/api/chat','/api/interactions');
      const res = await fetch(`${base}/poll/${pollId}/results`);
      const results = await res.json();
      setPollResults(prev => ({ ...prev, [pollId]: results || { totalVotes: 0, optionCounts: {} } }));
    } catch {}
  };

  // Create ALL-only
  const createAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${apiConfig.adminService}/announcements`, {
        title: formAnn.title,
        content: formAnn.content,
        type: (formAnn.type || 'GENERAL').toUpperCase(),
        targetAudience: 'ALL',
        createdByName: authHelpers.getUserName() || 'User'
      });
      setFormAnn({ title: '', content: '', type: 'GENERAL' });
      setMessage({ type: 'success', text: 'Announcement posted.' });
      loadAll();
    } catch (err) {
      setMessage({ type: 'error', text: err?.response?.data?.error || 'Failed to post announcement' });
    }
  };

  const createPoll = async (e) => {
    e.preventDefault();
    const options = (formPoll.options || []).map(o => (o || '').trim()).filter(Boolean);
    if (options.length < 2) { setMessage({ type: 'error', text: 'A poll needs at least two options.' }); return; }
    try {
      await axios.post(`${apiConfig.adminService}/polls`, {
        question: formPoll.question,
        options,
        targetAudience: 'ALL',
        createdByName: authHelpers.getUserName() || 'User',
        isActive: true
      });
      setFormPoll({ question: '', options: [''] });
      setMessage({ type: 'success', text: 'Poll created.' });
      loadAll();
    } catch (err) {
      setMessage({ type: 'error', text: err?.response?.data?.error || 'Failed to create poll' });
    }
  };

  // Interactions to chat-service (name-only)
  const likeAnnouncement = async (ann) => {
    try {
      const base = apiConfig.chatService.replace('/api/chat','/api/interactions');
      const response = await fetch(`${base}/announcement/like`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcementId: ann.id, userName: authHelpers.getUserName() || 'User', type: 'LIKE' })
      });
      
      if (!response.ok) {
        console.error('Like request failed:', response.status, response.statusText);
        return;
      }
      
      const result = await response.json();
      console.log('Like response:', result);
      
      // Update the like status for this announcement
      setUserLikes(prev => ({ ...prev, [ann.id]: result.liked }));
      
      // Also refresh the like count
      loadAll();
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcementId: ann.id, userName: authHelpers.getUserName() || 'User', content, type: 'COMMENT' })
      });
      setCommentDrafts(p => ({ ...p, [ann.id]: '' }));
      // Refresh comments for this announcement
      loadComments([ann]);
    } catch {}
  };

  const votePoll = async (poll, selected) => {
    if (!selected) return;
    try {
      const base = apiConfig.chatService.replace('/api/chat','/api/interactions');
      await fetch(`${base}/poll/vote`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
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
      const userName = authHelpers.getUserName() || 'User';
      await axios.delete(`${apiConfig.adminService}/announcements/${id}`, {
        headers: { 'X-User-Name': userName }
      });
      setMessage({ type: 'success', text: 'Announcement deleted successfully.' });
      loadAll();
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
      loadAll();
    } catch (err) {
      setMessage({ type: 'error', text: err?.response?.data?.error || 'Failed to delete poll' });
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Global Communications (ALL)</h1>

      {message && (
        <motion.div className={`p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`} initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          {message.text}
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <form onSubmit={createAnnouncement} className="bg-white p-6 rounded-xl shadow-md border-l-4 border-indigo-500 space-y-3">
          <h2 className="text-xl font-semibold">Create Announcement</h2>
          <input className="p-2 border rounded w-full" placeholder="Title" value={formAnn.title} onChange={e => setFormAnn(p => ({ ...p, title: e.target.value }))} required />
          <textarea className="p-2 border rounded w-full h-24" placeholder="Content" value={formAnn.content} onChange={e => setFormAnn(p => ({ ...p, content: e.target.value }))} required />
          <select className="p-2 border rounded w-full" value={formAnn.type} onChange={e => setFormAnn(p => ({ ...p, type: e.target.value }))}>
            <option value="GENERAL">GENERAL</option>
            <option value="URGENT">URGENT</option>
            <option value="POLICY">POLICY</option>
            <option value="EVENT">EVENT</option>
            <option value="UPDATE">UPDATE</option>
          </select>
          <div className="flex justify-end">
            <button className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Post</button>
          </div>
        </form>

        <form onSubmit={createPoll} className="bg-white p-6 rounded-xl shadow-md border-l-4 border-emerald-500 space-y-3" onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}>
          <h2 className="text-xl font-semibold">Create Poll</h2>
          <input className="p-2 border rounded w-full" placeholder="Question" value={formPoll.question} onChange={e => setFormPoll(p => ({ ...p, question: e.target.value }))} required />
          <div className="space-y-2">
            {(formPoll.options || []).slice(0, 4).map((opt, idx) => (
              <div key={idx} className="flex gap-2">
                <input className="p-2 border rounded w-full" placeholder={`Option ${idx + 1}`} value={opt} onChange={e => {
                  const next = [...(formPoll.options || [])]; next[idx] = e.target.value; setFormPoll(p => ({ ...p, options: next }));
                }} />
                {idx === (formPoll.options?.length || 0) - 1 && (formPoll.options?.length || 0) < 4 && (
                  <button type="button" className="px-2 border rounded" onClick={() => setFormPoll(p => ({ ...p, options: [...(p.options || []), ''] }))}>+</button>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <button className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">Launch</button>
          </div>
        </form>
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">Announcements</h2>
        <AnnouncementList items={announcements} onLike={likeAnnouncement} onComment={commentAnnouncement} onDelete={deleteAnnouncement} drafts={commentDrafts} setDrafts={setCommentDrafts} userLikes={userLikes} likeCounts={likeCounts} comments={comments} stompClient={stompRef.current?.chat} />
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">Polls</h2>
        <PollList items={polls} resultsMap={pollResults} onVote={votePoll} onDelete={deletePoll} choice={pollChoice} setChoice={setPollChoice} userVotes={userVotes} />
      </div>
    </motion.div>
  );
};

export default GlobalCommunications;
