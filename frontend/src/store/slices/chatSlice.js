import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { chatAPI } from '../../services/api';

// Async thunks
export const createChat = createAsyncThunk(
  'chat/createChat',
  async (chatData, { rejectWithValue }) => {
    try {
      const response = await chatAPI.createChat(chatData);
      console.log('Create chat response:', response.data);
      return response.data.data.chat;
    } catch (error) {
      console.error('Create chat error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to create chat');
    }
  }
);

export const getChatList = createAsyncThunk(
  'chat/getChatList',
  async (params, { rejectWithValue }) => {
    try {
      const response = await chatAPI.getChatList(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get chat list');
    }
  }
);

export const getChatDetails = createAsyncThunk(
  'chat/getChatDetails',
  async ({ chatId, params }, { rejectWithValue }) => {
    try {
      console.log('Fetching chat details for:', chatId, 'with params:', params);
      const response = await chatAPI.getChatDetails(chatId, params);
      console.log('Chat details response:', response.data);
      console.log('Response data structure:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      console.error('Failed to get chat details:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to get chat details');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ chatId, messageData }, { rejectWithValue }) => {
    try {
      const response = await chatAPI.sendMessage(chatId, messageData);
      return response.data.data.message;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send message');
    }
  }
);

export const uploadFile = createAsyncThunk(
  'chat/uploadFile',
  async ({ chatId, file }, { rejectWithValue }) => {
    try {
      const response = await chatAPI.uploadFile(chatId, file);
      return response.data.file;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload file');
    }
  }
);

export const editMessage = createAsyncThunk(
  'chat/editMessage',
  async ({ chatId, messageId, content }, { rejectWithValue }) => {
    try {
      const response = await chatAPI.editMessage(chatId, messageId, content);
      return response.data.message;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to edit message');
    }
  }
);

export const deleteMessage = createAsyncThunk(
  'chat/deleteMessage',
  async ({ chatId, messageId }, { rejectWithValue }) => {
    try {
      await chatAPI.deleteMessage(chatId, messageId);
      return messageId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete message');
    }
  }
);

export const markAsRead = createAsyncThunk(
  'chat/markAsRead',
  async (chatId, { rejectWithValue }) => {
    try {
      await chatAPI.markAsRead(chatId);
      return chatId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark as read');
    }
  }
);

const initialState = {
  chats: [],
  currentChat: null,
  messages: [],
  isLoading: false,
  isSendingMessage: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  },
  onlineUsers: [],
  typingUsers: [],
  unreadCount: 0,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentChat: (state, action) => {
      state.currentChat = action.payload;
    },
    addMessage: (state, action) => {
      console.log('🔔 addMessage called with:', action.payload);
      if (action.payload) {
        const newMessage = action.payload;
        console.log('🔔 New message details:', {
          id: newMessage.id,
          content: newMessage.content,
          senderId: newMessage.senderId,
          chatId: newMessage.chatId,
          replaceOptimistic: newMessage.replaceOptimistic
        });
        
        // If this is a replacement for optimistic message
        if (newMessage.replaceOptimistic) {
          console.log('🔔 Replacing optimistic message');
          // Remove optimistic message and add real message
          const originalLength = state.messages.length;
          state.messages = state.messages.filter(msg => 
            !(msg.isOptimistic && 
              msg.content === newMessage.content && 
              (msg.senderId === newMessage.senderId || msg['sender.id'] === newMessage['sender.id']))
          );
          state.messages.push({ ...newMessage, replaceOptimistic: undefined });
          console.log('✅ Optimistic message replaced with real message:', newMessage.content);
          console.log('✅ Messages before:', originalLength, 'after:', state.messages.length);
          return;
        }
        
        // Check if this message already exists (to prevent duplicates)
        // Only check by ID, not by content and time (which was too aggressive)
        const existingMessage = state.messages.find(msg => 
          msg.id === newMessage.id || 
          msg._id === newMessage._id
        );
        
        console.log('🔔 Existing message check:', existingMessage ? 'FOUND' : 'NOT FOUND');
        
        if (!existingMessage) {
          state.messages.push(newMessage);
          console.log('✅ Message added to Redux state:', newMessage.content);
          console.log('✅ Total messages in state:', state.messages.length);
        } else {
          console.log('⚠️ Duplicate message prevented:', newMessage.content);
        }
      } else {
        console.log('❌ addMessage called with empty payload');
      }
    },
    updateMessage: (state, action) => {
      if (action.payload && action.payload._id) {
        const index = state.messages.findIndex(msg => msg._id === action.payload._id);
        if (index !== -1) {
          state.messages[index] = action.payload;
        }
      }
    },
    removeMessage: (state, action) => {
      if (action.payload) {
        state.messages = state.messages.filter(msg => msg._id !== action.payload);
      }
    },
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload;
    },
    addOnlineUser: (state, action) => {
      const userId = action.payload;
      if (!state.onlineUsers.includes(userId)) {
        state.onlineUsers.push(userId);
      }
    },
    removeOnlineUser: (state, action) => {
      const userId = action.payload;
      state.onlineUsers = state.onlineUsers.filter(id => id !== userId);
    },
    updateUserStatus: (state, action) => {
      const { userId, status } = action.payload;
      if (status === 'online') {
        if (!state.onlineUsers.includes(userId)) {
          state.onlineUsers.push(userId);
        }
      } else if (status === 'offline') {
        state.onlineUsers = state.onlineUsers.filter(id => id !== userId);
      }
    },
    setTypingUsers: (state, action) => {
      state.typingUsers = action.payload;
    },
    addTypingUser: (state, action) => {
      if (!state.typingUsers.includes(action.payload)) {
        state.typingUsers.push(action.payload);
      }
    },
    removeTypingUser: (state, action) => {
      state.typingUsers = state.typingUsers.filter(userId => userId !== action.payload);
    },
    updateUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    updateChatLastMessage: (state, action) => {
      const { chatId, message } = action.payload;
      const chat = state.chats.find(c => c._id === chatId);
      if (chat) {
        chat.lastMessage = message;
        chat.lastActivity = new Date().toISOString();
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Create chat
      .addCase(createChat.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createChat.fulfilled, (state, action) => {
        state.isLoading = false;
        if (!state.chats) {
          state.chats = [];
        }
        state.chats.unshift(action.payload);
        state.currentChat = action.payload;
      })
      .addCase(createChat.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Get chat list
      .addCase(getChatList.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getChatList.fulfilled, (state, action) => {
        state.isLoading = false;
        console.log('getChatList.fulfilled - action.payload:', action.payload);
        console.log('getChatList.fulfilled - action.payload.data:', action.payload?.data);
        state.chats = action.payload?.data?.chats || [];
        state.pagination = action.payload?.data?.pagination || {
          currentPage: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        };
        console.log('getChatList.fulfilled - final chats:', state.chats);
        
        // Debug each chat's participants
        state.chats.forEach((chat, index) => {
          console.log(`Chat ${index} (${chat.id || chat._id}) participants:`, chat.participants);
        });
      })
      .addCase(getChatList.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Get chat details
      .addCase(getChatDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getChatDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        console.log('Chat details fulfilled with payload:', action.payload);
        state.currentChat = action.payload?.data?.chat || null;
        
        // Clear existing messages and set new ones for this chat
        const newMessages = action.payload?.data?.messages || [];
        state.messages = newMessages;
                
        console.log('📥 Set messages for chat, total count:', state.messages.length);
        
        state.pagination = action.payload?.data?.pagination || null;
        console.log('📥 Merged messages, total count:', state.messages.length);
        console.log('📥 Optimistic messages preserved:', state.messages.filter(m => m.isOptimistic).length);
      })
      .addCase(getChatDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Send message
      .addCase(sendMessage.pending, (state) => {
        state.isSendingMessage = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isSendingMessage = false;
        if (action.payload) {
          state.messages.push(action.payload);
          // Update chat's last message
          const chat = state.chats.find(c => c._id === action.payload.chat);
          if (chat) {
            chat.lastMessage = action.payload;
            chat.lastActivity = new Date().toISOString();
          }
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isSendingMessage = false;
        state.error = action.payload;
      })
      
      // Upload file
      .addCase(uploadFile.pending, (state) => {
        state.isSendingMessage = true;
        state.error = null;
      })
      .addCase(uploadFile.fulfilled, (state, action) => {
        state.isSendingMessage = false;
        // File uploaded successfully, now send as message
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.isSendingMessage = false;
        state.error = action.payload;
      })
      
      // Edit message
      .addCase(editMessage.fulfilled, (state, action) => {
        if (action.payload && action.payload._id) {
          const index = state.messages.findIndex(msg => msg._id === action.payload._id);
          if (index !== -1) {
            state.messages[index] = action.payload;
          }
        }
      })
      
      // Delete message
      .addCase(deleteMessage.fulfilled, (state, action) => {
        state.messages = state.messages.filter(msg => msg.id !== action.payload);
      })
      
      // Mark as read
      .addCase(markAsRead.fulfilled, (state, action) => {
        // Update messages as read
        state.messages.forEach(msg => {
          // Handle flattened sender data from backend
          const senderId = msg.sender?.id || msg['sender.id'];
          if (senderId !== action.payload && !msg.isRead) {
            msg.isRead = true;
          }
        });
      });
  },
});

export const {
  clearError,
  setCurrentChat,
  addMessage,
  updateMessage,
  removeMessage,
  setOnlineUsers,
  addOnlineUser,
  removeOnlineUser,
  updateUserStatus,
  setTypingUsers,
  addTypingUser,
  removeTypingUser,
  updateUnreadCount,
  clearMessages,
  updateChatLastMessage,
} = chatSlice.actions;

export default chatSlice.reducer;
