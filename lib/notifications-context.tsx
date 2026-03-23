"use client"

import React, { createContext, useContext, useCallback, useMemo, useRef, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "./auth-context"
import api from "./api"
import { useToast } from "@/components/ui/use-toast"
import { useSettings } from "./settings-context"

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
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { settings } = useSettings()

  // 1. Запит для списку сповіщень
  const { data: notifications = [], isLoading: isListLoading, refetch: refetchList } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      try {
        const res = await api.get("/notifications")
        return res.data as Notification[]
      } catch (e) {
        return []
      }
    },
    enabled: !!user,
  })

  // 2. Запит для рахунку (полінг кожну хвилину, лише якщо сповіщення увімкнені)
  const { data: unreadCount = 0, isLoading: isCountLoading, refetch: refetchCount } = useQuery({
    queryKey: ["notifications_count"],
    queryFn: async () => {
      try {
        const res = await api.get("/notifications/unread-count")
        return res.data?.count || 0
      } catch (e) {
        return 0
      }
    },
    enabled: !!user,
    refetchInterval: settings.notificationsEnabled ? 60000 : false,
  })

  const isLoading = isListLoading || isCountLoading

  // Тостинг нового сповіщення (лише якщо сповіщення увімкнені)
  const prevUnreadCount = useRef(0)
  useEffect(() => {
    if (!settings.notificationsEnabled) {
      prevUnreadCount.current = unreadCount
      return
    }

    if (unreadCount > prevUnreadCount.current && prevUnreadCount.current !== 0) {
      toast({
        title: "Нове сповіщення",
        description: "У вас є нові непрочитані сповіщення.",
      })

      // Відтворити звук якщо увімкнено
      if (settings.soundEnabled) {
        try {
          const audio = new Audio("/notification.mp3")
          audio.volume = 0.3
          audio.play().catch(() => {
            // Ignore play errors (autoplay policy)
          })
        } catch {
          // Ignore audio errors
        }
      }
    }
    prevUnreadCount.current = unreadCount
  }, [unreadCount, toast, settings.notificationsEnabled, settings.soundEnabled])

  // Мутація: прочитати одне
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.patch(`/notifications/${id}/read`)
    },
    onMutate: async (id) => {
      // Оптимістичне оновлення перед тим, як дочекаємось відповіді
      await queryClient.cancelQueries({ queryKey: ["notifications"] })
      await queryClient.cancelQueries({ queryKey: ["notifications_count"] })

      queryClient.setQueryData(["notifications"], (old: Notification[] | undefined) => 
        old ? old.map(n => n.id === id ? { ...n, isRead: true } : n) : []
      )
      queryClient.setQueryData(["notifications_count"], (old: number | undefined) => 
        old ? Math.max(0, old - 1) : 0
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      queryClient.invalidateQueries({ queryKey: ["notifications_count"] })
    }
  })

  // Мутація: прочитати всі
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await api.patch("/notifications/read-all")
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] })
      await queryClient.cancelQueries({ queryKey: ["notifications_count"] })

      queryClient.setQueryData(["notifications"], (old: Notification[] | undefined) => 
        old ? old.map(n => ({ ...n, isRead: true })) : []
      )
      queryClient.setQueryData(["notifications_count"], () => 0)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      queryClient.invalidateQueries({ queryKey: ["notifications_count"] })
    }
  })

  const markAsRead = useCallback(async (id: number) => {
    markAsReadMutation.mutate(id)
  }, [markAsReadMutation])

  const markAllAsRead = useCallback(async () => {
    markAllAsReadMutation.mutate()
  }, [markAllAsReadMutation])

  const fetchNotifications = useCallback(async () => {
    await Promise.all([refetchList(), refetchCount()])
  }, [refetchList, refetchCount])

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