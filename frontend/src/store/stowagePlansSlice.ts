import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

// Types
export interface StowagePlan {
  id: number;
  name: string;
  description?: string;
  space_efficiency_score: number;
  accessibility_score: number;
  retrieval_time_score: number;
  overall_score: number;
  visualization_data: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateStowagePlanPayload {
  name: string;
  description?: string;
  visualization_data: string;
}

export interface UpdateStowagePlanPayload {
  id: number;
  name?: string;
  description?: string;
  space_efficiency_score?: number;
  accessibility_score?: number;
  retrieval_time_score?: number;
  overall_score?: number;
  visualization_data?: string;
}

export interface OptimizationPayload {
  container_id: number;
}

interface StowagePlansState {
  plans: StowagePlan[];
  selectedPlan: StowagePlan | null;
  loading: boolean;
  error: string | null;
  optimizationProgress: number;
}

// Initial state
const initialState: StowagePlansState = {
  plans: [],
  selectedPlan: null,
  loading: false,
  error: null,
  optimizationProgress: 0,
};

// API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Async thunks
export const fetchStowagePlans = createAsyncThunk(
  'stowagePlans/fetchStowagePlans',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/stowage-plans`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch stowage plans');
    }
  }
);

export const fetchStowagePlanById = createAsyncThunk(
  'stowagePlans/fetchStowagePlanById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/stowage-plans/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch stowage plan');
    }
  }
);

export const createStowagePlan = createAsyncThunk(
  'stowagePlans/createStowagePlan',
  async (plan: CreateStowagePlanPayload, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/api/stowage-plans`, plan);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to create stowage plan');
    }
  }
);

export const updateStowagePlan = createAsyncThunk(
  'stowagePlans/updateStowagePlan',
  async (plan: UpdateStowagePlanPayload, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_URL}/api/stowage-plans/${plan.id}`, 
        { ...plan, id: undefined }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to update stowage plan');
    }
  }
);

export const deleteStowagePlan = createAsyncThunk(
  'stowagePlans/deleteStowagePlan',
  async (id: number, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/api/stowage-plans/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to delete stowage plan');
    }
  }
);

export const optimizeStowage = createAsyncThunk(
  'stowagePlans/optimizeStowage',
  async (payload: OptimizationPayload, { rejectWithValue, dispatch }) => {
    try {
      // Reset progress
      dispatch(setOptimizationProgress(0));
      
      // Simulate progress updates (would be replaced with WebSocket in real implementation)
      const interval = setInterval(() => {
        dispatch(setOptimizationProgress(prev => Math.min(prev + 10, 90)));
      }, 300);
      
      // Actual API call
      const response = await axios.post(
        `${API_URL}/api/optimization/bin-packing`,
        { container_id: payload.container_id }
      );
      
      // Cleanup and set complete
      clearInterval(interval);
      dispatch(setOptimizationProgress(100));
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Optimization failed');
    }
  }
);

// Slice
const stowagePlansSlice = createSlice({
  name: 'stowagePlans',
  initialState,
  reducers: {
    clearSelectedPlan: (state) => {
      state.selectedPlan = null;
    },
    clearStowagePlansError: (state) => {
      state.error = null;
    },
    setOptimizationProgress: (state, action: PayloadAction<number | ((prev: number) => number)>) => {
      if (typeof action.payload === 'function') {
        const updateFn = action.payload;
        state.optimizationProgress = updateFn(state.optimizationProgress);
      } else {
        state.optimizationProgress = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch stowage plans
      .addCase(fetchStowagePlans.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStowagePlans.fulfilled, (state, action: PayloadAction<StowagePlan[]>) => {
        state.loading = false;
        state.plans = action.payload;
      })
      .addCase(fetchStowagePlans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch stowage plan by ID
      .addCase(fetchStowagePlanById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStowagePlanById.fulfilled, (state, action: PayloadAction<StowagePlan>) => {
        state.loading = false;
        state.selectedPlan = action.payload;
      })
      .addCase(fetchStowagePlanById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create stowage plan
      .addCase(createStowagePlan.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createStowagePlan.fulfilled, (state, action: PayloadAction<StowagePlan>) => {
        state.loading = false;
        state.plans.push(action.payload);
      })
      .addCase(createStowagePlan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update stowage plan
      .addCase(updateStowagePlan.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStowagePlan.fulfilled, (state, action: PayloadAction<StowagePlan>) => {
        state.loading = false;
        const index = state.plans.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.plans[index] = action.payload;
        }
        if (state.selectedPlan?.id === action.payload.id) {
          state.selectedPlan = action.payload;
        }
      })
      .addCase(updateStowagePlan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Delete stowage plan
      .addCase(deleteStowagePlan.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteStowagePlan.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        state.plans = state.plans.filter(p => p.id !== action.payload);
        if (state.selectedPlan?.id === action.payload) {
          state.selectedPlan = null;
        }
      })
      .addCase(deleteStowagePlan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Optimize stowage
      .addCase(optimizeStowage.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.optimizationProgress = 0;
      })
      .addCase(optimizeStowage.fulfilled, (state, action: PayloadAction<StowagePlan>) => {
        state.loading = false;
        state.optimizationProgress = 100;
        state.plans.push(action.payload);
        state.selectedPlan = action.payload;
      })
      .addCase(optimizeStowage.rejected, (state, action) => {
        state.loading = false;
        state.optimizationProgress = 0;
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearSelectedPlan, 
  clearStowagePlansError,
  setOptimizationProgress 
} = stowagePlansSlice.actions;

export default stowagePlansSlice.reducer; 