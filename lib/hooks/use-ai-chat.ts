"use client"

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/hooks/query-keys'

interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
}

interface StoredMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

export function useAiChat() {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const conversationIdRef = useRef<string | null>(null)
  const queryClient = useQueryClient()
  const supabase = createClient()

  // Keep ref in sync
  conversationIdRef.current = conversationId

  // Custom fetch to capture conversation ID from response headers
  const customFetch: typeof globalThis.fetch = useCallback(async (input, init) => {
    const response = await globalThis.fetch(input, init)
    const newConvId = response.headers.get('X-Conversation-Id')
    if (newConvId && !conversationIdRef.current) {
      setConversationId(newConvId)
    }
    return response
  }, [])

  // Stable transport instance — must not be recreated every render
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat',
        body: () => ({ conversationId: conversationIdRef.current }),
        fetch: customFetch,
      }),
    [customFetch]
  )

  // Vercel AI SDK v3 chat hook
  const chat = useChat({
    transport,
    onFinish: () => {
      // Refresh conversations list after each exchange
      queryClient.invalidateQueries({ queryKey: queryKeys.aiChat.conversations() })
    },
  })

  // List conversations
  const conversationsQuery = useQuery<Conversation[]>({
    queryKey: queryKeys.aiChat.conversations(),
    queryFn: async () => {
      const res = await fetch('/api/chat/conversations')
      if (!res.ok) throw new Error('Failed to fetch conversations')
      return res.json()
    },
  })

  // Load conversation history
  const loadConversation = useCallback(async (convId: string) => {
    setConversationId(convId)

    const res = await fetch(`/api/chat/conversations/${convId}`)
    if (!res.ok) return

    const messages: StoredMessage[] = await res.json()
    chat.setMessages(
      messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          parts: [{ type: 'text' as const, text: m.content }],
        }))
    )
  }, [chat])

  // Start new conversation
  const newConversation = useCallback(() => {
    setConversationId(null)
    chat.setMessages([])
    setInput('')
  }, [chat])

  // Delete conversation
  const deleteConversation = useMutation({
    mutationFn: async (convId: string) => {
      const res = await fetch(`/api/chat/conversations/${convId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.aiChat.conversations() })
      if (conversationId === deletedId) {
        newConversation()
      }
    },
  })

  // Send message (replaces old handleSubmit)
  const sendUserMessage = useCallback(async (content: string) => {
    if (!content.trim()) return
    setInput('')
    chat.sendMessage({ text: content })
  }, [chat])

  const isLoading = chat.status === 'streaming' || chat.status === 'submitted'

  return {
    messages: chat.messages,
    input,
    setInput,
    sendMessage: sendUserMessage,
    isLoading,
    conversationId,
    // Conversation management
    conversations: conversationsQuery.data || [],
    isLoadingConversations: conversationsQuery.isLoading,
    loadConversation,
    newConversation,
    deleteConversation: deleteConversation.mutate,
  }
}
