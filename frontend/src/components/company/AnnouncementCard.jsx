import React, { useState, useEffect, useCallback } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import apiConfig from '../../config/api';
import { authHelpers } from '../../config/auth';

const AnnouncementCard = ({ announcement, userLikes = {}, setUserLikes, stompClient = null }) => {
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showAllComments, setShowAllComments] = useState(false);
  const [showLikes, setShowLikes] = useState(false);
  const [likedUsers, setLikedUsers] = useState([]);

  const posterName = announcement.createdByName || 'User';
  const currentUser = authHelpers.getUserName() || 'User';
  const isLiked = userLikes[announcement.id] || false;

  const fetchLikedUsers = async () => {
    try {
      const base = apiConfig.chatService.replace('/api/chat','/api/interactions');
      const response = await fetch(`${base}/announcement/${announcement.id}/likes/users`);
      if (response.ok) {
        const users = await response.json();
        setLikedUsers(users);
      }
    } catch (error) {
      console.error('Error fetching liked users:', error);
    }
  };

  const toggleShowLikes = () => {
    setShowLikes(!showLikes);
    if (!showLikes && likedUsers.length === 0) {
      fetchLikedUsers();
    }
  };

  const fetchAnnouncementData = useCallback(async () => {
    try {
      const base = apiConfig.chatService.replace('/api/chat','/api/interactions');
      const likesRes = await fetch(`${base}/announcement/${announcement.id}/likes/count`);
      const likesJson = await likesRes.json();
      const commentsRes = await fetch(`${base}/announcement/${announcement.id}/interactions`);
      const interactions = await commentsRes.json();
      setLikes(Number(likesJson?.count) || 0);
      setComments((interactions || []).filter(i => i.type === 'COMMENT'));
    } catch {}
  }, [announcement.id]);

  useEffect(() => {
    const socket = new SockJS(apiConfig.websocketUrl);
    const client = new Client({ webSocketFactory: () => socket, reconnectDelay: 5000 });
    client.onConnect = () => {
      client.subscribe(`/topic/announcement.${announcement.id}.likes`, m => setLikes(parseInt(m.body) || 0));
      client.subscribe(`/topic/announcement.${announcement.id}.comments`, m => {
        try { setComments(prev => [...prev, JSON.parse(m.body)]); } catch {}
      });
    };
    client.activate();
    fetchAnnouncementData();
    return () => client.deactivate();
  }, [announcement.id, fetchAnnouncementData]);

  const handleLike = async () => {
    try {
      const base = apiConfig.chatService.replace('/api/chat','/api/interactions');
      const response = await fetch(`${base}/announcement/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          announcementId: announcement.id,
          userName: authHelpers.getUserName(),
          type: 'LIKE'
        })
      });
      
      if (!response.ok) {
        console.error('Like request failed:', response.status, response.statusText);
        return;
      }
      
      const result = await response.json();
      console.log('Like response:', result);
      
      // Update the like status for this announcement
      if (setUserLikes) {
        setUserLikes(prev => ({ ...prev, [announcement.id]: result.liked }));
      }
      
      // Refresh the like count
      fetchAnnouncementData();
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;
    try {
      const base = apiConfig.chatService.replace('/api/chat','/api/interactions');
      await fetch(`${base}/announcement/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          announcementId: announcement.id,
          userName: authHelpers.getUserName(),
          content: newComment,
          type: 'COMMENT'
        })
      });
      setNewComment('');
      // Refresh comments after posting
      fetchAnnouncementData();
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">{announcement.title}</h3>
          <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700">By {posterName}</span>
        </div>
        <span className="text-xs px-2 py-1 rounded bg-gray-100">{announcement.type}</span>
      </div>
      <p className="text-xs text-gray-500 mb-1">{announcement.createdAt ? new Date(announcement.createdAt).toLocaleString() : ''}</p>
      <p className="text-gray-700 mb-3">{announcement.content}</p>

      <div className="flex items-center gap-6 text-sm mb-3">
        <button 
          onClick={handleLike} 
          className={`px-3 py-1 rounded ${
            isLiked 
              ? 'bg-blue-500 text-white hover:bg-blue-600' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          👍 {isLiked ? 'Liked' : 'Like'} ({likes})
        </button>
            {likes > 0 && (
              <button 
                onClick={toggleShowLikes} 
                className="px-3 py-1 rounded text-sm bg-green-100 text-green-700 hover:bg-green-200"
              >
                👥 {showLikes ? 'Hide Likes' : 'View Likes'}
              </button>
            )}
        <span>💬 {comments.length}</span>
        <span className="text-gray-400">Live</span>
      </div>

      <div className="space-y-2">
        {comments.length > 0 && (
          <div className="text-sm font-medium text-gray-600 mb-2">
            Comments ({comments.length}):
          </div>
        )}
        
        {/* Sort comments by date (newest first) and show recent or all */}
        {(() => {
          const sortedComments = [...comments].sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
          );
          const displayComments = showAllComments ? sortedComments : sortedComments.slice(0, 2);
          
          return (
            <>
              {displayComments.map((c, idx) => (
                <div key={c.id || idx} className="bg-gray-50 rounded p-2">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{c.userName}</span>
                    <span>{c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}</span>
                  </div>
                  <p className="text-sm text-gray-800">{c.content}</p>
                </div>
              ))}
              
              {/* View All/Show Less button */}
              {comments.length > 2 && (
                <button
                  onClick={() => setShowAllComments(!showAllComments)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  {showAllComments ? 'Show Less' : `View All ${comments.length} Comments`}
                </button>
              )}
            </>
          );
        })()}
      </div>

      {/* Display liked users */}
      {showLikes && likedUsers.length > 0 && (
        <div className="mt-3 space-y-2">
          <div className="text-sm font-medium text-gray-600">
            Liked by ({likedUsers.length}):
          </div>
          <div className="space-y-1">
            {likedUsers.map((user, idx) => (
              <div key={user.userName || idx} className="bg-green-50 rounded p-2 flex justify-between items-center">
                <span className="text-sm text-gray-800 font-medium">{user.userName}</span>
                <span className="text-xs text-gray-500">
                  {user.likedAt ? new Date(user.likedAt).toLocaleString() : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <input className="flex-1 border rounded px-2 py-1" value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Write a comment..." onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleComment(); } }} />
        <button onClick={handleComment} disabled={!newComment.trim()} className="px-3 py-1 bg-blue-600 text-white rounded disabled:bg-gray-400">Comment</button>
      </div>
    </div>
  );
};

export default AnnouncementCard;
