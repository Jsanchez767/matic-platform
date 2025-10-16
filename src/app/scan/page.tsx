'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, useRef, Suspense } from 'react'
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode'
import { ArrowLeft, ScanLine, Wifi, WifiOff, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/ui-components/button'
import { Card } from '@/ui-components/card'

function ScanPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const scannerElementRef = useRef<HTMLDivElement>(null)

  // Get pairing parameters from URL
  const tableId = searchParams.get('table')
  const columnName = searchParams.get('column')
  const pairingCode = searchParams.get('code')

  useEffect(() => {
    if (!tableId || !columnName || !pairingCode) {
      setError('Invalid pairing parameters. Please scan the QR code again.')
      return
    }

    // Simulate connection status (in real implementation, this would connect to Supabase)
    setTimeout(() => setConnectionStatus('connected'), 1000)
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
      supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
    }

    const scanner = new Html5QrcodeScanner(
      'mobile-scanner-element',
      config,
      false
    )

    const onScanSuccess = (decodedText: string) => {
      console.log('📱 Mobile scan success:', decodedText)
      
      // Trigger haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200])
      }
      
      // Play success sound
      playSuccessSound()
      
      setScanResult(decodedText)
      setIsScanning(false)
      
      // Here you would normally send the result to the desktop via Supabase
      // For now, we'll show the success message
    }

    const onScanFailure = (error: string) => {
      // Only log actual errors, not normal scan failures
      if (!error.includes('No MultiFormat Readers')) {
        console.warn('Scan failure:', error)
      }
    }

    scanner.render(onScanSuccess, onScanFailure)
    scannerRef.current = scanner
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
    setScanResult(null)
  }

  const handleStopScanning = () => {
    setIsScanning(false)
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error)
      scannerRef.current = null
    }
  }

  const handleScanAnother = () => {
    setScanResult(null)
    setError(null)
    handleStartScanning()
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
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
        </div>
      </div>

      <div className="p-4 max-w-sm mx-auto">
        {/* Pairing Info */}
        <Card className="p-4 mb-6">
          <div className="text-center">
            <ScanLine className="w-12 h-12 mx-auto text-purple-600 mb-3" />
            <h1 className="text-lg font-semibold text-gray-900 mb-2">
              Mobile Barcode Scanner
            </h1>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Scanning for column: <span className="font-medium">{columnName}</span></p>
              <p>Pairing code: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{pairingCode}</span></p>
            </div>
          </div>
        </Card>

        {/* Scan Result */}
        {scanResult && (
          <Card className="p-4 mb-6 border-green-200 bg-green-50">
            <div className="text-center">
              <CheckCircle className="w-12 h-12 mx-auto text-green-600 mb-3" />
              <h2 className="font-semibold text-green-900 mb-2">Scan Successful!</h2>
              <div className="bg-white border rounded p-3 mb-4">
                <code className="text-sm font-mono break-all">{scanResult}</code>
              </div>
              <p className="text-sm text-green-700 mb-4">
                Result sent to desktop. You can continue scanning or close this page.
              </p>
              <Button 
                onClick={handleScanAnother}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                Scan Another Code
              </Button>
            </div>
          </Card>
        )}

        {/* Scanner Interface */}
        {connectionStatus === 'connected' && !scanResult && (
          <Card className="p-4">
            {isScanning ? (
              <div>
                <div 
                  id="mobile-scanner-element" 
                  ref={scannerElementRef}
                  className="w-full mb-4"
                />
                <Button 
                  variant="outline" 
                  onClick={handleStopScanning}
                  className="w-full"
                >
                  Stop Scanning
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <ScanLine className="w-16 h-16 mx-auto text-purple-600 mb-4" />
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Ready to Scan</h2>
                <p className="text-gray-600 mb-6">
                  Point your camera at a barcode or QR code to scan it
                </p>
                <Button 
                  onClick={handleStartScanning}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <ScanLine className="w-4 h-4 mr-2" />
                  Start Camera
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* Loading state */}
        {connectionStatus === 'connecting' && (
          <Card className="p-4 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
            <p className="text-gray-600">Connecting to desktop scanner...</p>
          </Card>
        )}
      </div>
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