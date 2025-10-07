import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiPaperclip, FiSmile, FiMoreVertical, FiPhone, FiVideo, FiMic, FiSearch } from 'react-icons/fi';
import { sendMessage, addMessage, markAsRead, getChatDetails } from '../../store/slices/chatSlice';
import { socketService } from '../../services/api';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import FileUpload from './FileUpload';
import VoiceRecorder from './VoiceRecorder';
import ChatSearch from './ChatSearch';
import notificationService from '../../services/notificationService';

const ChatWindow = ({ chat }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  console.log('👤 ChatWindow: Current user ID:', user?.id);
  const { messages, isSendingMessage, typingUsers, onlineUsers } = useSelector((state) => state.chat);
  
  const [message, setMessage] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const otherParticipant = chat.participants?.find(p => p.id !== user?.id);
  
  // Check if other participant is online
  const isOtherParticipantOnline = otherParticipant && onlineUsers.includes(otherParticipant.id);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when chat is opened
  useEffect(() => {
    const chatId = chat?.id || chat?._id;
    if (chatId) {
      dispatch(markAsRead(chatId));
    }
  }, [chat?.id, chat?._id, dispatch]);

  // Set up socket listeners
  useEffect(() => {
    const chatId = chat?.id || chat?._id;
    if (chatId) {
      console.log('🚪 Joining chat room:', chatId);
      console.log('🔌 Socket connected:', socketService.isConnected);
      console.log('🔌 Socket object:', socketService.socket);
      console.log('🔌 Socket ID:', socketService.socket?.id);
      console.log('🔌 User ID:', user?.id);
      
      // Join chat room
      socketService.joinChat(chatId);
      console.log('🚪 Chat room join request sent for:', chatId);
      
      // Listen for new messages
      socketService.onReceiveMessage((messageData) => {
        console.log('🔔 Received message via socket:', messageData);
        console.log('🔔 Current chatId:', chatId);
        console.log('🔔 Message chatId:', messageData.chatId);
        console.log('🔔 Message sender:', messageData['sender.id'] || messageData.senderId);
        console.log('🔔 Current user:', user?.id);
        console.log('🔔 Is own message?', (messageData['sender.id'] || messageData.senderId) === (user?.id || user?._id));
        
        if (messageData.chatId === chatId) {
          console.log('✅ Message is for current chat, adding to state');
          console.log('🔔 Adding message to Redux state:', messageData);
          
          // For own messages, replace the optimistic message with the real one
          const isOwnMessage = (messageData['sender.id'] || messageData.senderId) === (user?.id || user?._id);
          if (isOwnMessage) {
            console.log('🔔 Own message received, replacing optimistic message');
            // Replace optimistic message with real message
            dispatch(addMessage({ ...messageData, replaceOptimistic: true }));
          } else {
            // For other users' messages, add normally
            dispatch(addMessage(messageData));
            
            // Show notification for incoming messages (only if not own message)
            console.log('🔔 Checking notification conditions:');
            console.log('🔔 canNotify():', notificationService.canNotify());
            console.log('🔔 sender.fullName:', messageData['sender.fullName']);
            console.log('🔔 messageData:', messageData);
            
            if (notificationService.canNotify() && messageData['sender.fullName']) {
              const senderName = messageData['sender.fullName'];
              const messageChatId = messageData.chatId;
              
              console.log('🔔 Showing notification for:', senderName, 'messageType:', messageData.messageType);
              
              if (messageData.messageType === 'audio') {
                notificationService.showVoiceNotification(senderName, messageChatId);
              } else if (messageData.messageType === 'image' || messageData.messageType === 'document' || messageData.messageType === 'file') {
                const fileName = messageData.attachments?.[0]?.name || 'File';
                notificationService.showFileNotification(senderName, fileName, messageChatId);
              } else {
                // Regular text message
                notificationService.showMessageNotification(senderName, messageData.content || '', messageChatId);
              }
            } else {
              console.log('🔔 Notification NOT shown - conditions not met');
            }
          }
        } else {
          console.log('❌ Message is for different chat:', messageData.chatId, 'current chat:', chatId);
        }
      });

      // Only poll if socket is not connected and no recent activity
      if (!socketService.isConnected) {
        console.log('⚠️ Socket not connected, setting up minimal polling');
        let lastPollTime = 0;
        const pollInterval = setInterval(() => {
          const now = Date.now();
          // Only poll every 10 seconds and only if no recent messages
          if (now - lastPollTime > 10000) {
            const lastMessage = messages[messages.length - 1];
            const shouldPoll = !lastMessage || (now - new Date(lastMessage.createdAt || lastMessage.created_at).getTime()) > 8000;
            
            if (shouldPoll) {
              console.log('🔄 Polling for new messages...');
              dispatch(getChatDetails({ chatId, params: { page: 1, limit: 50 } }));
              lastPollTime = now;
            } else {
              console.log('⏭️ Skipping poll - recent message detected');
            }
          }
        }, 5000); // Check every 5 seconds but only poll every 10 seconds

        return () => {
          clearInterval(pollInterval);
          console.log('🔄 Polling stopped for chat:', chatId);
        };
      }


      // Listen for typing indicators
      socketService.onUserTyping((data) => {
        if (data.chatId === chatId) {
          // Handle typing indicators
          console.log('User typing:', data);
        }
      });

      return () => {
        socketService.leaveChat(chatId);
      };
    }
  }, [chat?._id, chat?.id, dispatch]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!message.trim() || isSendingMessage) return;

    // Get chatId from chat object (try both id and _id)
    const chatId = chat?.id || chat?._id;
    
    if (!chatId) {
      console.error('No chat ID available:', chat);
      return;
    }

    const messageData = {
      content: message.trim(),
      messageType: 'text'
    };

    const senderId = user.id || user._id;
    
    // Create optimistic message for immediate UI update
    const optimisticMessage = {
      id: `temp-${Date.now()}`, // Temporary ID
      chatId,
      senderId,
      content: message.trim(),
      messageType: 'text',
      attachments: [],
      isRead: false,
      readBy: [],
      isEdited: false,
      editedAt: null,
      isDeleted: false,
      deletedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      'sender.id': senderId,
      'sender.fullName': user.fullName,
      'sender.profilePicture': user.profilePicture,
      'sender.userType': user.userType,
      isOptimistic: true // Flag to identify optimistic messages
    };

    // Add optimistic message immediately for instant UI feedback
    console.log('📤 Adding optimistic message:', optimisticMessage);
    console.log('📤 Dispatching addMessage action...');
    dispatch(addMessage(optimisticMessage));
    console.log('📤 Optimistic message dispatched - should appear instantly now');

    // Send message via socket
    console.log('📤 Sending message via socket:', { chatId, messageData, senderId });
    console.log('📤 Socket service status:', socketService.isConnected ? 'Connected' : 'Disconnected');
    console.log('📤 Socket object:', socketService.socket);
    
    // Always try Socket.io first, then fallback to API
    try {
      if (socketService.socket && socketService.isConnected) {
        socketService.sendMessage(chatId, messageData, senderId);
        console.log('✅ Message sent via Socket.io');
      } else {
        console.warn('⚠️ Socket not connected, using API fallback');
        // Fallback to API call if socket is not connected
        dispatch(sendMessage({ chatId, message: messageData }));
      }
    } catch (error) {
      console.error('❌ Socket error, using API fallback:', error);
      // Fallback to API call if socket fails
      dispatch(sendMessage({ chatId, message: messageData }));
    }
    
    setMessage('');
    setIsTyping(false);
    
    // Clear typing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    
    const chatId = chat?.id || chat?._id;
    if (!isTyping && chatId) {
      setIsTyping(true);
      socketService.startTyping(chatId, user.id);
    }
    
    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Set new timeout
    const timeout = setTimeout(() => {
      setIsTyping(false);
      const chatId = chat?.id || chat?._id;
      if (chatId) {
        socketService.stopTyping(chatId, user.id);
      }
    }, 1000);
    
    setTypingTimeout(timeout);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleManualRefresh = () => {
    const chatId = chat?.id || chat?._id;
    if (chatId) {
      console.log('🔄 Manual refresh triggered');
      dispatch(getChatDetails({ chatId, params: { page: 1, limit: 50 } }));
    }
  };

  const handleFileUpload = async (file) => {
    try {
      console.log('📁 Uploading file:', file.name, file.type, file.size);
      
      // Get chatId from chat object
      const chatId = chat?.id || chat?._id;
      if (!chatId) {
        console.error('No chat ID available for file upload');
        return;
      }
      
      // First upload the file to the backend
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadResponse = await fetch('http://localhost:5000/api/chat/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: formData
      });
      
      if (!uploadResponse.ok) {
        throw new Error('File upload failed');
      }
      
      const uploadResult = await uploadResponse.json();
      console.log('📤 File upload result:', uploadResult);
      
      // Determine message type based on file type
      let messageType = 'file';
      if (file.type.startsWith('image/')) {
        messageType = 'image';
      } else if (file.type === 'application/pdf' || file.type.includes('document')) {
        messageType = 'document';
      }
      
      // Create attachment object with server data
      const attachment = {
        name: file.name,
        type: file.type,
        size: file.size,
        url: `http://localhost:5000${uploadResult.data.url}`,
        filename: uploadResult.data.filename
      };
      
      // Send message with file attachment
      const messageData = {
        content: `📎 ${file.name}`,
        messageType: messageType,
        attachments: [attachment]
      };
      
      console.log('📤 Sending file message:', messageData);
      
      // Add optimistic message for sender immediately
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        chatId,
        senderId: user.id,
        content: messageData.content,
        messageType: messageData.messageType,
        attachments: messageData.attachments,
        isRead: false,
        readBy: [],
        isEdited: false,
        editedAt: null,
        isDeleted: false,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        'sender.id': user.id,
        'sender.fullName': user.fullName,
        'sender.profilePicture': user.profilePicture,
        'sender.userType': user.userType,
        isOptimistic: true // Flag to identify optimistic messages
      };
      
      // Add to Redux state immediately for sender
      dispatch(addMessage(optimisticMessage));
      
      // Send via socket for real-time delivery
      socketService.sendMessage(chatId, messageData, user.id);
      
    setShowFileUpload(false);
      console.log('✅ File uploaded and sent successfully');
      
    } catch (error) {
      console.error('❌ File upload failed:', error);
    }
  };

  const handleVoiceUpload = async (audioBlob) => {
    try {
      console.log('🎤 Uploading voice message:', audioBlob.size, 'bytes');
      
      // Get chatId from chat object
      const chatId = chat?.id || chat?._id;
      if (!chatId) {
        console.error('No chat ID available for voice upload');
        return;
      }
      
      // First upload the audio file to the backend
      const formData = new FormData();
      formData.append('file', audioBlob, 'voice-message.webm');
      
      const uploadResponse = await fetch('http://localhost:5000/api/chat/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: formData
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Voice upload failed');
      }
      
      const uploadResult = await uploadResponse.json();
      console.log('🎤 Voice upload result:', uploadResult);
      
      // Create attachment object with server data
      const attachment = {
        name: 'Voice Message',
        type: audioBlob.type || 'audio/webm',
        size: audioBlob.size,
        url: `http://localhost:5000${uploadResult.data.url}`,
        filename: uploadResult.data.filename,
        duration: Math.floor(audioBlob.size / 1000) // Rough duration estimate
      };
      
      console.log('🎤 Attachment created:', attachment);
      
      // Send voice message
      const messageData = {
        content: '🎤 Voice Message',
        messageType: 'audio',
        attachments: [attachment]
      };
      
      console.log('🎤 Sending voice message:', messageData);
      
      // Add optimistic message for sender immediately
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        chatId,
        senderId: user.id,
        content: messageData.content,
        messageType: messageData.messageType,
        attachments: messageData.attachments,
        isRead: false,
        readBy: [],
        isEdited: false,
        editedAt: null,
        isDeleted: false,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        'sender.id': user.id,
        'sender.fullName': user.fullName,
        'sender.profilePicture': user.profilePicture,
        'sender.userType': user.userType,
        isOptimistic: true
      };
      
      // Add to Redux state immediately for sender
      dispatch(addMessage(optimisticMessage));
      
      // Send via socket for real-time delivery
      socketService.sendMessage(chatId, messageData, user.id);
      
      console.log('✅ Voice message uploaded and sent successfully');
      
    } catch (error) {
      console.error('❌ Voice upload failed:', error);
    }
  };

  const handleSearchResult = (results, currentIndex = 0) => {
    setSearchResults(results);
    
    if (results.length > 0 && results[currentIndex]) {
      const targetMessage = results[currentIndex].message;
      setHighlightedMessageId(targetMessage.id);
      
      // Scroll to the message
      setTimeout(() => {
        const messageElement = document.getElementById(`message-${targetMessage.id}`);
        if (messageElement) {
          messageElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 100);
    } else {
      setHighlightedMessageId(null);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/10 to-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400/5 to-pink-400/5 rounded-full blur-3xl"></div>
      </div>
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200/50 bg-white/60 backdrop-blur-sm relative z-10">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 via-purple-500 to-health-500 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">
                {otherParticipant?.fullName?.charAt(0)?.toUpperCase() || 'D'}
              </span>
            </div>
            {isOtherParticipantOnline && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-3 border-white rounded-full shadow-lg">
                <div className="w-full h-full bg-green-400 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {otherParticipant?.fullName || 'Unknown User'}
            </h3>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isOtherParticipantOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <p className="text-sm text-gray-600">
                {otherParticipant?.userType === 'doctor' ? 'Doctor' : 'User'} • 
                {isOtherParticipantOnline ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowChatSearch(!showChatSearch)}
            className={`p-3 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md ${
              showChatSearch ? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white' : 'bg-white/60 text-gray-600 hover:bg-white/80 backdrop-blur-sm'
            }`}
            title="Search messages"
          >
            <FiSearch className="w-5 h-5" />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleManualRefresh}
            className="p-3 hover:bg-white/80 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md bg-white/60 backdrop-blur-sm"
            title="Refresh messages"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 hover:bg-white/80 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md bg-white/60 backdrop-blur-sm"
          >
            <FiPhone className="w-5 h-5 text-gray-600" />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 hover:bg-white/80 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md bg-white/60 backdrop-blur-sm"
          >
            <FiVideo className="w-5 h-5 text-gray-600" />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 hover:bg-white/80 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md bg-white/60 backdrop-blur-sm"
          >
            <FiMoreVertical className="w-5 h-5 text-gray-600" />
          </motion.button>
        </div>
      </div>

      {/* Chat Search */}
      {showChatSearch && (
        <ChatSearch
          messages={messages}
          onClose={() => setShowChatSearch(false)}
          onSearchResult={handleSearchResult}
        />
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 chat-scrollbar relative z-10">
        <AnimatePresence>
          {messages.map((msg, index) => (
            <motion.div
              key={msg.id || index}
              id={`message-${msg.id || index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <MessageBubble
                message={msg}
                isOwn={(() => {
                  // Handle both sender object and flattened sender properties
                  const senderId = msg.sender?.id || msg['sender.id'];
                  const currentUserId = user?.id || user?._id;
                  const isOwn = senderId === currentUserId;
                  console.log(`💬 Message: "${msg.content}" | Sender ID: ${senderId} | Current User ID: ${currentUserId} | Is Own: ${isOwn}`);
                  return isOwn;
                })()}
                showAvatar={index === 0 || ((messages[index - 1]?.sender?.id || messages[index - 1]?.['sender.id']) !== (msg.sender?.id || msg['sender.id']))}
                isHighlighted={highlightedMessageId === msg.id}
                searchResults={searchResults}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <TypingIndicator users={typingUsers} />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-6 border-t border-gray-200/50 bg-white/60 backdrop-blur-sm relative z-10">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-4">
          {/* File Upload Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setShowFileUpload(!showFileUpload)}
            className="p-3 text-gray-600 hover:text-gray-800 hover:bg-white/80 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md bg-white/60 backdrop-blur-sm"
          >
            <FiPaperclip className="w-6 h-6" />
          </motion.button>

          {/* Voice Message Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setShowVoiceRecorder(true)}
            className="p-3 text-gray-600 hover:text-gray-800 hover:bg-white/80 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md bg-white/60 backdrop-blur-sm"
          >
            <FiMic className="w-6 h-6" />
          </motion.button>

          {/* Message Input */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={message}
              onChange={handleTyping}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full px-6 py-4 border-2 border-gray-200/50 rounded-2xl resize-none focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-400 transition-all duration-300 shadow-sm hover:shadow-md bg-white/80 backdrop-blur-sm text-lg"
              rows={1}
              style={{ minHeight: '56px', maxHeight: '120px' }}
            />
            
            {/* Emoji Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <FiSmile className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Send Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!message.trim() || isSendingMessage}
            className="p-4 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-2xl hover:from-primary-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <FiSend className="w-6 h-6" />
          </motion.button>
        </form>

        {/* File Upload Modal */}
        {showFileUpload && (
          <FileUpload
            onFileUpload={handleFileUpload}
            onClose={() => setShowFileUpload(false)}
          />
        )}

        {/* Voice Recorder Modal */}
        {showVoiceRecorder && (
          <VoiceRecorder
            onVoiceUpload={handleVoiceUpload}
            onClose={() => setShowVoiceRecorder(false)}
          />
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
