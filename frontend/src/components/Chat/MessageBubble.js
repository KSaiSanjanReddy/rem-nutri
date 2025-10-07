import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { FiCheck, FiCheckCircle, FiImage, FiFile, FiDownload, FiPlay, FiPause } from 'react-icons/fi';
import SearchHighlighter from './SearchHighlighter';

const AudioPlayer = ({ attachment, message }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasError, setHasError] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnd = () => setIsPlaying(false);
    const handleError = () => {
      console.error('Audio playback error:', audio.error);
      setHasError(true);
      setIsPlaying(false);
    };
    const handleCanPlay = () => setHasError(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnd);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnd);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const audioUrl = attachment?.url || attachment?.fileUrl;
  
  console.log('🎤 AudioPlayer - attachment:', attachment);
  console.log('🎤 AudioPlayer - audioUrl:', audioUrl);
  console.log('🎤 AudioPlayer - hasError:', hasError);
  
  if (hasError || !audioUrl) {
    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-3 p-3 bg-gray-100 rounded-lg max-w-xs">
          <div className="flex-shrink-0 w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center">
            <FiPlay className="w-5 h-5 text-white ml-1" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-600">Voice message</p>
            <p className="text-xs text-gray-500">Audio not available</p>
          </div>
        </div>
        {message.content && message.content !== '🎤 Voice Message' && (
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-4 p-4 bg-white/60 backdrop-blur-sm rounded-2xl max-w-xs border border-gray-200/50 shadow-lg">
        <button
          onClick={togglePlay}
          className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          {isPlaying ? (
            <FiPause className="w-6 h-6 text-white" />
          ) : (
            <FiPlay className="w-6 h-6 text-white ml-1" />
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <div 
            className="w-full h-3 bg-gray-200 rounded-full cursor-pointer hover:bg-gray-300 transition-colors"
            onClick={handleSeek}
          >
            <div 
              className="h-3 bg-gradient-to-r from-primary-600 to-purple-600 rounded-full transition-all duration-100"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-2 font-medium">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
      
      {message.content && message.content !== '🎤 Voice Message' && (
        <p className="text-base whitespace-pre-wrap break-words leading-relaxed">
          {message.content}
        </p>
      )}
      
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        crossOrigin="anonymous"
      />
    </div>
  );
};

const MessageBubble = ({ message, isOwn, showAvatar, isHighlighted = false, searchResults = [] }) => {
  const getSearchQuery = () => {
    // Find search query from search results
    const searchResult = searchResults.find(result => result.message.id === message.id);
    return searchResult?.searchQuery || '';
  };

  const getMessageStatus = () => {
    if (message.isRead) return 'read';
    if (message.isDelivered) return 'delivered';
    return 'sent';
  };

  const formatTime = (timestamp) => {
    if (!timestamp) {
      return 'Just now';
    }
    
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'Just now';
      }
      return format(date, 'HH:mm');
    } catch (error) {
      console.error('Error formatting timestamp:', error, 'timestamp:', timestamp);
      return 'Just now';
    }
  };

  const renderMessageContent = () => {
    // Default to text if messageType is not set or invalid
    const messageType = message.messageType || 'text';
    
    if (messageType === 'text') {
      return (
        <p className="text-base whitespace-pre-wrap break-words leading-relaxed">
          <SearchHighlighter 
            text={message.content} 
            searchQuery={getSearchQuery()}
          />
        </p>
      );
    }

    if (messageType === 'image') {
      const attachment = message.attachments?.[0];
      return (
        <div className="space-y-3">
          <img
            src={attachment?.url || attachment?.fileUrl}
            alt="Shared image"
            className="max-w-xs rounded-2xl cursor-pointer hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl"
            onClick={() => window.open(attachment?.url || attachment?.fileUrl, '_blank')}
          />
          {message.content && (
            <p className="text-base whitespace-pre-wrap break-words leading-relaxed">
              {message.content}
            </p>
          )}
        </div>
      );
    }

    if (messageType === 'document' || messageType === 'file') {
      const attachment = message.attachments?.[0];
      const formatFileSize = (bytes) => {
        if (!bytes) return 'Unknown size';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
      };
      
      return (
        <div className="space-y-3">
          <div className="flex items-center space-x-4 p-4 bg-white/60 backdrop-blur-sm rounded-2xl max-w-xs border border-gray-200/50 shadow-lg">
            <div className="p-3 bg-gradient-to-br from-primary-500/10 to-purple-500/10 rounded-2xl">
              {attachment?.type?.startsWith('image/') ? (
                <FiImage className="w-6 h-6 text-primary-600" />
              ) : (
              <FiFile className="w-6 h-6 text-primary-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-gray-900 truncate">
                {attachment?.name || attachment?.originalName || 'File'}
              </p>
              <p className="text-sm text-gray-600">
                {formatFileSize(attachment?.size || attachment?.fileSize)}
              </p>
            </div>
            <button
              onClick={() => {
                const url = attachment?.url || attachment?.fileUrl;
                if (url) {
                  window.open(url, '_blank');
                }
              }}
              className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-300"
            >
              <FiDownload className="w-5 h-5" />
            </button>
          </div>
          {message.content && (
            <p className="text-base whitespace-pre-wrap break-words leading-relaxed">
              {message.content}
            </p>
          )}
        </div>
      );
    }

    if (messageType === 'audio') {
      const attachment = message.attachments?.[0];
      console.log('🎤 Rendering audio message:', message);
      console.log('🎤 Audio attachments:', message.attachments);
      console.log('🎤 Message content:', message.content);
      console.log('🎤 Message ID:', message.id);
      console.log('🎤 Message sender:', message['sender.fullName']);
      
      // Fallback for voice messages without proper attachments
      if (!attachment || (!attachment.url && !attachment.fileUrl)) {
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-3 p-3 bg-gray-100 rounded-lg max-w-xs">
              <div className="flex-shrink-0 w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center">
                <FiPlay className="w-5 h-5 text-white ml-1" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600">Voice message</p>
                <p className="text-xs text-gray-500">Recording not available</p>
              </div>
            </div>
            {message.content && message.content !== '🎤 Voice Message' && (
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </p>
            )}
          </div>
        );
      }
      
      return (
        <AudioPlayer attachment={attachment} message={message} />
      );
    }

    return (
      <p className="text-sm text-gray-500 italic">
        Unsupported message type: {messageType}
      </p>
    );
  };

  const renderMessageStatus = () => {
    const status = getMessageStatus();
    
    if (isOwn) {
      return (
        <div className="flex items-center space-x-2 mt-3">
          <span className="text-sm text-white/80 font-medium">
            {formatTime(message.createdAt)}
          </span>
          <div className="flex items-center">
            {status === 'sent' && <FiCheck className="w-4 h-4 text-white/60" />}
            {status === 'delivered' && <FiCheck className="w-4 h-4 text-white/60" />}
            {status === 'read' && <FiCheckCircle className="w-4 h-4 text-white" />}
          </div>
        </div>
      );
    }

    return (
      <span className="text-sm text-gray-500 mt-3 font-medium">
        {formatTime(message.createdAt)}
      </span>
    );
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${showAvatar ? 'mt-6' : 'mt-2'} ${isHighlighted ? 'ring-2 ring-yellow-400 ring-opacity-50 bg-yellow-50 rounded-2xl p-3' : ''}`}>
      <div className={`flex items-end space-x-3 max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* Avatar for other person */}
        {!isOwn && showAvatar && (
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 via-purple-500 to-health-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
            <span className="text-white font-bold text-sm">
              {(message.sender?.fullName || message['sender.fullName'])?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
        )}

        {/* Spacer when no avatar is shown for other person */}
        {!isOwn && !showAvatar && (
          <div className="w-10 h-10 flex-shrink-0"></div>
        )}

        {/* Message Bubble */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`relative px-6 py-4 rounded-3xl shadow-lg backdrop-blur-sm ${
            isOwn
              ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-br-lg'
              : 'bg-white/80 text-gray-900 rounded-bl-lg border border-gray-200/50'
          }`}
        >
          {/* Message Content */}
          {renderMessageContent()}

          {/* Edited Indicator */}
          {message.isEdited && (
            <span className="text-xs opacity-70 italic">(edited)</span>
          )}

          {/* Message Status and Time */}
          <div className={`flex items-center ${isOwn ? 'justify-end' : 'justify-start'}`}>
            {renderMessageStatus()}
          </div>
        </motion.div>

        {/* Own Avatar */}
        {isOwn && showAvatar && (
          <div className="w-8 h-8 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-medium text-xs">
              {(message.sender?.fullName || message['sender.fullName'])?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
        )}

        {/* Spacer when no avatar is shown for own messages */}
        {isOwn && !showAvatar && (
          <div className="w-8 h-8 flex-shrink-0"></div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
