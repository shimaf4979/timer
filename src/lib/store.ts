import { create } from 'zustand';
import { Floor, MapData, Pin } from '@/types/map-types';
import { createStore } from 'zustand';
import { createContext, useContext, useRef } from 'react';

// 通知状態用の型
interface Notification {
  message: string;
  type: 'success' | 'error' | 'info';
  id: string; // ユニークなID
}

// UI状態の型
interface UIState {
  loading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
}

// UIステートの作成
export const useUIStore = create<UIState>((set) => ({
  loading: false,
  error: null,
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id: Date.now().toString() }],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));

// マップ編集状態の型
interface MapEditState {
  selectedFloorId: string | null;
  selectedPinId: string | null;
  isAddingPin: boolean;
  isEditingPin: boolean;
  newPinPosition: { x: number; y: number };
  setSelectedFloorId: (id: string | null) => void;
  setSelectedPinId: (id: string | null) => void;
  setIsAddingPin: (isAdding: boolean) => void;
  setIsEditingPin: (isEditing: boolean) => void;
  setNewPinPosition: (position: { x: number; y: number }) => void;
  resetPinEditing: () => void;
}

// マップ編集ステートの作成
export const useMapEditStore = create<MapEditState>((set) => ({
  selectedFloorId: null,
  selectedPinId: null,
  isAddingPin: false,
  isEditingPin: false,
  newPinPosition: { x: 0, y: 0 },
  setSelectedFloorId: (id) => set({ selectedFloorId: id }),
  setSelectedPinId: (id) => set({ selectedPinId: id }),
  setIsAddingPin: (isAdding) => set({ isAddingPin: isAdding }),
  setIsEditingPin: (isEditing) => set({ isEditingPin: isEditing }),
  setNewPinPosition: (position) => set({ newPinPosition: position }),
  resetPinEditing: () =>
    set({
      isAddingPin: false,
      isEditingPin: false,
      newPinPosition: { x: 0, y: 0 },
    }),
}));

// 公開編集用の型
interface PublicEditState {
  editorId: string | null;
  editorNickname: string | null;
  editorToken: string | null;
  setEditorInfo: (id: string, nickname: string, token: string) => void;
  clearEditorInfo: () => void;
}

// 公開編集ステートの作成
export const usePublicEditStore = create<PublicEditState>((set) => ({
  editorId: null,
  editorNickname: null,
  editorToken: null,
  setEditorInfo: (id, nickname, token) =>
    set({
      editorId: id,
      editorNickname: nickname,
      editorToken: token,
    }),
  clearEditorInfo: () =>
    set({
      editorId: null,
      editorNickname: null,
      editorToken: null,
    }),
}));
