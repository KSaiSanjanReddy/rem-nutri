import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userAPI } from '../../services/api';

// Async thunks
export const getDoctors = createAsyncThunk(
  'user/getDoctors',
  async (params, { rejectWithValue }) => {
    try {
      const response = await userAPI.getDoctors(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get doctors');
    }
  }
);

export const getDoctor = createAsyncThunk(
  'user/getDoctor',
  async (id, { rejectWithValue }) => {
    try {
      const response = await userAPI.getDoctor(id);
      return response.data.doctor;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get doctor');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'user/updateProfile',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await userAPI.updateProfile(userData);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

export const changePassword = createAsyncThunk(
  'user/changePassword',
  async (passwordData, { rejectWithValue }) => {
    try {
      const response = await userAPI.changePassword(passwordData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to change password');
    }
  }
);

const initialState = {
  doctors: [],
  currentDoctor: null,
  isLoading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalDoctors: 0,
    hasNext: false,
    hasPrev: false,
  },
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentDoctor: (state, action) => {
      state.currentDoctor = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get doctors
      .addCase(getDoctors.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getDoctors.fulfilled, (state, action) => {
        state.isLoading = false;
        state.doctors = action.payload.doctors;
        state.pagination = action.payload.pagination;
      })
      .addCase(getDoctors.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Get doctor
      .addCase(getDoctor.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getDoctor.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentDoctor = action.payload;
      })
      .addCase(getDoctor.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        // Profile updated successfully
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Change password
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
        // Password changed successfully
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setCurrentDoctor } = userSlice.actions;
export default userSlice.reducer;
