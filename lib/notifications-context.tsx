"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react"
import { useAuth } from "./auth-context"
import api from "./api"

interface Notification {
  id: number
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
  orderId?: number
}

interface NotificationsContextType {
  notifications: Notification[]
  unreadCount: number
  fetchNotifications: () => Promise<void>
  markAsRead: (id: number) => Promise<void>
  markAllAsRead: () => Promise<void>
  isLoading: boolean
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const fetchNotifications = useCallback(async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const [listRes, countRes] = await Promise.all([
        api.get("/notifications"),
        api.get("/notifications/unread-count"),
      ])

      setNotifications(listRes.data)
      setUnreadCount(countRes.data.count)
    } catch (error) {
      console.error("Помилка при завантаженні сповіщень:", error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // Початкове завантаження та очищення при виході
  useEffect(() => {
    if (user) {
      fetchNotifications()
      const interval = setInterval(fetchNotifications, 60000) // Опитування раз на хвилину
      return () => clearInterval(interval)
    } else {
      setNotifications([])
      setUnreadCount(0)
    }
  }, [user, fetchNotifications])

  // Оптимистичное обновление для быстрого отклика UI
  const markAsRead = useCallback(async (id: number) => {
    // Сначала обновляем локальный стейт (UI реагирует мгновенно)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))

    try {
      await api.patch(`/notifications/${id}/read`)
    } catch (error) {
      // Если запрос не удался — откатываем стейт
      console.error("Ошибка markAsRead:", error)
      fetchNotifications()
    }
  }, [fetchNotifications])

  const markAllAsRead = useCallback(async () => {
    // Оптимистичное обновление
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)

    try {
      await api.patch("/notifications/read-all")
    } catch (error) {
      console.error("Помилка markAllAsRead:", error)
      fetchNotifications()
    }
  }, [fetchNotifications])

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    isLoading
  }), [notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead, isLoading])

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationsContext)
  if (!context) throw new Error("useNotifications must be used within NotificationsProvider")
  return context
}