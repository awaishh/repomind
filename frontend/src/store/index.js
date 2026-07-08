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
}));

export const useRepoStore = create((set, get) => ({
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

export const useChatStore = create((set, get) => ({
  chats: [],
  currentChat: null,
  messages: [],
  isLoading: false,
  isSending: false,

  fetchChats: async (repoId) => {
    try {
      const res = await api.get(`/chat/repo/${repoId}`);
      set({ chats: res.data.data });
    } catch {}
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
