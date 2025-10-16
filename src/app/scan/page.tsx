'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, useRef, Suspense } from 'react'
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode'
import { ArrowLeft, Wifi, WifiOff, ScanLine, Camera, CheckCircle2, XCircle, Trash2, ChevronUp } from 'lucide-react'
import { Button } from '@/ui-components/button'
import { Card } from '@/ui-components/card'
import { Badge } from '@/ui-components/badge'
import { ScrollArea } from '@/ui-components/scroll-area'
import { Separator } from '@/ui-components/separator'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/ui-components/drawer'
import { Toaster } from '@/ui-components/sonner'
import { toast } from 'sonner'
import { createClient } from '@supabase/supabase-js'

// Supabase client for real-time communication
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface ScannedItem {
  id: string
  barcode: string
  timestamp: Date
  foundRows: any[]
  success: boolean
}

function ScanPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isScanning, setIsScanning] = useState(false)
  const [scanHistory, setScanHistory] = useState<ScannedItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(null)
  const [selectedCamera, setSelectedCamera] = useState('back')
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const scannerElementRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<any>(null)

  // Get pairing parameters from URL
  const tableId = searchParams.get('table')
  const columnName = searchParams.get('column')
  const pairingCode = searchParams.get('code')

  useEffect(() => {
    if (!tableId || !columnName || !pairingCode) {
      setError('Invalid pairing parameters. Please scan the QR code again.')
      return
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
          setIsScanning(true)
        }
      })

      channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('🖥️ Device joined:', key, newPresences)
        const isDesktop = newPresences.some((p: any) => p.deviceInfo?.type === 'desktop')
        if (isDesktop) {
          setConnectionStatus('connected')
          setIsScanning(true)
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

  useEffect(() => {
    if (isScanning && scannerElementRef.current && connectionStatus === 'connected') {
      initializeScanner()
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error)
        scannerRef.current = null
      }
    }
  }, [isScanning, connectionStatus])

  const initializeScanner = () => {
    if (!scannerElementRef.current) return

    const config = {
      fps: 10,
      qrbox: { width: 280, height: 280 },
      aspectRatio: 1.0,
      supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
      rememberLastUsedCamera: true,
      showTorchButtonIfSupported: true
    }

    const scanner = new Html5QrcodeScanner(
      'mobile-scanner-element',
      config,
      false
    )

    const onScanSuccess = async (decodedText: string) => {
      console.log('📱 Mobile scan success:', decodedText)
      
      // Prevent duplicate scanning of the same barcode
      if (lastScannedBarcode === decodedText) {
        console.log('🚫 Skipping duplicate scan:', decodedText)
        return
      }
      
      // Update last scanned barcode to prevent duplicates
      setLastScannedBarcode(decodedText)
      
      // Clear the duplicate prevention after 3 seconds
      setTimeout(() => {
        setLastScannedBarcode(null)
      }, 3000)
      
      // Trigger haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200])
      }
      
      // Play success sound
      playSuccessSound()
      
      // Perform lookup to find matching records
      console.log('🔍 Starting lookup for barcode:', decodedText)
      let foundRows: any[] = []
      
      if (tableId && columnName) {
        try {
          // Import API client for lookup
          const { rowsAPI } = await import('@/lib/api/data-tables-client')
          
          // Get all rows and search for matches
          const allRows = await rowsAPI.list(tableId)
          console.log(`📊 Fetched ${allRows.length} total rows`)
          console.log('🔍 Looking in column:', columnName)
          
          const matchingRows = allRows.filter(row => {
            console.log('🔎 Checking row data:', row.data)
            
            // Check if the column value matches the barcode
            const value = row.data[columnName]
            console.log(`📝 Column "${columnName}" value:`, value)
            
            const matches = value && value.toString().toLowerCase() === decodedText.toLowerCase()
            if (matches) {
              console.log('✅ MATCH FOUND!')
            }
            return matches
          })
          
          foundRows = matchingRows
          console.log(`🎯 Found ${foundRows.length} matching records`)
          
        } catch (error) {
          console.error('❌ Lookup failed:', error)
        }
      }
      
      // Save scan result
      const scanResult: ScannedItem = {
        id: Date.now().toString(),
        barcode: decodedText,
        timestamp: new Date(),
        success: foundRows.length > 0,
        foundRows: foundRows
      }
      
      // Add to local scan history for real-time display
      setScanHistory(prev => [scanResult, ...prev.slice(0, 9)]) // Keep last 10 scans
      
      // Save to localStorage for results page
      const storageKey = `scan_results_${tableId}_${columnName}`
      const existingResults = JSON.parse(localStorage.getItem(storageKey) || '[]')
      const storageResult = {
        ...scanResult,
        timestamp: scanResult.timestamp.toISOString(),
        column: columnName,
        tableId
      }
      existingResults.unshift(storageResult)
      localStorage.setItem(storageKey, JSON.stringify(existingResults.slice(0, 100)))
      
      // Show toast notification
      if (foundRows.length > 0) {
        toast.success('Scan successful!', {
          description: `Found ${foundRows.length} matching record${foundRows.length > 1 ? 's' : ''}`,
        })
      } else {
        toast.error('No matches found', {
          description: 'Barcode not found in database',
        })
      }

      // Broadcast to desktop via Supabase real-time
      if (channelRef.current) {
        console.log('📡 Broadcasting scan result to desktop...')
        await channelRef.current.send({
          type: 'broadcast',
          event: 'barcode_scanned',
          payload: {
            barcode: decodedText,
            foundRows: foundRows,
            timestamp: new Date().toISOString(),
            deviceType: 'mobile'
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
              payload: storageResult
            })
            console.log('📡 Sent scan result to results channel:', decodedText)
            
            // Unsubscribe after sending
            setTimeout(() => {
              resultsChannel.unsubscribe()
            }, 1000)
          }
        })
      }
    }

    const onScanFailure = (error: string) => {
      // Only log actual errors, not normal scan failures
      if (!error.includes('No MultiFormat Readers') && !error.includes('NotFoundException')) {
        console.warn('Scan failure:', error)
      }
    }

    try {
      scanner.render(onScanSuccess, onScanFailure)
      scannerRef.current = scanner
    } catch (err) {
      console.error('Failed to initialize scanner:', err)
      setError('Camera access denied or not available. Please allow camera permissions and try again.')
      setIsScanning(false)
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
    setIsScanning(!isScanning)
    if (!isScanning) {
      toast.info('Camera started')
    } else {
      toast.info('Camera stopped')
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error)
        scannerRef.current = null
      }
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
      <Toaster />
      
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
              {/* Scanner Element */}
              <div 
                id="mobile-scanner-element" 
                ref={scannerElementRef}
                className="absolute inset-0"
                style={{ display: isScanning ? 'block' : 'none' }}
              />
              
              {/* Placeholder when not scanning */}
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
                  {/* Corner brackets */}
                  <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                  <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                  <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                  <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-white rounded-br-lg"></div>
                  
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
                  <option value="front">Front Camera</option>
                  <option value="back">Back Camera</option>
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestScan}
                  disabled={!isScanning}
                  className="shrink-0"
                >
                  Test Scan
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