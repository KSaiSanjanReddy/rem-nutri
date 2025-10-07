import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiX, FiChevronUp, FiChevronDown, FiFilter } from 'react-icons/fi';

const ChatSearch = ({ messages = [], onClose, onSearchResult }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    sender: '',
    dateRange: '',
    messageType: ''
  });
  
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch();
    } else {
      setSearchResults([]);
      setCurrentResultIndex(0);
    }
  }, [searchQuery, filters, messages]);

  const performSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = [];

    messages.forEach((message, index) => {
      let matches = false;

      // Search in message content
      if (message.content && message.content.toLowerCase().includes(query)) {
        matches = true;
      }

      // Search in sender name
      if (message['sender.fullName'] && message['sender.fullName'].toLowerCase().includes(query)) {
        matches = true;
      }

      // Search in attachment names
      if (message.attachments && message.attachments.length > 0) {
        const hasMatchingAttachment = message.attachments.some(attachment => 
          attachment.name && attachment.name.toLowerCase().includes(query)
        );
        if (hasMatchingAttachment) {
          matches = true;
        }
      }

      // Apply filters
      if (matches) {
        // Filter by sender
        if (filters.sender && message['sender.fullName']) {
          if (!message['sender.fullName'].toLowerCase().includes(filters.sender.toLowerCase())) {
            matches = false;
          }
        }

        // Filter by message type
        if (filters.messageType && message.messageType !== filters.messageType) {
          matches = false;
        }

        // Filter by date range (basic implementation)
        if (filters.dateRange) {
          const messageDate = new Date(message.createdAt);
          const now = new Date();
          
          switch (filters.dateRange) {
            case 'today':
              if (messageDate.toDateString() !== now.toDateString()) {
                matches = false;
              }
              break;
            case 'week':
              const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              if (messageDate < weekAgo) {
                matches = false;
              }
              break;
            case 'month':
              const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
              if (messageDate < monthAgo) {
                matches = false;
              }
              break;
            default:
              break;
          }
        }

        if (matches) {
          results.push({ message, index });
        }
      }
    });

    setSearchResults(results);
    setCurrentResultIndex(0);
    
    // Notify parent component about search results
    if (onSearchResult) {
      onSearchResult(results);
    }
  };

  const handleNextResult = () => {
    if (searchResults.length > 0) {
      const nextIndex = (currentResultIndex + 1) % searchResults.length;
      setCurrentResultIndex(nextIndex);
      scrollToResult(nextIndex);
    }
  };

  const handlePreviousResult = () => {
    if (searchResults.length > 0) {
      const prevIndex = currentResultIndex === 0 ? searchResults.length - 1 : currentResultIndex - 1;
      setCurrentResultIndex(prevIndex);
      scrollToResult(prevIndex);
    }
  };

  const scrollToResult = (index) => {
    const result = searchResults[index];
    if (result && onSearchResult) {
      onSearchResult([result], index);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setCurrentResultIndex(0);
    if (onSearchResult) {
      onSearchResult([]);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMessagePreview = (message) => {
    if (message.messageType === 'audio') {
      return '🎤 Voice message';
    } else if (message.messageType === 'image') {
      return '📷 Image';
    } else if (message.messageType === 'document' || message.messageType === 'file') {
      return '📎 File';
    } else {
      return message.content || '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-white border-b border-gray-200 p-4"
    >
      {/* Search Header */}
      <div className="flex items-center space-x-3 mb-3">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-4 w-4 text-gray-400" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2 rounded-lg transition-colors ${
            showFilters ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <FiFilter className="w-4 h-4" />
        </button>

        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FiX className="w-5 h-5" />
        </button>
      </div>

      {/* Search Results Info */}
      {searchQuery && (
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-600">
            {searchResults.length > 0 ? (
              `${searchResults.length} result${searchResults.length === 1 ? '' : 's'} found`
            ) : (
              'No results found'
            )}
          </div>

          {searchResults.length > 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePreviousResult}
                disabled={searchResults.length === 0}
                className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiChevronUp className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600">
                {currentResultIndex + 1} of {searchResults.length}
              </span>
              <button
                onClick={handleNextResult}
                disabled={searchResults.length === 0}
                className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiChevronDown className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-200 pt-3"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Sender Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Sender</label>
                <input
                  type="text"
                  placeholder="Filter by sender..."
                  value={filters.sender}
                  onChange={(e) => handleFilterChange('sender', e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">All time</option>
                  <option value="today">Today</option>
                  <option value="week">Past week</option>
                  <option value="month">Past month</option>
                </select>
              </div>

              {/* Message Type Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Message Type</label>
                <select
                  value={filters.messageType}
                  onChange={(e) => handleFilterChange('messageType', e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">All types</option>
                  <option value="text">Text</option>
                  <option value="audio">Voice</option>
                  <option value="image">Images</option>
                  <option value="document">Documents</option>
                  <option value="file">Files</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Results Preview */}
      {searchResults.length > 0 && (
        <div className="mt-3 max-h-32 overflow-y-auto">
          {searchResults.slice(0, 3).map((result, index) => (
            <div
              key={result.message.id}
              className={`p-2 rounded text-sm cursor-pointer transition-colors ${
                index === currentResultIndex ? 'bg-primary-50 border-l-2 border-primary-500' : 'hover:bg-gray-50'
              }`}
              onClick={() => scrollToResult(index)}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">
                  {result.message['sender.fullName'] || 'Unknown'}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDate(result.message.createdAt)}
                </span>
              </div>
              <div className="text-gray-600 truncate">
                {getMessagePreview(result.message)}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default ChatSearch;
