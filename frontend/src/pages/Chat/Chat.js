import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageCircle, FiPlus, FiMoreVertical } from 'react-icons/fi';
import { getChatList, getChatDetails, setCurrentChat, createChat } from '../../store/slices/chatSlice';
import { getDoctors } from '../../store/slices/userSlice';
import ChatList from '../../components/Chat/ChatList';
import ChatWindow from '../../components/Chat/ChatWindow';
import DoctorList from '../../components/Chat/DoctorList';
import UserSearch from '../../components/Chat/UserSearch';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import NotificationPermission from '../../components/Notifications/NotificationPermission';

const Chat = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  
  const { user } = useSelector((state) => state.auth);
  const { chats = [], currentChat, isLoading, error } = useSelector((state) => state.chat || {});
  const { doctors = [], isLoading: doctorLoading } = useSelector((state) => state.user || {});
  
  const [view, setView] = useState('list'); // 'list', 'chat', 'doctors', 'users'
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    dispatch(getChatList({ page: 1, limit: 50 }));
    dispatch(getDoctors({ page: 1, limit: 20 }));
  }, [dispatch]);

  useEffect(() => {
    console.log('🔍 useEffect chatId - chatId:', chatId);
    console.log('🔍 useEffect chatId - currentChat:', currentChat);
    console.log('🔍 useEffect chatId - view:', view);
    
    if (chatId && chatId !== 'new' && chatId !== 'users') {
      console.log('🔍 useEffect chatId - dispatching getChatDetails for:', chatId);
      dispatch(getChatDetails({ chatId, params: { page: 1, limit: 50 } }));
      setView('chat');
    } else if (chatId === 'new') {
      setView('doctors');
    } else if (chatId === 'users') {
      setView('users');
    } else {
      setView('list');
    }
  }, [chatId, dispatch]);

  useEffect(() => {
    if (!chatId || chatId === '') {
      setView('list');
    }
  }, [chatId]);

  useEffect(() => {
    const urlSearchQuery = searchParams.get('search');
    if (urlSearchQuery) setSearchQuery(urlSearchQuery);
  }, [searchParams]);

  const handleChatSelect = (chat) => {
    console.log('🔍 handleChatSelect - chat:', chat);
    console.log('🔍 handleChatSelect - chatId:', chat.id || chat._id);
    dispatch(setCurrentChat(chat));
    const chatId = chat.id || chat._id;
    console.log('🔍 handleChatSelect - navigating to:', `/chat/${chatId}`);
    navigate(`/chat/${chatId}`);
    setView('chat');
  };

  const handleNewChat = () => setView('users');

  const handleUserSelect = async (selectedUser) => {
    if (!selectedUser || !selectedUser.id) return;

    const chatData = {
      participantId: selectedUser.id,
      chatType: 'direct'
    };
    
    const resultAction = await dispatch(createChat(chatData));
    if (createChat.fulfilled.match(resultAction)) {
      const newChat = resultAction.payload;
      dispatch(getChatList({ page: 1, limit: 50 }));
      if (newChat && (newChat.id || newChat._id)) {
        const chatId = newChat.id || newChat._id;
        navigate(`/chat/${chatId}`);
        setView('chat');
      }
    }
  };

  const handleBackToList = () => {
    navigate('/chat');
    setView('list');
  };


  const filteredChats = chats.filter(chat => {
    if (!chat || !chat.participants || !Array.isArray(chat.participants)) return false;

    const otherParticipant = chat.participants.find(p => {
      const participantId = p.id || p._id;
      const currentUserId = user?.id || user?._id;
      return participantId !== currentUserId;
    });

    if (!searchQuery.trim()) return true;

    return otherParticipant?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredDoctors = doctors.filter(doctor => 
    doctor.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doctor.specialization?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading && !chats.length) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {view === 'chat' && (
              <button onClick={handleBackToList} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h1 className="text-xl font-semibold text-gray-900">
              {view === 'list' && 'Messages'}
              {view === 'chat' && 'Chat'}
              {view === 'doctors' && 'Find Doctors'}
              {view === 'users' && 'Find Users'}
            </h1>
          </div>

          <div className="flex items-center space-x-2">
            {view === 'list' && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleNewChat}
                  className="px-3 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-1"
                >
                  <FiPlus className="h-4 w-4" />
                  <span>New Chat</span>
                </button>
              </div>
            )}

            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <FiMoreVertical className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        <AnimatePresence mode="wait">
          {view === 'list' && (
            <motion.div key="list" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="flex-1">
              <div className="p-4">
                <NotificationPermission />
              </div>
              <ChatList chats={filteredChats} onChatSelect={handleChatSelect} onNewChat={handleNewChat} searchQuery={searchQuery} currentUser={user} />
            </motion.div>
          )}

          {view === 'doctors' && (
            <motion.div key="doctors" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }} className="flex-1">
              <DoctorList
                doctors={filteredDoctors}
                isLoading={doctorLoading}
                onDoctorSelect={async (doctor) => {
                  const chatData = { participantId: doctor.id || doctor._id, chatType: 'direct' };
                  const resultAction = await dispatch(createChat(chatData));
                  if (createChat.fulfilled.match(resultAction)) {
                    const newChat = resultAction.payload;
                    dispatch(getChatList({ page: 1, limit: 50 }));
                    const chatId = newChat.id || newChat._id;
                    navigate(`/chat/${chatId}`);
                    setView('chat');
                  }
                }}
                onFindUserByPhone={() => setView('users')}
              />
            </motion.div>
          )}

          {view === 'users' && (
            <motion.div key="users" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }} className="flex-1">
              <UserSearch onUserSelect={handleUserSelect} onBack={handleBackToList} />
            </motion.div>
          )}

          {(() => {
            console.log('🔍 Render condition - view:', view);
            console.log('🔍 Render condition - currentChat:', currentChat);
            console.log('🔍 Render condition - view === "chat" && currentChat:', view === 'chat' && currentChat);
            return view === 'chat' && currentChat;
          })() && (
            <motion.div key="chat" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }} className="flex-1">
              <ChatWindow chat={currentChat} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default Chat;
