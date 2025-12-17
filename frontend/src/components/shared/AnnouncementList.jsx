import React, { useState } from 'react';
import { authHelpers } from '../../config/auth';
import apiConfig from '../../config/api';

const AnnouncementList = ({ items, onLike, onComment, onDelete, drafts, setDrafts, userLikes = {}, likeCounts = {}, comments = {}, stompClient = null, theme = 'blue' }) => {
  // Theme color mappings
  const themeColors = {
    blue: { primary: 'blue', tab: 'blue', bg: 'from-blue-50 to-indigo-50', border: 'border-blue-200', button: 'bg-blue-600 hover:bg-blue-700', text: 'text-blue-600', liked: 'bg-blue-500 hover:bg-blue-600' },
    green: { primary: 'green', tab: 'green', bg: 'from-green-50 to-emerald-50', border: 'border-green-200', button: 'bg-green-600 hover:bg-green-700', text: 'text-green-600', liked: 'bg-green-500 hover:bg-green-600' },
    rose: { primary: 'rose', tab: 'rose', bg: 'from-rose-50 to-pink-50', border: 'border-rose-200', button: 'bg-rose-600 hover:bg-rose-700', text: 'text-rose-600', liked: 'bg-rose-500 hover:bg-rose-700' },
    purple: { primary: 'purple', tab: 'purple', bg: 'from-purple-50 to-violet-50', border: 'border-purple-200', button: 'bg-purple-600 hover:bg-purple-700', text: 'text-purple-600', liked: 'bg-purple-500 hover:bg-purple-700' }
  };
  const colors = themeColors[theme] || themeColors.blue;
  const [showAllComments, setShowAllComments] = useState({});
  const [showLikes, setShowLikes] = useState({});
  const [likedUsers, setLikedUsers] = useState({});
  const [activeTab, setActiveTab] = useState('sent');

  const fetchLikedUsers = async (announcementId) => {
    try {
      const base = apiConfig.chatService.replace('/api/chat','/api/interactions');
      const response = await fetch(`${base}/announcement/${announcementId}/likes/users`);
      if (response.ok) {
        const users = await response.json();
        setLikedUsers(prev => ({ ...prev, [announcementId]: users }));
      }
    } catch (error) {
      console.error('Error fetching liked users:', error);
    }
  };

  const toggleShowLikes = (announcementId) => {
    const isShowing = showLikes[announcementId];
    setShowLikes(prev => ({ ...prev, [announcementId]: !isShowing }));
    
    if (!isShowing && !likedUsers[announcementId]) {
      fetchLikedUsers(announcementId);
    }
  };

  // Set up WebSocket subscription for real-time likes updates
  React.useEffect(() => {
    if (!stompClient) return;
    
    const client = stompClient;
    const subscriptions = [];
    
    // Wait for connection to be ready
    const setupSubscriptions = () => {
      if (!client.connected) {
        // Retry after a short delay if not connected
        setTimeout(setupSubscriptions, 100);
        return;
      }
      
      // Subscribe to likes list updates for each announcement
      items.forEach(ann => {
        if (ann.id) {
          try {
            const subscription = client.subscribe(`/topic/announcement.${ann.id}.likes.users`, (msg) => {
              try {
                const updatedLikedUsers = JSON.parse(msg.body);
                setLikedUsers(prev => ({ ...prev, [ann.id]: updatedLikedUsers }));
              } catch (error) {
                console.error('Error parsing likes users update:', error);
              }
            });
            subscriptions.push({ subscription, topic: `/topic/announcement.${ann.id}.likes.users` });
          } catch (error) {
            console.error('Error subscribing to likes updates:', error);
          }
        }
      });
    };
    
    setupSubscriptions();
    
    return () => {
      // Cleanup subscriptions when component unmounts
      subscriptions.forEach(({ subscription, topic }) => {
        try {
          subscription.unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing from likes updates:', error);
        }
      });
    };
  }, [items, stompClient]);

  // Separate announcements into sent and received
  const currentUser = authHelpers.getUserName() || 'User';
  const sentAnnouncements = Array.isArray(items) ? items.filter(ann => {
    const name = (ann.createdByName && String(ann.createdByName).trim()) || 'User';
    return name === currentUser;
  }) : [];
  const receivedAnnouncements = Array.isArray(items) ? items.filter(ann => {
    const name = (ann.createdByName && String(ann.createdByName).trim()) || 'User';
    return name !== currentUser;
  }) : [];

  const renderAnnouncementCard = (ann) => {
    const name = (ann.createdByName && String(ann.createdByName).trim()) || 'User';
    const when = ann.createdAt ? new Date(ann.createdAt).toLocaleString() : '';
    const canDelete = onDelete && name === currentUser;
    return (
      <div key={ann.id} className={`p-4 rounded-xl shadow-md bg-white border-l-4 ${ann.type === 'URGENT' ? 'border-red-500' : 'border-indigo-500'}`}>
            <div className="flex items-center gap-2">
              <div className="font-bold text-lg text-gray-800">{ann.title}</div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700">Received</span>
            </div>
            <p className="text-sm text-gray-600">{ann.content}</p>
            <span className="text-xs text-gray-400 mt-1 block">By {name} • Target: ALL • {when || ''}</span>

            <div className="mt-2 flex items-center gap-3">
              {onLike && (
                <button 
                  onClick={() => onLike(ann)} 
                  className={`px-3 py-1 rounded text-sm ${
                    userLikes[ann.id] 
                      ? `${colors.liked} text-white` 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  👍 {userLikes[ann.id] ? 'Liked' : 'Like'} ({likeCounts[ann.id] || 0})
                </button>
              )}
                  {(likeCounts[ann.id] || 0) > 0 && (
                    <button 
                      onClick={() => toggleShowLikes(ann.id)} 
                      className={`px-3 py-1 rounded text-sm bg-${colors.primary}-100 text-${colors.primary}-700 hover:bg-${colors.primary}-200`}
                    >
                      👥 {showLikes[ann.id] ? 'Hide Likes' : 'View Likes'}
                    </button>
                  )}
              {onComment && (
                <>
                  <input
                    className="flex-1 border rounded px-2 py-1 text-sm"
                    placeholder="Write a comment..."
                    value={drafts?.[ann.id] || ''}
                    onChange={e => setDrafts(prev => ({ ...prev, [ann.id]: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onComment(ann, drafts?.[ann.id] || ''); } }}
                  />
                  <button onClick={() => onComment(ann, drafts?.[ann.id] || '')} className={`px-3 py-1 ${colors.button} text-white rounded text-sm`}>Comment</button>
                </>
              )}
              {canDelete && (
                <button 
                  onClick={() => onDelete(ann.id)} 
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  🗑️ Delete
                </button>
              )}
            </div>
            
            {/* Display comments */}
            {comments[ann.id] && comments[ann.id].length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="text-sm font-medium text-gray-600">
                  Comments ({comments[ann.id].length}):
                </div>
                
                {/* Sort comments by date (newest first) */}
                {(() => {
                  const sortedComments = [...comments[ann.id]].sort((a, b) => 
                    new Date(b.createdAt) - new Date(a.createdAt)
                  );
                  const showAll = showAllComments[ann.id];
                  const displayComments = showAll ? sortedComments : sortedComments.slice(0, 2);
                  
                  return (
                    <>
                      {displayComments.map((comment, idx) => (
                        <div key={comment.id || idx} className="bg-gray-50 rounded p-2">
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>{comment.userName}</span>
                            <span>{comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ''}</span>
                          </div>
                          <p className="text-sm text-gray-800">{comment.content}</p>
                        </div>
                      ))}
                      
                      {/* View All/Show Less button */}
                      {comments[ann.id].length > 2 && (
                        <button
                          onClick={() => setShowAllComments(prev => ({ 
                            ...prev, 
                            [ann.id]: !showAll 
                          }))}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {showAll ? 'Show Less' : `View All ${comments[ann.id].length} Comments`}
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
            
            {/* Display liked users */}
            {showLikes[ann.id] && likedUsers[ann.id] && (
              <div className="mt-3 space-y-2">
                <div className="text-sm font-medium text-gray-600">
                  Liked by ({likedUsers[ann.id].length}):
                </div>
                <div className="space-y-1">
                  {likedUsers[ann.id].map((user, idx) => (
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
          </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-300">
        <button
          onClick={() => setActiveTab('sent')}
          className={`px-6 py-3 font-semibold transition-all ${
            activeTab === 'sent'
              ? `text-${colors.primary}-600 border-b-2 border-${colors.primary}-600 bg-${colors.primary}-50`
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          📤 Sent by Me ({sentAnnouncements.length})
        </button>
        <button
          onClick={() => setActiveTab('received')}
          className={`px-6 py-3 font-semibold transition-all ${
            activeTab === 'received'
              ? `text-${colors.primary}-600 border-b-2 border-${colors.primary}-600 bg-${colors.primary}-50`
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          📥 Received ({receivedAnnouncements.length})
        </button>
      </div>

      {/* Sent by Me Tab Content */}
      {activeTab === 'sent' && (
        <div className={`bg-gradient-to-r ${colors.bg} p-6 rounded-xl border ${colors.border}`}>
          {sentAnnouncements.length > 0 ? (
            <div className="space-y-4">
              {sentAnnouncements.map(ann => renderAnnouncementCard(ann))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No announcements sent by you.</p>
          )}
        </div>
      )}

      {/* Received Tab Content */}
      {activeTab === 'received' && (
        <div className={`bg-gradient-to-r ${colors.bg} p-6 rounded-xl border ${colors.border}`}>
          {receivedAnnouncements.length > 0 ? (
            <div className="space-y-4">
              {receivedAnnouncements.map(ann => renderAnnouncementCard(ann))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No announcements received.</p>
          )}
        </div>
      )}

      {/* No Announcements at All */}
      {sentAnnouncements.length === 0 && receivedAnnouncements.length === 0 && (
        <p className="text-gray-500 text-center py-8">No announcements found.</p>
      )}
    </div>
  );
};

export default AnnouncementList;
