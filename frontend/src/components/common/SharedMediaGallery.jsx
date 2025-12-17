import { useState } from 'react';

/**
 * Shared Media Gallery Component
 * Displays all photos, videos, and documents shared in a chat
 */
const SharedMediaGallery = ({ isOpen, onClose, messages = [] }) => {
  const [activeTab, setActiveTab] = useState('all'); // all, photos, videos, docs

  // Extract media from messages
  const extractMedia = () => {
    const media = {
      photos: [],
      videos: [],
      docs: [],
      links: []
    };

    messages.forEach(msg => {
      if (msg.fileUrl && msg.fileType) {
        const item = {
          id: msg.id,
          url: msg.fileUrl,
          name: msg.fileName,
          type: msg.fileType,
          sender: msg.senderName,
          date: msg.sentAt
        };

        if (msg.fileType.startsWith('image/')) {
          media.photos.push(item);
        } else if (msg.fileType.startsWith('video/')) {
          media.videos.push(item);
        } else {
          media.docs.push(item);
        }
      }

      // Extract links from content
      if (msg.content) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urls = msg.content.match(urlRegex);
        if (urls) {
          urls.forEach(url => {
            media.links.push({
              id: `${msg.id}-${url}`,
              url,
              sender: msg.senderName,
              date: msg.sentAt
            });
          });
        }
      }
    });

    return media;
  };

  const media = extractMedia();

  const getTabContent = () => {
    switch (activeTab) {
      case 'photos':
        return media.photos;
      case 'videos':
        return media.videos;
      case 'docs':
        return media.docs;
      case 'links':
        return media.links;
      default:
        return [...media.photos, ...media.videos, ...media.docs];
    }
  };

  const tabContent = getTabContent();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-96 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">Media, Links & Docs</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-gray-50">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All ({media.photos.length + media.videos.length + media.docs.length})
          </button>
          <button
            onClick={() => setActiveTab('photos')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'photos'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Photos ({media.photos.length})
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'videos'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Videos ({media.videos.length})
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'docs'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Docs ({media.docs.length})
          </button>
          <button
            onClick={() => setActiveTab('links')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'links'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Links ({media.links.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {tabContent.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>No {activeTab === 'all' ? 'media' : activeTab} found</p>
            </div>
          ) : activeTab === 'photos' ? (
            // Photo grid
            <div className="grid grid-cols-3 gap-2">
              {tabContent.map(item => (
                <a
                  key={item.id}
                  href={`http://localhost:8085${item.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative group overflow-hidden rounded-lg"
                >
                  <img
                    src={`http://localhost:8085${item.url}`}
                    alt={item.name}
                    className="w-full h-24 object-cover group-hover:opacity-75 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                    <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity">👁️</span>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            // List view for videos, docs, links
            <div className="space-y-2">
              {tabContent.map(item => (
                <a
                  key={item.id}
                  href={activeTab === 'links' ? item.url : `http://localhost:8085${item.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="text-2xl flex-shrink-0">
                    {activeTab === 'videos' ? '🎥' : activeTab === 'links' ? '🔗' : '📄'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.name || item.url}</p>
                    <p className="text-xs text-gray-500">
                      {item.sender} • {new Date(item.date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-gray-400">→</span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 p-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SharedMediaGallery;
