import { create } from "zustand";
import api from "../lib/api";

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),

  login: async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const { user, accessToken } = res.data.data;
    localStorage.setItem("accessToken", accessToken);
    set({ user, isAuthenticated: true, isLoading: false });
    return res.data;
  },

  register: async (username, email, password) => {
    const res = await api.post("/auth/register", { username, email, password });
    const { user, accessToken } = res.data.data;
    localStorage.setItem("accessToken", accessToken);
    set({ user, isAuthenticated: true, isLoading: false });
    return res.data;
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch {} // eslint-disable-line no-empty
    localStorage.removeItem("accessToken");
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  checkAuth: async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }
      const res = await api.get("/auth/me");
      set({ user: res.data.data, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem("accessToken");
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateProfile: async (profileData) => {
    const res = await api.patch("/auth/profile", profileData);
    const updatedUser = res.data.data;
    set({ user: updatedUser });
    return updatedUser;
  },

  updateAvatar: async (formData) => {
    const res = await api.patch("/auth/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const updatedUser = res.data.data;
    set({ user: updatedUser });
    return updatedUser;
  },

  fetchUserProfile: async (userId) => {
    const res = await api.get(`/auth/user/${userId}`);
    return res.data.data;
  },
}));

export const useRepoStore = create((set) => ({
  repos: [],
  currentRepo: null,
  isLoading: false,
  processingStatus: null,

  fetchRepos: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get("/repo");
      set({ repos: res.data.data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  cloneRepo: async (githubUrl) => {
    const res = await api.post("/repo/clone", { githubUrl });
    return res.data.data;
  },

  pollStatus: async (repoId) => {
    const res = await api.get(`/repo/${repoId}/status`);
    const repo = res.data.data;
    set({ processingStatus: repo.status });
    if (repo.status === "ready") {
      set({ currentRepo: repo });
    }
    return repo;
  },

  fetchRepo: async (repoId) => {
    const res = await api.get(`/repo/${repoId}`);
    set({ currentRepo: res.data.data });
    return res.data.data;
  },

  deleteRepo: async (repoId) => {
    await api.delete(`/repo/${repoId}`);
    set((state) => ({
      repos: state.repos.filter((r) => r._id !== repoId),
      currentRepo: state.currentRepo?._id === repoId ? null : state.currentRepo,
    }));
  },

  setCurrentRepo: (repo) => set({ currentRepo: repo }),
  clearProcessingStatus: () => set({ processingStatus: null }),
}));

export const useChatStore = create((set) => ({
  chats: [],
  currentChat: null,
  messages: [],
  isLoading: false,
  isSending: false,

  fetchChats: async (repoId) => {
    try {
      const res = await api.get(`/chat/repo/${repoId}`);
      set({ chats: res.data.data });
    } catch {} // eslint-disable-line no-empty
  },

  fetchChat: async (chatId) => {
    const res = await api.get(`/chat/${chatId}`);
    const chat = res.data.data;
    set({ currentChat: chat, messages: chat.messages });
    return chat;
  },

  sendMessage: async (repoId, message, scopedFiles = [], chatId = null) => {
    set({ isSending: true });

    // Add user message to UI immediately
    set((state) => ({
      messages: [...state.messages, { role: "user", content: message, sources: [] }],
    }));

    try {
      const res = await api.post("/chat/message", {
        repoId,
        message,
        scopedFiles,
        chatId,
      });

      const { chatId: newChatId, response, sources } = res.data.data;

      // Add assistant response
      set((state) => ({
        messages: [
          ...state.messages,
          { role: "assistant", content: response, sources },
        ],
        currentChat: { ...state.currentChat, _id: newChatId },
        isSending: false,
      }));

      return { chatId: newChatId, response, sources };
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Something went wrong. Please try again.";
      set((state) => ({
        messages: [
          ...state.messages,
          {
            role: "assistant",
            content: errMsg,
            sources: [],
          },
        ],
        isSending: false,
      }));
      throw err;
    }
  },

  clearChat: () => set({ currentChat: null, messages: [] }),

  deleteChat: async (chatId) => {
    await api.delete(`/chat/${chatId}`);
    set((state) => ({
      chats: state.chats.filter((c) => c._id !== chatId),
      currentChat: state.currentChat?._id === chatId ? null : state.currentChat,
      messages: state.currentChat?._id === chatId ? [] : state.messages,
    }));
  },
}));

export const useRoomStore = create((set, get) => ({
  rooms: [],
  activeRoom: null,
  messages: [],
  isLoadingRooms: false,
  isLoadingMessages: false,
  typingUsers: [],

  fetchRooms: async () => {
    set({ isLoadingRooms: true });
    try {
      const res = await api.get("/rooms");
      const rooms = res.data.data || [];
      set({ rooms, isLoadingRooms: false });
      return rooms;
    } catch {
      set({ isLoadingRooms: false });
      return [];
    }
  },

  createRoom: async (roomData) => {
    const res = await api.post("/rooms", roomData);
    const newRoom = res.data.data;
    set((state) => ({
      rooms: [newRoom, ...state.rooms],
      activeRoom: newRoom,
      messages: [],
    }));
    return newRoom;
  },

  joinRoomByCode: async (code) => {
    const res = await api.post("/rooms/join", { code });
    const joinedRoom = res.data.data;
    set((state) => {
      const exists = state.rooms.some((r) => r._id === joinedRoom._id);
      return {
        rooms: exists
          ? state.rooms.map((r) => (r._id === joinedRoom._id ? joinedRoom : r))
          : [joinedRoom, ...state.rooms],
        activeRoom: joinedRoom,
      };
    });
    return joinedRoom;
  },

  fetchRoomPreview: async (code) => {
    const res = await api.get(`/rooms/code/${code}`);
    return res.data.data;
  },

  fetchRoom: async (roomId) => {
    const res = await api.get(`/rooms/${roomId}`);
    const room = res.data.data;
    set({ activeRoom: room });
    return room;
  },

  fetchMessages: async (roomId) => {
    set({ isLoadingMessages: true });
    try {
      const res = await api.get(`/rooms/${roomId}/messages`);
      const messages = res.data.data || [];
      set({ messages, isLoadingMessages: false });
      return messages;
    } catch {
      set({ isLoadingMessages: false });
      return [];
    }
  },

  setActiveRoom: (room) => {
    set({ activeRoom: room, messages: [], typingUsers: [] });
  },

  addMessage: (message) => {
    const { activeRoom, messages, rooms } = get();
    if (!message || !message.room) return;

    // Update rooms list last message
    const updatedRooms = rooms.map((r) =>
      r._id === message.room
        ? {
            ...r,
            lastMessage: message,
            updatedAt: message.createdAt || new Date().toISOString(),
          }
        : r
    );

    // If message is for currently active room, append it (deduplicating)
    if (activeRoom && activeRoom._id === message.room) {
      const exists = messages.some((m) => m._id === message._id);
      if (!exists) {
        set({
          messages: [...messages, message],
          rooms: updatedRooms,
        });
        return;
      }
    }

    set({ rooms: updatedRooms });
  },

  setUserTyping: (user) => {
    if (!user?._id) return;
    set((state) => {
      const filtered = state.typingUsers.filter((u) => u._id !== user._id);
      return { typingUsers: [...filtered, user] };
    });
  },

  removeUserTyping: (userId) => {
    set((state) => ({
      typingUsers: state.typingUsers.filter((u) => u._id !== userId),
    }));
  },

  leaveRoom: async (roomId) => {
    await api.post(`/rooms/${roomId}/leave`);
    set((state) => ({
      rooms: state.rooms.filter((r) => r._id !== roomId),
      activeRoom: state.activeRoom?._id === roomId ? null : state.activeRoom,
      messages: state.activeRoom?._id === roomId ? [] : state.messages,
    }));
  },
}));
