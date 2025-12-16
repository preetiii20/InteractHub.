import React, { useState, useCallback } from 'react';
import { searchMessages } from '../../utils/whatsappFeatures';

/**
 * Chat Search Component
 * Search through message history
 */
const ChatSearch = ({ messages, onSearchResults, onClose, onSelectResult }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleSearch = useCallback((searchQuery) => {
    setQuery(searchQuery);
    
    if (searchQuery.trim()) {
      const filtered = searchMessages(messages, searchQuery);
      setResults(filtered);
      setSelectedIndex(0);
      onSearchResults?.(filtered);
      if (filtered.length > 0) {
        onSelectResult?.(filtered[0]);
      }
    } else {
      setResults([]);
      onSearchResults?.([]);
    }
  }, [messages, onSearchResults, onSelectResult]);

  const handlePrevious = () => {
    if (results.length > 0) {
      const newIndex = (selectedIndex - 1 + results.length) % results.length;
      setSelectedIndex(newIndex);
      onSelectResult?.(results[newIndex]);
    }
  };

  const handleNext = () => {
    if (results.length > 0) {
      const newIndex = (selectedIndex + 1) % results.length;
      setSelectedIndex(newIndex);
      onSelectResult?.(results[newIndex]);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 p-3 flex items-center gap-2">
      {/* Search Input */}
      <div className="flex-1 relative">
        <input
          type="text"
          placeholder="🔍 Search messages..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          autoFocus
        />
      </div>

      {/* Results Counter */}
      {results.length > 0 && (
        <div className="text-xs text-gray-600 font-medium whitespace-nowrap">
          {selectedIndex + 1} / {results.length}
        </div>
      )}

      {/* Navigation Buttons */}
      {results.length > 0 && (
        <>
          <button
            onClick={handlePrevious}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all"
            title="Previous result"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            onClick={handleNext}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all"
            title="Next result"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </>
      )}

      {/* Close Button */}
      <button
        onClick={onClose}
        className="p-2 hover:bg-gray-100 rounded-lg transition-all"
        title="Close search"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

export default ChatSearch;
