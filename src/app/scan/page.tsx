'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, useRef, Suspense } from 'react'
import { BrowserMultiFormatReader, BarcodeFormat, IScannerControls } from '@zxing/browser'
import { DecodeHintType } from '@zxing/library'
import { Exception, NotFoundException, Result } from '@zxing/library'
import { ArrowLeft, Wifi, WifiOff, ScanLine, Camera, CheckCircle2, XCircle, Trash2, ChevronUp, AlertCircle, Shield, User, Mail, Activity } from 'lucide-react'
import { Button } from '@/ui-components/button'
import { Card } from '@/ui-components/card'
import { Badge } from '@/ui-components/badge'
import { ScrollArea } from '@/ui-components/scroll-area'
import { Separator } from '@/ui-components/separator'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/ui-components/drawer'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/ui-components/dialog'
import { Input } from '@/ui-components/input'
import { Toaster } from '@/ui-components/sonner'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { tablesSupabase } from '@/lib/api/tables-supabase'
import { scanHistoryAPI } from '@/lib/api/scan-history-client'
import { pulseClient } from '@/lib/api/pulse-client'
import type { DataTable, TableColumn } from '@/types/data-tables'
import type { ScanHistoryRecord } from '@/types/scan-history'

interface ScannedItem {
  id: string
  barcode: string
  timestamp: Date
  foundRows: Array<{ id?: string; data: Record<string, any> }>
  success: boolean
  status: 'success' | 'failure'
  historyId?: string
}

function ScanPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isScanning, setIsScanning] = useState(false)
  const [scanHistory, setScanHistory] = useState<ScannedItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(null)
  const [lastScanTime, setLastScanTime] = useState<number>(0)
  const [selectedCamera, setSelectedCamera] = useState('environment')
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([])
  const [cameraPermission, setCameraPermission] = useState<'unknown' | 'granted' | 'denied' | 'requesting'>('unknown')
  const [tableInfo, setTableInfo] = useState<DataTable | null>(null)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [resolvedColumnId, setResolvedColumnId] = useState<string | null>(null)
  const [columnLabel, setColumnLabel] = useState<string | null>(null)
  const [pulseConfig, setPulseConfig] = useState<any>(null)
  const [showUserInfoDialog, setShowUserInfoDialog] = useState(false)
  const [userName, setUserName] = useState<string>('')
  const [userEmail, setUserEmail] = useState<string>('')
  const scannerRef = useRef<BrowserMultiFormatReader | null>(null)
  const scannerControlsRef = useRef<IScannerControls | null>(null)
  const lastScanRef = useRef<{ barcode: string; timestamp: number } | null>(null)
  const isProcessingScanRef = useRef<boolean>(false)
  
  // Check for user info in localStorage (guest scanner mode)
  useEffect(() => {
    const savedName = localStorage.getItem('scanner_user_name')
    const savedEmail = localStorage.getItem('scanner_user_email')
    
    if (savedName && savedEmail) {
      setUserName(savedName)
      setUserEmail(savedEmail)
      console.log('📱 Loaded guest scanner info:', { name: savedName, email: savedEmail })
    }
  }, [])
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const channelRef = useRef<any>(null)

  const ensureCodeReader = () => {
    if (!scannerRef.current) {
      const hints = new Map()
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.QR_CODE,
        BarcodeFormat.DATA_MATRIX,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
      ])
      hints.set(DecodeHintType.TRY_HARDER, true)
      // Increase delay between scan attempts for better performance
      scannerRef.current = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 1000 })
    }
    return scannerRef.current
  }

  const refreshCameraList = async () => {
    try {
      const devices = await BrowserMultiFormatReader.listVideoInputDevices()
      setAvailableCameras(devices)
    } catch (err) {
      console.error('Failed to list cameras:', err)
    }
  }

  // Get pairing parameters from URL
  const tableId = searchParams.get('table')
  const columnName = searchParams.get('column')
  const pairingCode = searchParams.get('code')
  const pulseTableId = searchParams.get('pulse') // Pulse mode detection
  const scanMode = searchParams.get('mode') // 'pulse' or undefined (regular mode)
  
  const isPulseMode = scanMode === 'pulse' && pulseTableId

  useEffect(() => {
    if (!tableId) {
      setTableInfo(null)
      setWorkspaceId(null)
      return
    }

    const loadMetadata = async () => {
      try {
        const table = await tablesSupabase.get(tableId)
        setTableInfo(table)
        setWorkspaceId(table.workspace_id)

        // Load Pulse config if in Pulse mode
        if (isPulseMode && pulseTableId) {
          try {
            const { pulseSupabase } = await import('@/lib/api/pulse-supabase')
            const config = await pulseSupabase.getPulseConfig(tableId)
            setPulseConfig(config)
            
            // Use barcode_column_id from Pulse config
            if (config && config.barcode_column_id) {
              setResolvedColumnId(config.barcode_column_id)
              const barcodeColumn = table.columns.find(col => col.id === config.barcode_column_id)
              if (barcodeColumn) {
                setColumnLabel(barcodeColumn.label || barcodeColumn.name)
              }
              console.log('🟢 Pulse mode: Using barcode column', config.barcode_column_id)
            } else {
              console.warn('⚠️ Pulse config has no barcode_column_id set')
            }
          } catch (pulseError) {
            console.error('Failed to load Pulse config:', pulseError)
          }
        }

        // Regular mode column resolution
        if (!isPulseMode) {
          const columnIdParam = searchParams.get('columnId') ?? searchParams.get('column_id')
          let resolved: TableColumn | undefined

          if (columnIdParam) {
            resolved = table.columns.find(col => col.id === columnIdParam)
          }

          if (!resolved && columnName) {
            resolved = table.columns.find(col => col.name === columnName || col.id === columnName)
          }

          if (resolved?.id) {
            setResolvedColumnId(resolved.id)
          } else if (columnIdParam) {
            setResolvedColumnId(columnIdParam)
          }

          if (resolved?.label) {
            setColumnLabel(resolved.label)
          } else if (resolved?.name) {
            setColumnLabel(resolved.name)
          } else if (columnName) {
            setColumnLabel(columnName)
          }
        }
      } catch (metadataError) {
        console.error('Failed to load table metadata:', metadataError)
      }
    }

    loadMetadata()
  }, [tableId, columnName, searchParams, isPulseMode, pulseTableId])

  useEffect(() => {
    // Pulse mode only needs tableId, pulseTableId, and pairingCode
    if (isPulseMode) {
      if (!tableId || !pulseTableId || !pairingCode) {
        setError('Invalid Pulse pairing parameters. Please scan the QR code again.')
        return
      }
    } else {
      // Regular mode needs tableId, columnName, and pairingCode
      if (!tableId || !columnName || !pairingCode) {
        setError('Invalid pairing parameters. Please scan the QR code again.')
        return
      }
    }

    // Check if user info is stored
    const storedUserInfo = localStorage.getItem('scanner_user_info')
    if (storedUserInfo) {
      try {
        const { name, email } = JSON.parse(storedUserInfo)
        setUserName(name)
        setUserEmail(email)
      } catch (err) {
        console.error('Failed to parse stored user info:', err)
      }
    } else {
      // Show dialog to collect user info on first use
      setShowUserInfoDialog(true)
    }

    // Connect to Supabase real-time channel for this pairing session
    const connectToDesktop = async () => {
      const channelName = `barcode_scanner_${tableId}_${pairingCode}`
      console.log('📱 Connecting to channel:', channelName)
      
      const channel = supabase.channel(channelName)
      
      channel.on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        console.log('👥 Presence sync:', state)
        
        // Check if desktop is present
        const hasDesktop = Object.values(state).some((presences: any) => 
          presences.some((p: any) => p.deviceInfo?.type === 'desktop')
        )
        
        if (hasDesktop) {
          console.log('🖥️ Desktop found in presence')
          setConnectionStatus('connected')
          // Don't auto-start scanning - wait for user to enter info
        }
      })

      channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('🖥️ Device joined:', key, newPresences)
        const isDesktop = newPresences.some((p: any) => p.deviceInfo?.type === 'desktop')
        if (isDesktop) {
          setConnectionStatus('connected')
          // Don't auto-start scanning - wait for user to enter info
        }
      })

      channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('🖥️ Device left:', key, leftPresences)
        const wasDesktop = leftPresences.some((p: any) => p.deviceInfo?.type === 'desktop')
        if (wasDesktop) {
          setConnectionStatus('disconnected')
        }
      })

      // Listen for scan result acknowledgments
      channel.on('broadcast', { event: 'scan_result_ack' }, ({ payload }) => {
        console.log('✅ Desktop received scan result:', payload)
      })

      channel.subscribe(async (status) => {
        console.log('📱 Channel subscription status:', status)
        if (status === 'SUBSCRIBED') {
          // Track mobile device presence
          await channel.track({
            deviceType: 'mobile',
            userAgent: navigator.userAgent,
            pairingCode,
            timestamp: new Date().toISOString()
          })
          console.log('📱 Mobile device connected to channel')
          
          // Set timeout to start scanning even if no desktop found (for testing)
          setTimeout(() => {
            if (connectionStatus === 'connecting') {
              console.log('⏰ Connection timeout - allowing standalone scanning')
              setConnectionStatus('connected')
              setIsScanning(true)
            }
          }, 10000) // 10 second timeout
        } else if (status === 'CLOSED') {
          console.log('❌ Channel connection closed')
          setConnectionStatus('disconnected')
        }
      })

      channelRef.current = channel
    }

    connectToDesktop()

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
    }
  }, [tableId, columnName, pairingCode])

  // Check camera permissions on mount
  const checkCameraPermissions = async () => {
    try {
      const permission = await navigator.permissions.query({ name: 'camera' as PermissionName })
      if (permission.state === 'granted') {
        setCameraPermission('granted')
        await refreshCameraList()
      } else if (permission.state === 'denied') {
        setCameraPermission('denied')
      } else {
        setCameraPermission('unknown')
      }
      
      // Listen for permission changes
      permission.onchange = () => {
        const state = permission.state
        if (state === 'granted') {
          setCameraPermission('granted')
          refreshCameraList()
        } else if (state === 'denied') {
          setCameraPermission('denied')
        } else {
          setCameraPermission('unknown')
        }
      }
    } catch (error) {
      console.log('Permission API not supported, will check on camera access')
      setCameraPermission('unknown')
    }
  }

  // Request camera permissions explicitly
  const requestCameraPermissions = async () => {
    setCameraPermission('requesting')
    
    // Show toast prompting user to grant permission
    toast.info('Camera Permission Required', {
      description: 'Please allow camera access in your browser to start scanning.',
      duration: 5000,
    })
    
    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: selectedCamera } })
      
      // If successful, stop the stream and update permission
      stream.getTracks().forEach(track => track.stop())
      setCameraPermission('granted')
      
      toast.success('Camera access granted!', {
        description: 'You can now start scanning barcodes.',
      })
      
      // Load available cameras after permission granted
      await refreshCameraList()
    } catch (error) {
      console.error('Camera permission denied:', error)
      setCameraPermission('denied')
      
      toast.error('Camera access denied', {
        description: 'Please enable camera permissions in your browser settings.',
        duration: 7000,
      })
    }
  }

  useEffect(() => {
    // Check permissions and load cameras
    checkCameraPermissions()
    
    // If permission is already granted or unknown, try to list cameras
    if (cameraPermission === 'granted' || cameraPermission === 'unknown') {
      refreshCameraList().then(() => {
        if (cameraPermission === 'unknown') {
          setCameraPermission('granted')
        }
      }).catch(() => {
        if (cameraPermission === 'unknown') {
          setCameraPermission('denied')
        }
      })
    }
  }, [cameraPermission])

  useEffect(() => {
    if (isScanning && videoRef.current && connectionStatus === 'connected' && cameraPermission === 'granted') {
      initializeScanner()
    }

    return () => {
      if (scannerControlsRef.current) {
        scannerControlsRef.current.stop()
        scannerControlsRef.current = null
      }
      // scannerRef.current?.reset() // No reset method in BrowserMultiFormatReader
    }
  }, [isScanning, connectionStatus, selectedCamera, cameraPermission])

  const initializeScanner = async () => {
    if (!videoRef.current) return

    // Check camera permissions before initializing
    if (cameraPermission === 'denied') {
      toast.error('Camera access is denied. Please allow camera permissions to scan barcodes.')
      return
    }
    
    if (cameraPermission === 'requesting') {
      console.log('Camera permission is being requested, waiting...')
      return
    }

    try {
      if (scannerControlsRef.current) {
        scannerControlsRef.current.stop()
        scannerControlsRef.current = null
      }

      const reader = ensureCodeReader()

      const constraints: MediaStreamConstraints = {
        video: selectedCamera === 'environment' || selectedCamera === 'user'
          ? {
              facingMode: { ideal: selectedCamera },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            }
          : {
              deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
        audio: false,
      }

      const controls = await reader.decodeFromConstraints(
        constraints,
        videoRef.current,
        (result?: Result, error?: Exception) => {
          if (result) {
            const text = result.getText()
            if (text) {
              onScanSuccess(text)
            }
          } else if (error && !(error instanceof NotFoundException)) {
            console.warn('Decode error:', error)
          }
        }
      )

      scannerControlsRef.current = controls
      console.log('Scanner initialized successfully')
    } catch (err) {
      console.error('Failed to initialize scanner:', err)
      setError('Camera access denied or not available. Please allow camera permissions and try again.')
      setIsScanning(false)
    }
  }

  const onScanSuccess = async (decodedText: string) => {
      console.log('📱 Mobile scan callback fired:', decodedText)
      
      const now = Date.now()
      const oneMinuteInMs = 60000 // 60 seconds
      
      // Check if we're already processing a scan
      if (isProcessingScanRef.current) {
        console.log('🚫 Already processing a scan, skipping...')
        return
      }
      
      // Smart duplicate prevention using ref (synchronous check)
      if (lastScanRef.current) {
        const { barcode: lastBarcode, timestamp: lastTime } = lastScanRef.current
        const timeSinceLastScan = now - lastTime
        
        if (lastBarcode === decodedText && timeSinceLastScan < oneMinuteInMs) {
          console.log(`🚫 Skipping duplicate scan (${Math.floor(timeSinceLastScan / 1000)}s ago):`, decodedText)
          toast.info(`Already scanned! Wait ${Math.ceil((oneMinuteInMs - timeSinceLastScan) / 1000)}s`)
          return
        }
      }
      
      // Mark as processing to prevent concurrent executions
      isProcessingScanRef.current = true
      
      // Update tracking (both ref and state)
      lastScanRef.current = { barcode: decodedText, timestamp: now }
      setLastScannedBarcode(decodedText)
      setLastScanTime(now)
      
      console.log('✅ Processing new scan:', decodedText)
      
      try {
        // Trigger haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate([200, 100, 200])
        }
        
        // Play success sound
        playSuccessSound()
        
        // Perform lookup to find matching records
        console.log('🔍 Starting lookup for barcode:', decodedText)
        let foundRows: any[] = []
      
      if (tableId) {
        try {
          // Import Supabase Direct client for instant lookup
          const { rowsSupabase } = await import('@/lib/api/rows-supabase')
          
          // Use Supabase Direct for barcode matching (instant!)
          if (resolvedColumnId) {
            try {
              console.log('🚀 Using Supabase Direct search...')
              const searchResults = await rowsSupabase.searchByBarcode(tableId, resolvedColumnId, decodedText)
              foundRows = searchResults
              console.log(`✅ Supabase search found ${foundRows.length} matching records`)
            } catch (searchError) {
              console.warn('⚠️ Supabase search failed, falling back:', searchError)
            }
          }

          if (!resolvedColumnId || foundRows.length === 0) {
            if (columnName) {
              const allRows = await rowsSupabase.list(tableId, { archived: false })
              console.log(`📊 Fetched ${allRows.length} total rows for fallback search`)
              console.log('🔍 Looking in column:', columnName)

              const matchingRows = allRows.filter(row => {
                const value = row.data?.[columnName]
                const matches = value && value.toString().toLowerCase() === decodedText.toLowerCase()
                return matches
              })

              if (matchingRows.length > 0) {
                console.log(`🎯 Fallback search found ${matchingRows.length} matching records`)
                foundRows = matchingRows
              }
            }
          }
          
        } catch (error) {
          console.error('❌ Lookup failed:', error)
        }
      }
      
      // Save scan result
      const condensedRows = foundRows.map(row => ({
        id: row.id,
        data: row.data,
      }))

      // Try to get authenticated user, fallback to guest system user
      const { getCurrentUser } = await import('@/lib/supabase')
      const { GUEST_SCANNER_SYSTEM_USER_ID, getGuestScannerInfo } = await import('@/lib/guest-scanner')
      const user = await getCurrentUser()
      const guestInfo = getGuestScannerInfo()
      
      // Use authenticated user ID if available, otherwise use system guest user ID
      const userId = user?.id || GUEST_SCANNER_SYSTEM_USER_ID
      
      console.log('👤 Scanner user context:', {
        authenticated: !!user,
        userId,
        guestInfo: guestInfo ? { name: guestInfo.name, email: guestInfo.email } : null
      })
      
      // Update matched rows with scan count and timestamp
      if (condensedRows.length > 0 && tableId) {
        try {
          const { rowsSupabase } = await import('@/lib/api/rows-supabase')
          
          for (const row of condensedRows) {
            if (row.id) {
              const currentScanCount = parseInt(row.data?.scan_count || '0', 10)
              const updatedData = {
                ...row.data,
                scan_count: currentScanCount + 1,
                last_scanned_at: new Date().toISOString(),
              }
              
              try {
                await rowsSupabase.update(tableId, row.id, { 
                  data: updatedData,
                  updated_by: userId // Use authenticated user or guest system user
                })
                console.log(`✅ Updated row ${row.id} scan count to ${currentScanCount + 1}`)
              } catch (updateError) {
                console.error(`Failed to update row ${row.id}:`, updateError)
              }
            }
          }
        } catch (error) {
          console.error('Error updating scan counts:', error)
        }
      }

      let persistedRecord: ScanHistoryRecord | null = null
      if (workspaceId && tableId) {
        try {
          
          const matchedRowIds = condensedRows
            .map(row => row.id)
            .filter((id): id is string => Boolean(id))

          console.log('📝 Creating scan history record...', {
            workspace_id: workspaceId,
            table_id: tableId,
            column_id: resolvedColumnId,
            column_name: columnName,
            barcode: decodedText,
            user_id: userId,
            guest_info: guestInfo
          })

          persistedRecord = await scanHistoryAPI.create({
            workspace_id: workspaceId,
            table_id: tableId,
            column_id: resolvedColumnId,
            column_name: columnName ?? columnLabel ?? undefined,
            barcode: decodedText,
            status: condensedRows.length > 0 ? 'success' : 'failure',
            matched_row_ids: matchedRowIds,
            matched_rows: condensedRows,
            source: 'mobile',
            metadata: {
              pairingCode,
              columnLabel,
              scannedBy: guestInfo?.name || userName || 'Unknown',
              scannedByEmail: guestInfo?.email || userEmail || undefined,
              deviceType: 'mobile',
              isGuest: !user // Flag to indicate guest vs authenticated scan
            },
            created_by: userId // Use authenticated user or guest system user
          })
          console.log('✅ Scan persisted to database:', persistedRecord.id)
        } catch (persistError) {
          console.error('❌ Failed to persist scan history to database:', persistError)
          console.error('❌ Error details:', {
            message: persistError instanceof Error ? persistError.message : String(persistError),
            workspaceId,
            tableId,
            barcode: decodedText
          })
          toast.error('Database save failed', {
            description: persistError instanceof Error ? persistError.message : 'Scan saved locally only',
            duration: 3000,
          })
        }
      }

      const scanResult: ScannedItem = {
        id: persistedRecord?.id ?? Date.now().toString(),
        historyId: persistedRecord?.id,
        barcode: decodedText,
        timestamp: persistedRecord ? new Date(persistedRecord.created_at) : new Date(),
        success: condensedRows.length > 0,
        status: condensedRows.length > 0 ? 'success' : 'failure',
        foundRows: condensedRows,
      }
      
      // Add to local scan history for real-time display
      setScanHistory(prev => [scanResult, ...prev.slice(0, 9)]) // Keep last 10 scans
      
      // ============================================================================
      // PULSE MODE: Create check-in event
      // ============================================================================
      if (isPulseMode && pulseTableId && condensedRows.length > 0) {
        try {
          const matchedRow = condensedRows[0] // Use first matched row
          console.log('🟢 PULSE MODE: Creating check-in for row:', matchedRow.id)
          
          const checkInData = {
            pulse_table_id: pulseTableId,
            table_id: tableId!,
            row_id: matchedRow.id!,
            barcode_scanned: decodedText,
            scanner_user_name: guestInfo?.name || userName || 'Mobile Scanner',
            scanner_user_email: guestInfo?.email || userEmail || undefined,
            scanner_device_id: navigator.userAgent || undefined,
            row_data: matchedRow.data,
            is_walk_in: false, // Can add logic to detect walk-ins
            notes: undefined
          }
          
          const checkIn = await pulseClient.createCheckIn(checkInData)
          console.log('✅ Pulse check-in created:', checkIn.id)
          
          // Show Pulse-specific success message
          toast.success(`✓ Checked In!`, {
            description: `${guestInfo?.name || userName || 'Attendee'} • ${decodedText}`,
            duration: 3000,
          })
          
          // Continue to regular flow...
          
        } catch (pulseError) {
          console.error('❌ Pulse check-in failed:', pulseError)
          toast.error('Check-in failed', {
            description: pulseError instanceof Error ? pulseError.message : 'Please try again',
            duration: 3000,
          })
        }
      } else {
        // Regular scanner mode - show normal toast notifications
        if (condensedRows.length > 0) {
          toast.success(`✓ ${decodedText}`, {
            description: `Found ${condensedRows.length} matching record${condensedRows.length > 1 ? 's' : ''}`,
            duration: 2000,
          })
        } else {
          toast.warning(`⚠ ${decodedText}`, {
            description: 'Barcode not found in database',
            duration: 3000,
            action: {
              label: 'Create New',
              onClick: () => {
                // Navigate to create new record with pre-filled barcode
                if (tableId && columnName) {
                  const createUrl = `/workspace/table/${tableId}?action=create&${columnName}=${encodeURIComponent(decodedText)}`
                  window.open(createUrl, '_blank')
                }
              }
            }
          })
        }
      }

      // Broadcast to desktop via Supabase real-time
      if (channelRef.current) {
        console.log('📡 Broadcasting scan result to desktop...')
        await channelRef.current.send({
          type: 'broadcast',
          event: 'barcode_scanned',
          payload: {
            barcode: decodedText,
            foundRows: condensedRows,
            status: scanResult.status,
            historyId: scanResult.historyId,
            timestamp: scanResult.timestamp.toISOString(),
            deviceType: 'mobile',
            tableId,
            columnName,
            columnLabel,
            scanRecord: persistedRecord,
          }
        })
        
        // Also send to results page channel if someone is viewing it
        const resultsChannelName = `scan_results_${tableId}_${columnName}`
        const resultsChannel = supabase.channel(resultsChannelName)
        
        resultsChannel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await resultsChannel.send({
              type: 'broadcast',
              event: 'new_scan_result',
              payload: {
                ...scanResult,
                timestamp: scanResult.timestamp.toISOString(),
                column: columnName,
                tableId,
                status: scanResult.status,
                foundRows: condensedRows,
                scanRecord: persistedRecord,
              }
            })
            console.log('📡 Sent scan result to results channel:', decodedText)
            
            // Unsubscribe after sending
            setTimeout(() => {
              resultsChannel.unsubscribe()
            }, 1000)
          }
        })
      }
      } catch (error) {
        console.error('Error processing scan:', error)
        toast.error('Scan processing failed', {
          description: error instanceof Error ? error.message : 'Unknown error'
        })
      } finally {
        // Always reset processing flag
        isProcessingScanRef.current = false
      }
    }

  const playSuccessSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.2)
    } catch (error) {
      console.warn('Could not play success sound:', error)
    }
  }

  const handleToggleScanning = () => {
    // Check if user has provided their info first
    if (!userName.trim()) {
      setShowUserInfoDialog(true)
      toast.info('Please enter your name to start scanning')
      return
    }
    
    if (!isScanning && cameraPermission === 'denied') {
      toast.error('Camera access is denied. Please click "Grant Access" to allow camera permissions.')
      return
    }
    
    if (!isScanning && cameraPermission === 'unknown') {
      toast.info('Checking camera permissions...')
      requestCameraPermissions()
      return
    }
    
    setIsScanning(!isScanning)
    if (!isScanning) {
      toast.info('Camera started')
    } else {
      toast.info('Camera stopped')
      if (scannerControlsRef.current) {
        scannerControlsRef.current.stop()
        scannerControlsRef.current = null
      }
      // scannerRef.current?.reset() // No reset method in BrowserMultiFormatReader
    }
  }

  const handleTestScan = () => {
    // Simulate a scan for testing
    const mockBarcodes = [
      'PROD001',
      'USER123',
      'ITEM456',
      'INVALID',
    ]
    const randomBarcode = mockBarcodes[Math.floor(Math.random() * mockBarcodes.length)]
    const isValid = randomBarcode !== 'INVALID'
    
    const newItem: ScannedItem = {
      id: Date.now().toString(),
      barcode: randomBarcode,
      timestamp: new Date(),
      success: isValid,
      status: isValid ? 'success' : 'failure',
      foundRows: isValid ? [{ id: '1', data: { name: 'Sample Item', category: 'Test' } }] : []
    }
    
    setScanHistory(prev => [newItem, ...prev])
    
    if (isValid) {
      toast.success('Scan successful!', {
        description: randomBarcode,
      })
    } else {
      toast.error('Invalid format', {
        description: 'Please scan a valid barcode',
      })
    }
  }

  const handleClearHistory = () => {
    setScanHistory([])
    toast.success('History cleared')
  }
  
  const handleSaveUserInfo = () => {
    if (!userName.trim()) {
      toast.error('Please enter your name')
      return
    }
    
    // Save to localStorage for guest scanner mode
    localStorage.setItem('scanner_user_name', userName.trim())
    localStorage.setItem('scanner_user_email', userEmail.trim() || 'anonymous@guest.scanner')
    
    setShowUserInfoDialog(false)
    
    toast.success('Profile saved!', {
      description: `Scanning as ${userName}`
    })
    
    console.log('💾 Saved guest scanner info:', { name: userName.trim(), email: userEmail.trim() || 'anonymous@guest.scanner' })
    
    // Start scanning after user info is saved
    if (connectionStatus === 'connected') {
      // Request camera permission and start scanning
      if (cameraPermission === 'unknown') {
        requestCameraPermissions().then(() => {
          setIsScanning(true)
        })
      } else if (cameraPermission === 'granted') {
        setIsScanning(true)
      } else {
        // Permission denied, prompt user
        toast.error('Camera permission required', {
          description: 'Please allow camera access to start scanning',
          action: {
            label: 'Grant Access',
            onClick: () => requestCameraPermissions().then(() => setIsScanning(true))
          }
        })
      }
    }
  }

  const successCount = scanHistory.filter(item => item.success).length
  const failureCount = scanHistory.filter(item => !item.success).length

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connecting':
        return <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-500" />
      case 'connected':
        return <Wifi className="w-3 h-3 text-green-500" />
      case 'disconnected':
        return <WifiOff className="w-3 h-3 text-red-500" />
    }
  }

  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connecting':
        return 'Connecting'
      case 'connected':
        return 'Connected'
      case 'disconnected':
        return 'Disconnected'
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <div className="p-6 text-center">
            <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Connection Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.back()}>
              Go Back
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="scan-page min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
      <Toaster />
      
      {/* User Info Dialog */}
      <Dialog open={showUserInfoDialog} onOpenChange={setShowUserInfoDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Guest Scanner Access</DialogTitle>
            <DialogDescription>
              No account needed! Just enter your name so we can track who scanned each item. 
              Your info will be saved on this device.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Your Name <span className="text-red-500 ml-1">*</span>
              </label>
              <Input
                type="text"
                placeholder="John Doe"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="mt-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveUserInfo()
                  }
                }}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                Email (optional)
              </label>
              <Input
                type="email"
                placeholder="john@example.com"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="mt-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveUserInfo()
                  }
                }}
              />
            </div>
            
            <Button 
              onClick={handleSaveUserInfo} 
              className="w-full"
              disabled={!userName.trim()}
            >
              Start Scanning
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center gap-2">
            {isPulseMode && (
              <Badge className="bg-green-600 text-white border-0">
                <Activity className="w-3 h-3 mr-1" />
                Pulse Mode
              </Badge>
            )}
            <Badge variant="outline" className={`${
              connectionStatus === 'connected' 
                ? 'bg-green-50 text-green-700 border-green-200' 
                : connectionStatus === 'connecting'
                ? 'bg-orange-50 text-orange-700 border-orange-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              {getConnectionIcon()}
              <span className="ml-1">{getConnectionText()}</span>
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {pairingCode}
            </Badge>
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-green-50 rounded-lg px-3 py-2 border border-green-100">
            <div className="flex items-center justify-between">
              <span className="text-xs text-green-600">Success</span>
              <span className="font-semibold text-green-700">{successCount}</span>
            </div>
          </div>
          <div className="flex-1 bg-red-50 rounded-lg px-3 py-2 border border-red-100">
            <div className="flex items-center justify-between">
              <span className="text-xs text-red-600">Failed</span>
              <span className="font-semibold text-red-700">{failureCount}</span>
            </div>
          </div>
          <div className="flex-1 bg-purple-50 rounded-lg px-3 py-2 border border-purple-100">
            <div className="flex items-center justify-between">
              <span className="text-xs text-purple-600">Total</span>
              <span className="font-semibold text-purple-700">{scanHistory.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 max-w-2xl mx-auto w-full">
        {/* Scanner Card */}
        <Card className="mb-4">
          <div className="p-4">
            {/* Camera Preview Area */}
            <div className="relative mb-4 rounded-lg overflow-hidden bg-gray-900 aspect-square">
            {/* Video Element for QR Scanner */}
            <video 
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ 
                display: isScanning ? 'block' : 'none'
              }}
              playsInline
              muted
            />              {/* Placeholder when not scanning */}
              {!isScanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white text-center">
                    <Camera className="w-16 h-16 mx-auto mb-2 opacity-50" />
                    <p className="text-sm opacity-75">Camera View</p>
                  </div>
                </div>
              )}
              
              {/* Scanning overlay */}
              {isScanning && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* Scanning line animation */}
                  <div className="absolute inset-x-8 top-1/2 h-0.5 bg-green-400 shadow-lg shadow-green-400/50 animate-pulse"></div>
                </div>
              )}
              
              {/* Status badge */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                {isScanning ? (
                  <Badge className="bg-green-500 text-white border-0 shadow-lg">
                    <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                    Scanning...
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="shadow-lg">
                    Camera Paused
                  </Badge>
                )}
              </div>
            </div>

            {/* Camera Controls */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <select
                  value={selectedCamera}
                  onChange={(e) => setSelectedCamera(e.target.value)}
                  className="flex-1 h-9 rounded-md border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="user">Front Camera</option>
                  <option value="environment">Back Camera</option>
                  {availableCameras.map((camera, index) => (
                    <option key={camera.deviceId} value={camera.deviceId}>
                      {camera.label || `Camera ${index + 1}`}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={requestCameraPermissions}
                  disabled={cameraPermission === 'granted' || cameraPermission === 'requesting'}
                  className="shrink-0"
                >
                  {cameraPermission === 'requesting' && (
                    <div className="w-3 h-3 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                  )}
                  {cameraPermission === 'granted' ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" />
                      Camera Ready
                    </>
                  ) : cameraPermission === 'denied' ? (
                    <>
                      <AlertCircle className="w-3 h-3 mr-1 text-red-500" />
                      Grant Access
                    </>
                  ) : cameraPermission === 'requesting' ? (
                    'Requesting...'
                  ) : (
                    <>
                      <Shield className="w-3 h-3 mr-1" />
                      Camera Access
                    </>
                  )}
                </Button>
              </div>
              
              <Button
                onClick={handleToggleScanning}
                className="w-full"
                variant={isScanning ? "destructive" : "default"}
                size="lg"
              >
                <Camera className="w-4 h-4 mr-2" />
                {isScanning ? 'Stop Camera' : 'Start Camera'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Most Recent Scan */}
        {scanHistory.length > 0 && (
          <Card className="mb-4">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm text-gray-600">Most Recent Scan</h2>
                <Button
                  onClick={() => setIsHistoryOpen(true)}
                  variant="ghost"
                  size="sm"
                >
                  <ChevronUp className="w-4 h-4 mr-1" />
                  View All ({scanHistory.length})
                </Button>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="shrink-0 mt-0.5">
                  {scanHistory[0].success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm break-all ${scanHistory[0].success ? 'text-gray-900' : 'text-red-600'}`}>
                    {scanHistory[0].barcode}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatTimestamp(scanHistory[0].timestamp)}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Scan History Drawer */}
      <Drawer open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <div className="flex items-center justify-between">
              <DrawerTitle>All Scans</DrawerTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const url = `/scan-results?table=${tableId}&column=${columnName}`
                    window.open(url, '_blank')
                  }}
                >
                  View All Results
                </Button>
                {scanHistory.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearHistory}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>
            </div>
            <DrawerDescription>
              {scanHistory.length === 0 
                ? 'No scans yet' 
                : `${successCount} successful, ${failureCount} failed`}
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="px-4 pb-4 overflow-hidden">
            {scanHistory.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <ScanLine className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No scans yet</p>
                <p className="text-xs mt-1">Scanned items will appear here automatically</p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(85vh-180px)]">
                <div className="space-y-1 pr-4">
                  {scanHistory.map((item, index) => (
                    <div key={item.id}>
                      <div className="flex items-start gap-3 py-3">
                        <div className="shrink-0 mt-0.5">
                          {item.success ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm break-all ${item.success ? 'text-gray-900' : 'text-red-600'}`}>
                            {item.barcode}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {formatTimestamp(item.timestamp)}
                          </p>
                        </div>
                      </div>
                      {index < scanHistory.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}

export default function ScanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading scanner...</p>
        </div>
      </div>
    }>
      <ScanPageContent />
    </Suspense>
  )
}