import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiPaperclip, FiSmile, FiMoreVertical, FiPhone, FiVideo, FiMic, FiSearch, FiMessageCircle } from 'react-icons/fi';
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
  console.log('🤖 ChatWindow: Current user ID:', user?.id);
  const { messages, isSendingMessage, typingUsers, onlineUsers } = useSelector((state) => state.chat);
  
  // Debug logging
  console.log('🔍 ChatWindow - messages from Redux:', messages);
  console.log('🔍 ChatWindow - messages length:', messages?.length);
  console.log('🔍 ChatWindow - messages type:', typeof messages);
  console.log('🔍 ChatWindow - messages is array:', Array.isArray(messages));
  console.log('🔍 ChatWindow - messages condition:', messages && messages.length > 0);

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

  const isOtherParticipantOnline = otherParticipant && onlineUsers.includes(otherParticipant.id);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const chatId = chat?.id || chat?._id;
    if (chatId) {
      dispatch(markAsRead(chatId));
    }
  }, [chat?.id, chat?._id, dispatch]);

  useEffect(() => {
    const chatId = chat?.id || chat?._id;
    if (chatId) {
      socketService.joinChat(chatId);

      socketService.onReceiveMessage((messageData) => {
        if (messageData.chatId === chatId) {
          const isOwnMessage = (messageData['sender.id'] || messageData.senderId) === (user?.id || user?._id);
          if (isOwnMessage) {
            dispatch(addMessage({ ...messageData, replaceOptimistic: true }));
          } else {
            dispatch(addMessage(messageData));

            if (notificationService.canNotify() && messageData['sender.full_name']) {
              const senderName = messageData['sender.full_name'];
              const messageChatId = messageData.chatId;

              if (messageData.messageType === 'audio') {
                notificationService.showVoiceNotification(senderName, messageChatId);
              } else if (messageData.messageType === 'image' || messageData.messageType === 'document' || messageData.messageType === 'file') {
                const fileName = messageData.attachments?.[0]?.name || 'File';
                notificationService.showFileNotification(senderName, fileName, messageChatId);
              } else {
                notificationService.showMessageNotification(senderName, messageData.content || '', messageChatId);
              }
            }
          }
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

    const chatId = chat?.id || chat?._id;
    if (!chatId) return;

    const messageData = {
      content: message.trim(),
      messageType: 'text'
    };

    const senderId = user.id || user._id;

    const optimisticMessage = {
      id: `temp-${Date.now()}`,
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
      'sender.full_name': user.full_name,
      'sender.profile_picture': user.profile_picture,
      'sender.user_type': user.user_type,
      'sender.date_of_birth': user.date_of_birth,
      'sender.license_number': user.license_number,
      'sender.consultation_fee': user.consultation_fee,
      'sender.is_email_verified': user.is_email_verified,
      'sender.is_mobile_verified': user.is_mobile_verified,
      'sender.is_active': user.is_active,
      isOptimistic: true
    };

    dispatch(addMessage(optimisticMessage));

    try {
      if (socketService.socket && socketService.isConnected) {
        socketService.sendMessage(chatId, messageData, senderId);
      } else {
        dispatch(sendMessage({ chatId, message: messageData }));
      }
    } catch (error) {
      dispatch(sendMessage({ chatId, message: messageData }));
    }

    setMessage('');
    setIsTyping(false);
    if (typingTimeout) clearTimeout(typingTimeout);
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);

    const chatId = chat?.id || chat?._id;
    if (!isTyping && chatId) {
      setIsTyping(true);
      socketService.startTyping(chatId, user.id);
    }

    if (typingTimeout) clearTimeout(typingTimeout);

    const timeout = setTimeout(() => {
      setIsTyping(false);
      if (chatId) socketService.stopTyping(chatId, user.id);
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
    if (chatId) dispatch(getChatDetails({ chatId, params: { page: 1, limit: 50 } }));
  };

  const handleFileUpload = async (file) => {
    try {
      const chatId = chat?.id || chat?._id;
      if (!chatId) return;

      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('http://localhost:5000/api/chat/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
        body: formData
      });

      if (!uploadResponse.ok) throw new Error('File upload failed');
      const uploadResult = await uploadResponse.json();

      let messageType = 'file';
      if (file.type.startsWith('image/')) messageType = 'image';
      else if (file.type === 'application/pdf' || file.type.includes('document')) messageType = 'document';

      const attachment = {
        name: file.name,
        type: file.type,
        size: file.size,
        url: `http://localhost:5000${uploadResult.data.url}`,
        filename: uploadResult.data.filename
      };

      const messageData = {
        content: `📎 ${file.name}`,
        messageType,
        attachments: [attachment]
      };

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
        'sender.full_name': user.full_name,
        'sender.profile_picture': user.profile_picture,
        'sender.user_type': user.user_type,
        'sender.date_of_birth': user.date_of_birth,
        'sender.license_number': user.license_number,
        'sender.consultation_fee': user.consultation_fee,
        'sender.is_email_verified': user.is_email_verified,
        'sender.is_mobile_verified': user.is_mobile_verified,
        'sender.is_active': user.is_active,
        isOptimistic: true
      };

      dispatch(addMessage(optimisticMessage));
      socketService.sendMessage(chatId, messageData, user.id);
      setShowFileUpload(false);
    } catch (error) {
      console.error('❌ File upload failed:', error);
    }
  };

  const handleVoiceUpload = async (audioBlob) => {
    try {
      const chatId = chat?.id || chat?._id;
      if (!chatId) return;

      const formData = new FormData();
      formData.append('file', audioBlob, 'voice-message.webm');

      const uploadResponse = await fetch('http://localhost:5000/api/chat/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
        body: formData
      });

      if (!uploadResponse.ok) throw new Error('Voice upload failed');
      const uploadResult = await uploadResponse.json();

      const attachment = {
        name: 'Voice Message',
        type: audioBlob.type || 'audio/webm',
        size: audioBlob.size,
        url: `http://localhost:5000${uploadResult.data.url}`,
        filename: uploadResult.data.filename,
        duration: Math.floor(audioBlob.size / 1000)
      };

      const messageData = {
        content: '🎤 Voice Message',
        messageType: 'audio',
        attachments: [attachment]
      };

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
        'sender.full_name': user.full_name,
        'sender.profile_picture': user.profile_picture,
        'sender.user_type': user.user_type,
        'sender.date_of_birth': user.date_of_birth,
        'sender.license_number': user.license_number,
        'sender.consultation_fee': user.consultation_fee,
        'sender.is_email_verified': user.is_email_verified,
        'sender.is_mobile_verified': user.is_mobile_verified,
        'sender.is_active': user.is_active,
        isOptimistic: true
      };

      dispatch(addMessage(optimisticMessage));
      socketService.sendMessage(chatId, messageData, user.id);
    } catch (error) {
      console.error('❌ Voice upload failed:', error);
    }
  };

  const handleSearchResult = (results, currentIndex = 0) => {
    setSearchResults(results);

    if (results.length > 0 && results[currentIndex]) {
      const targetMessage = results[currentIndex].message;
      setHighlightedMessageId(targetMessage.id);

      setTimeout(() => {
        const messageElement = document.getElementById(`message-${targetMessage.id}`);
        if (messageElement) messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } else {
      setHighlightedMessageId(null);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 relative overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={otherParticipant?.profile_picture || 'https://via.placeholder.com/40'}
                alt={otherParticipant?.full_name}
                className="w-10 h-10 rounded-full object-cover"
              />
              {isOtherParticipantOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              )}
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">{otherParticipant?.full_name || 'Unknown User'}</h2>
              <p className="text-sm text-slate-500">
                {isOtherParticipantOnline ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowChatSearch(!showChatSearch)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Search messages"
          >
            <FiSearch size={20} className="text-slate-600" />
          </button>
          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Call">
            <FiPhone size={20} className="text-slate-600" />
          </button>
          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Video call">
            <FiVideo size={20} className="text-slate-600" />
          </button>
          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <FiMoreVertical size={20} className="text-slate-600" />
          </button>
        </div>
      </div>

      {/* Chat Search */}
      {showChatSearch && (
        <div className="bg-white border-b border-slate-200">
          <ChatSearch chat={chat} onSearchResult={handleSearchResult} />
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {(() => {
          console.log('🔍 Render condition - messages:', messages);
          console.log('🔍 Render condition - messages && messages.length > 0:', messages && messages.length > 0);
          return messages && messages.length > 0;
        })() ? (
          <AnimatePresence>
            {messages.map((msg, index) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                id={`message-${msg.id}`}
                className={highlightedMessageId === msg.id ? 'bg-yellow-100 rounded-lg p-2' : ''}
              >
                <MessageBubble
                  message={msg}
                  isOwn={(msg['sender.id'] || msg.senderId) === (user?.id || user?._id)}
                  highlighted={highlightedMessageId === msg.id}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FiMessageCircle className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
            <p className="text-gray-500 max-w-sm">
              Start the conversation by sending your first message below.
            </p>
          </div>
        )}

        {typingUsers && typingUsers.length > 0 && (
          <TypingIndicator users={typingUsers} />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Form */}
      <div className="border-t border-slate-200 bg-white/80 backdrop-blur-sm p-4">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <button
            type="button"
            onClick={() => setShowFileUpload(!showFileUpload)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-800"
            title="Attach file"
          >
            <FiPaperclip size={20} />
          </button>

          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={message}
              onChange={handleTyping}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 resize-none"
              rows="1"
              style={{ maxHeight: '120px' }}
            />
          </div>

          <button
            type="button"
            onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-800"
            title="Voice message"
          >
            <FiMic size={20} />
          </button>

          <button
            type="submit"
            disabled={!message.trim() || isSendingMessage}
            className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg transition-colors"
            title="Send message"
          >
            <FiSend size={20} />
          </button>
        </form>

        {/* File Upload Modal */}
        {showFileUpload && (
          <div className="mt-4">
            <FileUpload onUpload={handleFileUpload} onClose={() => setShowFileUpload(false)} />
          </div>
        )}

        {/* Voice Recorder Modal */}
        {showVoiceRecorder && (
          <div className="mt-4">
            <VoiceRecorder onUpload={handleVoiceUpload} onClose={() => setShowVoiceRecorder(false)} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;