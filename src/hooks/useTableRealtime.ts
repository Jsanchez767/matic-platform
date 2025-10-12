import { useEffect, useRef, useCallback, useState } from 'react'

type TableUpdateCallback = (data: any) => void

interface UseTableRealtimeReturn {
  send: (data: any) => void
  isConnected: () => boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
}

export function useTableRealtime(
  tableId: string, 
  onUpdate: TableUpdateCallback
): UseTableRealtimeReturn {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')

  const connect = useCallback(() => {
    if (!tableId) {
      console.log('useTableRealtime: No tableId provided, skipping WebSocket connection')
      return
    }

    // Convert HTTP API URL to WebSocket URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
    // For local development, construct WebSocket URL properly
    let wsUrl: string
    if (apiUrl.includes('localhost')) {
      // For localhost, construct WebSocket URL directly (API prefix is included in the backend)
      wsUrl = `ws://localhost:8000/api/ws/tables/${tableId}`
    } else {
      // For production, replace https with wss and keep the domain
      const baseUrl = apiUrl.replace('/api', '').replace(/^https?/, 'wss')
      wsUrl = `${baseUrl}/api/ws/tables/${tableId}`
    }
    
    console.log('Connecting to WebSocket:', wsUrl)
    console.log('Original API URL:', apiUrl)
    
    setConnectionStatus('connecting')
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      console.log(`Connected to table ${tableId} WebSocket`)
      setConnectionStatus('connected')
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('Received update:', data)
        onUpdate(data)
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
        onUpdate(event.data)
      }
    }

    ws.onclose = (event) => {
      console.log(`WebSocket closed for table ${tableId}:`, event.code, event.reason)
      wsRef.current = null
      setConnectionStatus('disconnected')
      
      // Reconnect after 3 seconds if not intentionally closed
      if (event.code !== 1000) {
        setConnectionStatus('error')
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect...')
          connect()
        }, 3000)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setConnectionStatus('error')
    }
  }, [tableId, onUpdate])

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close(1000) // Normal closure
      }
    }
  }, [connect])

  const send = useCallback((data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('Sending update:', data)
      wsRef.current.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket not connected, cannot send:', data)
    }
  }, [])

  const isConnected = useCallback(() => {
    return wsRef.current?.readyState === WebSocket.OPEN
  }, [])

  return { send, isConnected, connectionStatus }
}