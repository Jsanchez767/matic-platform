'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, useRef, Suspense } from 'react'
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode'
import { ArrowLeft, ScanLine, Wifi, WifiOff, CheckCircle, AlertCircle, Camera, ExternalLink, X } from 'lucide-react'
import { Button } from '@/ui-components/button'
import { Card } from '@/ui-components/card'
import { createClient } from '@supabase/supabase-js'

// Supabase client for real-time communication
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function ScanPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isScanning, setIsScanning] = useState(false)
  const [scanHistory, setScanHistory] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)
  
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
      console.log('📱 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.log('📱 Current origin:', window.location.origin)
      console.log('📱 Table ID:', tableId)
      console.log('📱 Pairing Code:', pairingCode)
      console.log('📱 Column:', columnName)
      
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
      
      // Save scan result to localStorage for the results page
      const scanResult = {
        id: Date.now().toString(),
        barcode: decodedText,
        timestamp: new Date().toISOString(),
        success: true,
        foundRows: foundRows, // Now populated with actual lookup results
        column: columnName,
        tableId
      }
      
      // Add to local scan history for real-time display
      setScanHistory(prev => [scanResult, ...prev.slice(0, 9)]) // Keep last 10 scans
      
      const existingResults = JSON.parse(localStorage.getItem(`scan_results_${tableId}_${columnName}`) || '[]')
      existingResults.unshift(scanResult)
      localStorage.setItem(`scan_results_${tableId}_${columnName}`, JSON.stringify(existingResults.slice(0, 100))) // Keep last 100 results
      
      // Send scan result to desktop via Supabase - broadcast to multiple channels
      if (channelRef.current) {
        const broadcastPayload = {
          barcode: decodedText,
          column: columnName,
          tableId,
          pairingCode,
          timestamp: new Date().toISOString(),
          deviceType: 'mobile',
          // Include complete scan result data for real-time updates
          scanResult: scanResult,
          foundRows: foundRows
        }

        // Broadcast to the pairing channel (for desktop modal)
        channelRef.current.send({
          type: 'broadcast',
          event: 'barcode_scanned',
          payload: broadcastPayload
        })
        console.log('📡 Sent scan result to pairing channel:', decodedText)

        // Also broadcast to the scan-results channel (for scan-results page)
        const resultsChannelName = `scan_results_${tableId}_${columnName}`
        const resultsChannel = supabase.channel(resultsChannelName)
        resultsChannel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            resultsChannel.send({
              type: 'broadcast',
              event: 'barcode_scanned',
              payload: broadcastPayload
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

  const handleStartScanning = () => {
    setIsScanning(true)
    setError(null)
  }

  const handleStopScanning = () => {
    setIsScanning(false)
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error)
      scannerRef.current = null
    }
  }

  const handleScanAnother = () => {
    setError(null)
    
    // Properly clear the existing scanner
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error)
      scannerRef.current = null
    }
    
    // Reset scanning state and reinitialize
    setIsScanning(false)
    
    // Use setTimeout to ensure state has been updated before reinitializing
    setTimeout(() => {
      setIsScanning(true)
    }, 100)
  }

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connecting':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500" />
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-500" />
      case 'disconnected':
        return <WifiOff className="w-4 h-4 text-red-500" />
    }
  }

  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connecting':
        return 'Connecting...'
      case 'connected':
        return 'Connected to desktop'
      case 'disconnected':
        return 'Connection lost'
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-sm w-full p-6 text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Connection Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.back()} className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Custom styles to override html5-qrcode white text */}
      <style jsx global>{`
        #mobile-scanner-element {
          color: #374151 !important;
        }
        #mobile-scanner-element * {
          color: #374151 !important;
        }
        #mobile-scanner-element button {
          background-color: #7C3AED !important;
          border-color: #7C3AED !important;
          color: white !important;
          border-radius: 0.5rem !important;
          padding: 0.75rem 1.5rem !important;
          font-weight: 500 !important;
          margin: 0.5rem !important;
        }
        #mobile-scanner-element button:hover {
          background-color: #6D28D9 !important;
        }
        #mobile-scanner-element select {
          background-color: white !important;
          border: 1px solid #D1D5DB !important;
          border-radius: 0.375rem !important;
          padding: 0.5rem !important;
          color: #374151 !important;
          margin: 0.5rem !important;
        }
        #mobile-scanner-element .qr-code-text,
        #mobile-scanner-element div,
        #mobile-scanner-element span,
        #mobile-scanner-element p {
          color: #374151 !important;
        }
        .html5-qrcode-element {
          color: #374151 !important;
        }
      `}</style>
      
      {/* Fixed Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center space-x-2 text-sm">
            {getConnectionIcon()}
            <span className={`font-medium ${
              connectionStatus === 'connected' ? 'text-green-700' :
              connectionStatus === 'connecting' ? 'text-orange-700' :
              'text-red-700'
            }`}>
              {getConnectionText()}
            </span>
          </div>
          
          {scanHistory.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResults(!showResults)}
            >
              {showResults ? 'Hide' : 'Results'} ({scanHistory.length})
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 max-w-sm mx-auto w-full">
        {/* Scanner Info */}
        <Card className="p-4 mb-4">
          <div className="text-center">
            <ScanLine className="w-8 h-8 mx-auto text-purple-600 mb-2" />
            <h1 className="text-lg font-semibold text-gray-900 mb-2">
              Mobile Scanner
            </h1>
            <div className="text-sm text-gray-600">
              <p>Column: <span className="font-medium text-gray-900">{columnName}</span></p>
              <p className="text-xs text-gray-500 mt-1">Code: {pairingCode}</p>
            </div>
          </div>
        </Card>

        {/* Scanner Interface */}
        {connectionStatus === 'connected' && (
          <Card className="p-4 mb-4">
            {isScanning ? (
              <div>
                <div 
                  id="mobile-scanner-element" 
                  ref={scannerElementRef}
                  className="w-full rounded-lg overflow-hidden mb-4"
                />
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-3">
                    Camera is scanning automatically
                  </p>
                  <Button 
                    onClick={handleStopScanning}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Stop Camera
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Camera className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600 mb-4">Ready to scan barcodes</p>
                <Button 
                  onClick={handleStartScanning}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Start Camera
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* Connection Status */}
        {connectionStatus === 'connecting' && (
          <Card className="p-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-3" />
            <p className="text-gray-600 mb-3">Connecting to desktop...</p>
            <Button 
              onClick={() => {
                setConnectionStatus('connected')
                setIsScanning(true)
              }}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Start Anyway
            </Button>
          </Card>
        )}
      </div>

      {/* Slide-up Results Panel */}
      {showResults && scanHistory.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowResults(false)}>
          <div 
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl max-h-[70vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Results Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-900">Recent Scans ({scanHistory.length})</h3>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const resultsUrl = `/scan-results?table=${tableId}&column=${columnName}`
                    window.open(resultsUrl, '_blank')
                  }}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  View All
                </Button>
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowResults(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Results List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {scanHistory.map((scan, index) => (
                <div 
                  key={scan.id} 
                  className={`p-3 rounded-lg border ${
                    index === 0 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <code className="text-sm font-mono text-gray-900 break-all font-medium">
                      {scan.barcode}
                    </code>
                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                      scan.foundRows.length > 0 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {scan.foundRows.length > 0 
                        ? `${scan.foundRows.length} found`
                        : 'No matches'
                      }
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(scan.timestamp).toLocaleTimeString()}
                    {scan.foundRows.length > 0 && scan.foundRows[0] && (
                      <div className="mt-1 text-green-600">
                        {Object.entries(scan.foundRows[0].data).slice(0, 2).map(([key, value]: [string, any]) => 
                          `${key}: ${value}`
                        ).join(' • ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ScanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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