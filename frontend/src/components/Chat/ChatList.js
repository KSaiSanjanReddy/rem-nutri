import React from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiMessageCircle, FiSearch, FiPlus } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

const ChatList = ({ chats, onChatSelect, onNewChat, searchQuery, currentUser }) => {
  const { onlineUsers } = useSelector((state) => state.chat);

  const getPresenceText = (participant) => {
    if (!participant) return '';
    const participantId = participant.id || participant._id;
    return onlineUsers?.includes(participantId) ? 'Online' : 'Offline';
  };

  const getLastMessagePreview = (chat) => {
    if (!chat.lastMessage) {
      const otherParticipant = getOtherParticipant(chat);
      return getPresenceText(otherParticipant);
    }
    const content = chat.lastMessage.content;
    return content.length > 50 ? `${content.substring(0, 50)}...` : content;
  };

  const getOtherParticipant = (chat) => {
    if (!chat.participants || !Array.isArray(chat.participants)) return null;
    
    const currentUserId = currentUser?.id || currentUser?._id;
    
    return chat.participants.find(p => {
      const participantId = p.id || p._id;
      return participantId !== currentUserId;
    });
  };

  const getUnreadCount = (chat) => chat.unreadCount || 0;

  return (
    <div className="h-full flex flex-col">
      {chats.length === 0 && !searchQuery ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6"
          >
            <FiMessageCircle className="w-12 h-12 text-gray-400" />
          </motion.div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
          <p className="text-gray-500 mb-6 max-w-sm">
            Start a conversation with a doctor or health professional to get personalized health advice.
          </p>
          
          <button
            onClick={onNewChat}
            className="btn-primary flex items-center space-x-2"
          >
            <FiPlus className="w-4 h-4" />
            <span>Start New Chat</span>
          </button>
        </div>
      ) : chats.length === 0 && searchQuery ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <FiSearch className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-500">
            Try adjusting your search terms or start a new conversation.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-1 p-2">
            {chats.map((chat, index) => {
              const otherParticipant = getOtherParticipant(chat);
              const unreadCount = getUnreadCount(chat);
              const isOnline = otherParticipant && onlineUsers?.includes(otherParticipant.id || otherParticipant._id);
              
              console.log(`Rendering chat ${index}:`, otherParticipant?.full_name || 'No name');
              
              return (
                <motion.div
                  key={chat._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onChatSelect(chat)}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
                >
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-health-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {(otherParticipant?.full_name || otherParticipant?.name || otherParticipant?.display_name)?.charAt(0)?.toUpperCase() || 'D'}
                      </span>
                    </div>
                    {isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {otherParticipant?.full_name || otherParticipant?.name || otherParticipant?.display_name || 'Unknown User'}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {chat.lastActivity ? formatDistanceToNow(new Date(chat.lastActivity), { addSuffix: true }) : 'New'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-500 truncate">
                        {getLastMessagePreview(chat)}
                      </p>
                      {unreadCount > 0 && (
                        <span className="bg-primary-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatList;
