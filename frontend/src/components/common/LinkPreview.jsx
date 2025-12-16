import React, { useState, useEffect } from 'react';
import { extractUrls } from '../../utils/whatsappFeatures';

/**
 * Link Preview Component
 * Displays preview for URLs in messages
 */
const LinkPreview = ({ message }) => {
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!message?.content) return;

    const urls = extractUrls(message.content);
    if (urls.length === 0) return;

    setLoading(true);

    // Fetch preview for first URL only
    const url = urls[0];
    fetchLinkPreview(url)
      .then(preview => {
        if (preview) {
          setPreviews([preview]);
        }
      })
      .catch(error => {
        console.error('Error fetching link preview:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [message?.content]);

  const fetchLinkPreview = async (url) => {
    try {
      // Using a simple approach - in production, use a backend service
      // to fetch and parse the URL for security reasons
      const response = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
      
      if (!response.ok) {
        // Fallback: just show the URL
        return {
          url,
          title: new URL(url).hostname,
          description: url,
          image: null
        };
      }

      return await response.json();
    } catch (error) {
      // Fallback: show basic URL info
      return {
        url,
        title: new URL(url).hostname,
        description: url,
        image: null
      };
    }
  };

  if (previews.length === 0) return null;

  return (
    <div className="mt-2 space-y-2">
      {previews.map((preview, idx) => (
        <a
          key={idx}
          href={preview.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block border border-gray-300 rounded-lg overflow-hidden hover:shadow-md transition-all"
        >
          {/* Preview Image */}
          {preview.image && (
            <div className="w-full h-32 bg-gray-200 overflow-hidden">
              <img
                src={preview.image}
                alt={preview.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Preview Content */}
          <div className="p-2 bg-gray-50">
            <p className="text-xs font-semibold text-gray-700 truncate">
              {preview.title || new URL(preview.url).hostname}
            </p>
            <p className="text-xs text-gray-600 line-clamp-2">
              {preview.description || preview.url}
            </p>
          </div>
        </a>
      ))}
    </div>
  );
};

export default LinkPreview;
