import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

// Types
export interface Container {
  id: number;
  name: string;
  location: string;
  width: number;
  height: number;
  depth: number;
  max_weight: number;
  current_weight: number;
  volume_used: number;
  created_at: string;
  updated_at?: string;
}

export interface CreateContainerPayload {
  name: string;
  location: string;
  width: number;
  height: number;
  depth: number;
  max_weight: number;
}

export interface UpdateContainerPayload {
  id: number;
  name?: string;
  location?: string;
  width?: number;
  height?: number;
  depth?: number;
  max_weight?: number;
  current_weight?: number;
  volume_used?: number;
}

interface ContainersState {
  containers: Container[];
  selectedContainer: Container | null;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: ContainersState = {
  containers: [],
  selectedContainer: null,
  loading: false,
  error: null,
};

// API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Async thunks
export const fetchContainers = createAsyncThunk(
  'containers/fetchContainers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/containers`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch containers');
    }
  }
);

export const fetchContainerById = createAsyncThunk(
  'containers/fetchContainerById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/containers/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch container');
    }
  }
);

export const createContainer = createAsyncThunk(
  'containers/createContainer',
  async (container: CreateContainerPayload, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/api/containers`, container);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to create container');
    }
  }
);

export const updateContainer = createAsyncThunk(
  'containers/updateContainer',
  async (container: UpdateContainerPayload, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_URL}/api/containers/${container.id}`, 
        { ...container, id: undefined }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to update container');
    }
  }
);

export const deleteContainer = createAsyncThunk(
  'containers/deleteContainer',
  async (id: number, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/api/containers/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to delete container');
    }
  }
);

// Slice
const containersSlice = createSlice({
  name: 'containers',
  initialState,
  reducers: {
    clearSelectedContainer: (state) => {
      state.selectedContainer = null;
    },
    clearContainersError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch containers
      .addCase(fetchContainers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContainers.fulfilled, (state, action: PayloadAction<Container[]>) => {
        state.loading = false;
        state.containers = action.payload;
      })
      .addCase(fetchContainers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch container by ID
      .addCase(fetchContainerById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContainerById.fulfilled, (state, action: PayloadAction<Container>) => {
        state.loading = false;
        state.selectedContainer = action.payload;
      })
      .addCase(fetchContainerById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create container
      .addCase(createContainer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createContainer.fulfilled, (state, action: PayloadAction<Container>) => {
        state.loading = false;
        state.containers.push(action.payload);
      })
      .addCase(createContainer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update container
      .addCase(updateContainer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateContainer.fulfilled, (state, action: PayloadAction<Container>) => {
        state.loading = false;
        const index = state.containers.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.containers[index] = action.payload;
        }
        if (state.selectedContainer?.id === action.payload.id) {
          state.selectedContainer = action.payload;
        }
      })
      .addCase(updateContainer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Delete container
      .addCase(deleteContainer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteContainer.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        state.containers = state.containers.filter(c => c.id !== action.payload);
        if (state.selectedContainer?.id === action.payload) {
          state.selectedContainer = null;
        }
      })
      .addCase(deleteContainer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearSelectedContainer, clearContainersError } = containersSlice.actions;
export default containersSlice.reducer; 