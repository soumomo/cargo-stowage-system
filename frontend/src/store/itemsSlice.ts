import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

// Types
export interface Item {
  id: number;
  name: string;
  category: string;
  width: number;
  height: number;
  depth: number;
  weight: number;
  priority: number;
  expiry_date?: string;
  is_fragile: boolean;
  is_hazardous: boolean;
  position_x: number;
  position_y: number;
  position_z: number;
  rotation_x: number;
  rotation_y: number;
  rotation_z: number;
  created_at: string;
  updated_at?: string;
}

export interface CreateItemPayload {
  name: string;
  category: string;
  width: number;
  height: number;
  depth: number;
  weight: number;
  priority?: number;
  expiry_date?: string;
  is_fragile?: boolean;
  is_hazardous?: boolean;
}

export interface UpdateItemPayload {
  id: number;
  name?: string;
  category?: string;
  width?: number;
  height?: number;
  depth?: number;
  weight?: number;
  priority?: number;
  expiry_date?: string;
  is_fragile?: boolean;
  is_hazardous?: boolean;
  position_x?: number;
  position_y?: number;
  position_z?: number;
  rotation_x?: number;
  rotation_y?: number;
  rotation_z?: number;
}

export interface ItemPositionPayload {
  item_id: number;
  container_id: number;
  position_x: number;
  position_y: number;
  position_z: number;
  rotation_x?: number;
  rotation_y?: number;
  rotation_z?: number;
}

interface ItemsState {
  items: Item[];
  selectedItem: Item | null;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: ItemsState = {
  items: [],
  selectedItem: null,
  loading: false,
  error: null,
};

// API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Async thunks
export const fetchItems = createAsyncThunk(
  'items/fetchItems',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/items`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch items');
    }
  }
);

export const fetchItemById = createAsyncThunk(
  'items/fetchItemById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/items/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch item');
    }
  }
);

export const createItem = createAsyncThunk(
  'items/createItem',
  async (item: CreateItemPayload, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/api/items`, item);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to create item');
    }
  }
);

export const updateItem = createAsyncThunk(
  'items/updateItem',
  async (item: UpdateItemPayload, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_URL}/api/items/${item.id}`, 
        { ...item, id: undefined }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to update item');
    }
  }
);

export const deleteItem = createAsyncThunk(
  'items/deleteItem',
  async (id: number, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/api/items/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to delete item');
    }
  }
);

export const updateItemPosition = createAsyncThunk(
  'items/updateItemPosition',
  async (payload: ItemPositionPayload, { rejectWithValue }) => {
    try {
      const { item_id, ...data } = payload;
      const response = await axios.post(
        `${API_URL}/api/items/${item_id}/position`,
        data
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to update item position');
    }
  }
);

// Slice
const itemsSlice = createSlice({
  name: 'items',
  initialState,
  reducers: {
    clearSelectedItem: (state) => {
      state.selectedItem = null;
    },
    clearItemsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch items
      .addCase(fetchItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchItems.fulfilled, (state, action: PayloadAction<Item[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch item by ID
      .addCase(fetchItemById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchItemById.fulfilled, (state, action: PayloadAction<Item>) => {
        state.loading = false;
        state.selectedItem = action.payload;
      })
      .addCase(fetchItemById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create item
      .addCase(createItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createItem.fulfilled, (state, action: PayloadAction<Item>) => {
        state.loading = false;
        state.items.push(action.payload);
      })
      .addCase(createItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update item
      .addCase(updateItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateItem.fulfilled, (state, action: PayloadAction<Item>) => {
        state.loading = false;
        const index = state.items.findIndex(i => i.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.selectedItem?.id === action.payload.id) {
          state.selectedItem = action.payload;
        }
      })
      .addCase(updateItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Delete item
      .addCase(deleteItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteItem.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        state.items = state.items.filter(i => i.id !== action.payload);
        if (state.selectedItem?.id === action.payload) {
          state.selectedItem = null;
        }
      })
      .addCase(deleteItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update item position
      .addCase(updateItemPosition.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateItemPosition.fulfilled, (state, action: PayloadAction<Item>) => {
        state.loading = false;
        const index = state.items.findIndex(i => i.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.selectedItem?.id === action.payload.id) {
          state.selectedItem = action.payload;
        }
      })
      .addCase(updateItemPosition.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearSelectedItem, clearItemsError } = itemsSlice.actions;
export default itemsSlice.reducer; 