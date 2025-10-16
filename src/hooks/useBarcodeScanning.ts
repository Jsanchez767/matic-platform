'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { rowsAPI } from '@/lib/api/data-tables-client'
import { v4 as uuidv4 } from 'uuid'

// Supabase client for real-time communications
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface ScanResult {
  id: string
  barcode: string
  timestamp: Date
  found: boolean
  rowData?: any
  error?: string
}

interface ConnectedDevice {
  id: string
  type: 'mobile' | 'desktop'
  userAgent: string
  lastSeen: Date
}

interface UseBarcodeScanning {
  // State
  isScanning: boolean
  isConnected: boolean
  sessionId: string
  connectedDevices: ConnectedDevice[]
  scanResults: ScanResult[]
  pairingCode: string | null
  
  // Actions
  startScanning: () => Promise<void>
  stopScanning: () => void
  clearResults: () => void
  generatePairingCode: () => Promise<string>
  
  // Lookup function
  lookupBarcode: (barcode: string) => Promise<ScanResult>
}

export function useBarcodeScanning(
  tableId: string,
  columnName?: string
): UseBarcodeScanning {
  // Core state
  const [isScanning, setIsScanning] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [sessionId] = useState(() => uuidv4())
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>([])
  const [scanResults, setScanResults] = useState<ScanResult[]>([])
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  
  // Generate pairing code on initialization
  useEffect(() => {
    if (!pairingCode) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase()
      setPairingCode(code)
      console.log('🔑 Generated pairing code:', code)
    }
  }, [])
  
  // Refs for cleanup
  const channelRef = useRef<any>(null)
  const presenceRef = useRef<any>(null)

  // Device detection
  const getDeviceInfo = (): { type: 'mobile' | 'desktop'; userAgent: string } => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    return {
      type: isMobile ? 'mobile' : 'desktop',
      userAgent: navigator.userAgent
    }
  }

  // Initialize real-time channel
  useEffect(() => {
    const channelName = pairingCode 
      ? `barcode_scanner_${tableId}_${pairingCode}`
      : `barcode_scanning_${tableId}`
    
    const channel = supabase.channel(channelName)

    // Listen for scan events from mobile devices
    channel.on('broadcast', { event: 'barcode_scanned' }, (payload) => {
      console.log('📱 Received barcode scan from mobile:', payload)
      if (payload.payload?.barcode) {
        handleRemoteScan(payload.payload.barcode, payload.payload.deviceType || 'mobile')
      }
    })

    // Send acknowledgment back to mobile
    channel.on('broadcast', { event: 'barcode_scanned' }, (payload) => {
      if (payload.payload?.barcode) {
        channel.send({
          type: 'broadcast', 
          event: 'scan_result_ack',
          payload: { 
            barcode: payload.payload.barcode,
            received: true,
            timestamp: new Date().toISOString()
          }
        })
      }
    })

    // Listen for pairing events
    channel.on('broadcast', { event: 'device_paired' }, (payload) => {
      console.log('🔗 Device paired:', payload)
      if (payload.pairingCode === pairingCode) {
        addConnectedDevice(payload.deviceInfo)
      }
    })

    // Track presence
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      console.log('👥 Presence sync:', state)
      updateConnectedDevices(state)
    })

    channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('👋 Device joined:', key, newPresences)
    })

    channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('👋 Device left:', key, leftPresences)
    })

    // Subscribe and track presence
      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const deviceInfo = getDeviceInfo()
          await channel.track({
            sessionId,
            deviceInfo,
            tableId,
            pairingCode,
            timestamp: new Date().toISOString()
          })
          setIsConnected(true)
          console.log('✅ Connected to barcode scanning channel:', channelName)
        }
      })

      channelRef.current = channel

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
      setIsConnected(false)
    }
  }, [tableId, sessionId, pairingCode])

  // Handle remote scan from mobile device
  const handleRemoteScan = async (barcode: string, deviceType: string = 'mobile') => {
    console.log(`🔍 Processing ${deviceType} barcode scan:`, barcode)
    const result = await lookupBarcode(barcode)
    setScanResults(prev => [result, ...prev])
    
    // If we found results, this should trigger the results view
    return result
  }

  // Update connected devices from presence state
  const updateConnectedDevices = (presenceState: any) => {
    const devices: ConnectedDevice[] = []
    
    Object.entries(presenceState).forEach(([key, presences]: [string, any]) => {
      presences.forEach((presence: any) => {
        if (presence.sessionId !== sessionId) {
          devices.push({
            id: presence.sessionId,
            type: presence.deviceInfo?.type || 'desktop',
            userAgent: presence.deviceInfo?.userAgent || 'Unknown',
            lastSeen: new Date(presence.timestamp)
          })
        }
      })
    })
    
    setConnectedDevices(devices)
  }

  // Add a connected device
  const addConnectedDevice = (deviceInfo: any) => {
    const device: ConnectedDevice = {
      id: uuidv4(),
      type: deviceInfo.type,
      userAgent: deviceInfo.userAgent,
      lastSeen: new Date()
    }
    
    setConnectedDevices(prev => {
      const exists = prev.some(d => d.userAgent === device.userAgent)
      return exists ? prev : [...prev, device]
    })
  }

  // Lookup barcode in the table
  const lookupBarcode = useCallback(async (barcode: string): Promise<ScanResult> => {
    if (!columnName) {
      return {
        id: uuidv4(),
        barcode,
        timestamp: new Date(),
        found: false,
        error: 'No column selected for lookup'
      }
    }

    try {
      console.log(`🔍 Looking up barcode "${barcode}" in column "${columnName}"`)
      
      // Fetch all rows from the table
      const rows = await rowsAPI.list(tableId)
      
      // Search for matching barcode value
      const matchingRow = rows.find(row => {
        const value = row.data[columnName]
        return value && value.toString().toLowerCase() === barcode.toLowerCase()
      })

      const result: ScanResult = {
        id: uuidv4(),
        barcode,
        timestamp: new Date(),
        found: !!matchingRow,
        rowData: matchingRow || undefined
      }

      console.log('📊 Barcode lookup result:', result)
      return result

    } catch (error) {
      console.error('❌ Barcode lookup error:', error)
      return {
        id: uuidv4(),
        barcode,
        timestamp: new Date(),
        found: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }, [tableId, columnName])

  // Generate pairing code for device connection
  const generatePairingCode = useCallback(async (): Promise<string> => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    setPairingCode(code)
    
    // Code expires after 5 minutes
    setTimeout(() => {
      setPairingCode(null)
    }, 5 * 60 * 1000)
    
    return code
  }, [])

  // Start scanning (for mobile devices)
  const startScanning = useCallback(async () => {
    setIsScanning(true)
    console.log('📱 Starting barcode scanning...')
    
    // If this is a mobile device, we'll start the camera scanner
    // This will be implemented in the BarcodeScanner component
    
  }, [])

  // Stop scanning
  const stopScanning = useCallback(() => {
    setIsScanning(false)
    console.log('⏹️ Stopping barcode scanning')
  }, [])

  // Clear scan results
  const clearResults = useCallback(() => {
    setScanResults([])
  }, [])

  // Broadcast a scan event to other devices
  const broadcastScan = useCallback(async (barcode: string) => {
    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'barcode_scanned',
        barcode,
        sessionId,
        timestamp: new Date().toISOString()
      })
      console.log('📡 Broadcasted barcode scan:', barcode)
    }
  }, [sessionId])

  return {
    // State
    isScanning,
    isConnected,
    sessionId,
    connectedDevices,
    scanResults,
    pairingCode,
    
    // Actions
    startScanning,
    stopScanning,
    clearResults,
    generatePairingCode,
    
    // Lookup
    lookupBarcode
  }
}