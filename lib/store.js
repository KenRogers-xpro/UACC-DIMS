import { create } from 'zustand'

export const useStore = create((set) => ({
  // Auth
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),

  // Notifications
  notifications: { incoming: [], outgoing: [] },
  unreadCount: 0,
  notificationsLastFetched: null,
  setNotifications: (data) => {
    if (Array.isArray(data)) {
      set({
        notifications: data,
        unreadCount: data.filter((n) => !n.read).length,
        notificationsLastFetched: Date.now(),
      })
    } else {
      const incoming = data?.incoming || []
      const outgoing = data?.outgoing || []
      set({
        notifications: data || { incoming: [], outgoing: [] },
        unreadCount: incoming.length + outgoing.length,
        notificationsLastFetched: Date.now(),
      })
    }
  },

  // Online users
  onlineUsers: [],
  setOnlineUsers: (users) => set({ onlineUsers: users }),

  // Insights unread count
  insightUnreadCount: 0,
  setInsightUnreadCount: (n) => set({ insightUnreadCount: n }),

  // Documents list cache
  documentsCache: {}, // keyed by state filter string
  setDocumentsCache: (key, data) =>
    set((s) => ({
      documentsCache: {
        ...s.documentsCache,
        [key]: { data, ts: Date.now() },
      },
    })),
  clearDocumentsCache: () => set({ documentsCache: {} }),
}))
