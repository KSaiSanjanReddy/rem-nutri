import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageCircle, FiSearch, FiPlus, FiMoreVertical } from 'react-icons/fi';
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
    // Load chats and doctors
    dispatch(getChatList({ page: 1, limit: 50 }));
    dispatch(getDoctors({ page: 1, limit: 20 }));
  }, [dispatch]);

  useEffect(() => {
    console.log('Chat component - chatId:', chatId);
    console.log('Chat component - current view:', view);
    
    // Load specific chat if chatId is provided
    if (chatId && chatId !== 'new' && chatId !== 'users') {
      console.log('Loading specific chat:', chatId);
      dispatch(getChatDetails({ chatId, params: { page: 1, limit: 50 } }));
      setView('chat');
    } else if (chatId === 'new') {
      console.log('Setting view to doctors');
      setView('doctors');
    } else if (chatId === 'users') {
      console.log('Setting view to users');
      setView('users');
    } else {
      // Default to chat list when no specific chatId
      console.log('No chatId - setting view to list');
      setView('list');
    }
  }, [chatId, dispatch]);

  // Force list view when no chatId
  useEffect(() => {
    if (!chatId || chatId === '') {
      setView('list');
    }
  }, [chatId]);

  // Handle search query from URL
  useEffect(() => {
    const urlSearchQuery = searchParams.get('search');
    console.log('🔍 URL search query:', urlSearchQuery);
    if (urlSearchQuery) {
      console.log('🔍 Setting search query to:', urlSearchQuery);
      setSearchQuery(urlSearchQuery);
    }
  }, [searchParams]);

  const handleChatSelect = (chat) => {
    console.log('Chat: handleChatSelect called with chat:', chat);
    console.log('Chat: Chat ID:', chat.id || chat._id);
    dispatch(setCurrentChat(chat));
    const chatId = chat.id || chat._id;
    console.log('Chat: Navigating to:', `/chat/${chatId}`);
    navigate(`/chat/${chatId}`);
    setView('chat');
  };

  const handleNewChat = () => {
    // Go directly to phone search for new chat
    setView('users');
  };

  const handleFindUsers = () => {
    navigate('/chat/users');
    setView('users');
  };

  const handleUserSelect = async (selectedUser) => {
    try {
      // Validate selectedUser
      if (!selectedUser || !selectedUser.id) {
        console.error('Invalid user selected:', selectedUser);
        return;
      }

      // Create chat with selected user
      const chatData = {
        participantId: selectedUser.id,
        chatType: 'direct'
      };
      
      const resultAction = await dispatch(createChat(chatData));
      
      if (createChat.fulfilled.match(resultAction)) {
        const newChat = resultAction.payload;
        console.log('Chat created successfully:', newChat);
        
        // Refresh chat list to include the new chat
        dispatch(getChatList({ page: 1, limit: 50 }));
        
        // Validate newChat before navigating
        if (newChat && (newChat.id || newChat._id)) {
          const chatId = newChat.id || newChat._id;
          navigate(`/chat/${chatId}`);
          setView('chat');
        } else {
          console.error('Invalid chat data received:', newChat);
        }
      } else {
        console.error('Failed to create chat:', resultAction.payload);
      }
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const handleBackToList = () => {
    navigate('/chat');
    setView('list');
  };

  const clearSearch = () => {
    setSearchQuery('');
    navigate('/chat');
  };

         const filteredChats = chats.filter(chat => {
           console.log('🔍 Filtering chat:', chat.id || chat._id);
           console.log('🔍 Chat participants:', chat.participants);
           console.log('🔍 Current user ID:', user?.id || user?._id);
           console.log('🔍 Current searchQuery:', searchQuery);
           
           if (!chat || !chat.participants || !Array.isArray(chat.participants)) {
             console.log('❌ Chat filtered out - invalid structure');
             return false;
           }
           
           const otherParticipant = chat.participants.find(p => {
             const participantId = p.id || p._id;
             const currentUserId = user?.id || user?._id;
             return participantId !== currentUserId;
           });
           
           console.log('🔍 Other participant found:', otherParticipant);
           console.log('🔍 Other participant fullName:', otherParticipant?.fullName);
           console.log('🔍 Search query:', searchQuery);
           
           // If no search query, show all chats
           if (!searchQuery.trim()) {
             console.log('✅ Chat included - no search query');
             return true;
           }
           
           // If search query exists, filter by participant name
           const matchesSearch = otherParticipant?.fullName?.toLowerCase().includes(searchQuery.toLowerCase());
           console.log('🔍 Matches search:', matchesSearch);
           return matchesSearch;
         });

         console.log('🔍 Final filteredChats:', filteredChats);

         console.log('Chat component - chats:', chats);
         console.log('Chat component - filteredChats:', filteredChats);
         console.log('Chat component - current view:', view);
         
         // Debug participant data
         chats.forEach((chat, index) => {
           console.log(`Chat ${index} participants:`, chat?.participants);
           console.log(`Chat ${index} current user:`, user);
         });

  const filteredDoctors = doctors.filter(doctor => 
    doctor.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
              <button
                onClick={handleBackToList}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
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
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <span className="text-lg">×</span>
                </button>
              )}
            </div>

                   {/* Action Buttons */}
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

            {/* More Options */}
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
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1"
            >
              {/* Notification Permission Banner */}
              <div className="p-4">
                <NotificationPermission />
              </div>
              
              <ChatList
                chats={filteredChats}
                onChatSelect={handleChatSelect}
                onNewChat={handleNewChat}
                searchQuery={searchQuery}
                currentUser={user}
              />
            </motion.div>
          )}

                 {view === 'doctors' && (
                   <motion.div
                     key="doctors"
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: 20 }}
                     transition={{ duration: 0.3 }}
                     className="flex-1"
                   >
                     <DoctorList
                       doctors={filteredDoctors}
                       isLoading={doctorLoading}
                       onDoctorSelect={async (doctor) => {
                         try {
                           // Create chat with doctor
                           const chatData = {
                             participantId: doctor.id || doctor._id,
                             chatType: 'direct'
                           };
                           
                           const resultAction = await dispatch(createChat(chatData));
                           
                           if (createChat.fulfilled.match(resultAction)) {
                             const newChat = resultAction.payload;
                             console.log('Chat created successfully:', newChat);
                             
                             // Refresh chat list to include the new chat
                             dispatch(getChatList({ page: 1, limit: 50 }));
                             
                             // Navigate to the new chat
                             const chatId = newChat.id || newChat._id;
                             navigate(`/chat/${chatId}`);
                             setView('chat');
                           } else {
                             console.error('Failed to create chat:', resultAction.payload);
                           }
                         } catch (error) {
                           console.error('Error creating chat:', error);
                         }
                       }}
                       onFindUserByPhone={() => {
                         setView('users');
                       }}
                     />
                   </motion.div>
                 )}

          {view === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="flex-1"
            >
              <UserSearch
                onUserSelect={handleUserSelect}
                onBack={handleBackToList}
              />
            </motion.div>
          )}

          {view === 'chat' && currentChat && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="flex-1"
            >
              <ChatWindow chat={currentChat} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default Chat;
