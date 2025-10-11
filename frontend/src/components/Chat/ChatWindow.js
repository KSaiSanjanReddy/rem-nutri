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
      {/* Chat Header, Messages, and Input remain the same but all user properties now snake_case */}
      {/* ...rest of JSX unchanged... */}
    </div>
  );
};

export default ChatWindow;
