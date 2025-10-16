'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode'
import { Camera, CameraOff, Smartphone, Monitor, QrCode, ArrowLeft, Wifi, WifiOff } from 'lucide-react'
import { Button } from '@/ui-components/button'
import QRCode from 'qrcode'
import type { TableColumn } from '@/types/data-tables'

interface BarcodeScannerProps {
  tableId: string
  selectedColumn: TableColumn
  isScanning: boolean
  isConnected: boolean
  connectedDevices: Array<{
    id: string
    type: 'mobile' | 'desktop'
    userAgent: string
    lastSeen: Date
  }>
  onStartScanning: () => void
  onStopScanning: () => void
  onBack: () => void
  onScanSuccess?: (barcode: string) => void
}

export function BarcodeScanner({
  tableId,
  selectedColumn,
  isScanning,
  isConnected,
  connectedDevices,
  onStartScanning,
  onStopScanning,
  onBack,
  onScanSuccess
}: BarcodeScannerProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('')
  const [pairingCode, setPairingCode] = useState<string>('')
  const [hasCamera, setHasCamera] = useState(false)
  const [scannerError, setScannerError] = useState<string>('')
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const scannerElementRef = useRef<HTMLDivElement>(null)

  // Detect if this is a mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      setIsMobile(isMobileDevice)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Check camera availability
  useEffect(() => {
    if (isMobile) {
      navigator.mediaDevices?.getUserMedia({ video: true })
        .then(() => setHasCamera(true))
        .catch(() => setHasCamera(false))
    }
  }, [isMobile])

  // Generate pairing QR code for desktop users
  useEffect(() => {
    if (!isMobile) {
      generatePairingQR()
    }
  }, [isMobile, tableId])

  // Initialize camera scanner for mobile
  useEffect(() => {
    if (isMobile && hasCamera && isScanning && scannerElementRef.current) {
      initializeMobileScanner()
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error)
        scannerRef.current = null
      }
    }
  }, [isMobile, hasCamera, isScanning])

  const generatePairingQR = async () => {
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase()
      setPairingCode(code)
      
      // Use current location origin, but ensure it's correct for development
      let baseUrl = window.location.origin
      
      // If we're in development and the origin doesn't start with localhost, 
      // fallback to localhost with current port
      if (process.env.NODE_ENV === 'development' && !baseUrl.includes('localhost')) {
        baseUrl = `http://localhost:${window.location.port || '3003'}`
      }
      
      const pairingData = {
        type: 'barcode_scanner_pairing',
        tableId,
        columnName: selectedColumn.name,
        pairingCode: code,
        url: `${baseUrl}/scan?table=${tableId}&column=${selectedColumn.name}&code=${code}`
      }
      
      console.log('🔗 Generated QR URL:', pairingData.url)
      
      const qrDataURL = await QRCode.toDataURL(JSON.stringify(pairingData), {
        width: 200,
        margin: 2,
        color: { dark: '#7C3AED', light: '#FFFFFF' }
      })
      
      setQrCodeDataURL(qrDataURL)
    } catch (error) {
      console.error('Error generating QR code:', error)
    }
  }

  const initializeMobileScanner = () => {
    if (!scannerElementRef.current) return

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      supportedScanTypes: [
        Html5QrcodeScanType.SCAN_TYPE_CAMERA
      ]
    }

    const scanner = new Html5QrcodeScanner(
      'barcode-scanner-element',
      config,
      false
    )

    const onScanSuccess = (decodedText: string) => {
      console.log('📱 Barcode scanned:', decodedText)
      
      // Trigger haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(200)
      }
      
      // Play success sound
      playSuccessSound()
      
      // Notify parent component
      if (onScanSuccess) {
        onScanSuccess(decodedText)
      }
      
      // Stop scanning after successful scan
      onStopScanning()
    }

    const onScanFailure = (error: string) => {
      // Ignore frequent scan failures, they're normal
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
      // Sound is nice-to-have, don't fail if audio context fails
      console.warn('Could not play success sound:', error)
    }
  }

  if (isMobile) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Smartphone className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-medium text-gray-900">
              Mobile Scanner
            </h3>
          </div>
          <p className="text-sm text-gray-600">
            Scanning column: <span className="font-medium">{selectedColumn.label}</span>
          </p>
        </div>

        {/* Connection Status */}
        <div className="flex items-center justify-center space-x-2 text-sm">
          {isConnected ? (
            <>
              <Wifi className="w-4 h-4 text-green-500" />
              <span className="text-green-700">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-red-500" />
              <span className="text-red-700">Disconnected</span>
            </>
          )}
        </div>

        {/* Camera Scanner */}
        {hasCamera ? (
          <div className="bg-gray-100 rounded-lg p-4">
            {isScanning ? (
              <div>
                <div 
                  id="barcode-scanner-element" 
                  ref={scannerElementRef}
                  className="w-full"
                />
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    Point your camera at a barcode or QR code
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={onStopScanning}
                    className="w-full"
                  >
                    <CameraOff className="w-4 h-4 mr-2" />
                    Stop Scanning
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Camera className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">Ready to scan barcodes</p>
                <Button 
                  onClick={onStartScanning}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Start Camera
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <CameraOff className="w-12 h-12 mx-auto text-red-400 mb-2" />
            <p className="text-red-700 font-medium mb-1">Camera Not Available</p>
            <p className="text-red-600 text-sm">
              Please allow camera access or use a device with camera support
            </p>
          </div>
        )}

        {/* Error Display */}
        {scannerError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">{scannerError}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </div>
    )
  }

  // Desktop view with QR code pairing
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Monitor className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-medium text-gray-900">
            Desktop Scanner
          </h3>
        </div>
        <p className="text-sm text-gray-600">
          Scanning column: <span className="font-medium">{selectedColumn.label}</span>
        </p>
      </div>

      {/* Connection Status */}
      <div className="flex items-center justify-center space-x-2 text-sm">
        {isConnected ? (
          <>
            <Wifi className="w-4 h-4 text-green-500" />
            <span className="text-green-700">Connected</span>
            {connectedDevices.length > 0 && (
              <span className="text-gray-500">
                ({connectedDevices.length} device{connectedDevices.length !== 1 ? 's' : ''})
              </span>
            )}
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 text-red-500" />
            <span className="text-red-700">Disconnected</span>
          </>
        )}
      </div>

      {/* QR Code Pairing */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 text-center">
        <QrCode className="w-8 h-8 mx-auto text-purple-600 mb-4" />
        <h4 className="font-medium text-gray-900 mb-2">Pair Your Mobile Device</h4>
        <p className="text-sm text-gray-600 mb-4">
          Scan this QR code with your phone to start scanning barcodes
        </p>
        
        {qrCodeDataURL && (
          <div className="bg-white p-4 rounded-lg inline-block mb-4">
            <img 
              src={qrCodeDataURL} 
              alt="Pairing QR Code" 
              className="w-48 h-48 mx-auto"
            />
          </div>
        )}
        
        {pairingCode && (
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Pairing Code:</p>
            <code className="bg-gray-100 px-3 py-1 rounded text-lg font-mono font-bold text-purple-600">
              {pairingCode}
            </code>
          </div>
        )}
      </div>

      {/* Connected Devices */}
      {connectedDevices.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">Connected Devices</h4>
          <div className="space-y-2">
            {connectedDevices.map((device) => (
              <div key={device.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  {device.type === 'mobile' ? (
                    <Smartphone className="w-4 h-4 text-green-600" />
                  ) : (
                    <Monitor className="w-4 h-4 text-green-600" />
                  )}
                  <span className="text-green-800 capitalize">{device.type} Device</span>
                </div>
                <span className="text-green-600 text-xs">
                  Last seen: {device.lastSeen.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>
    </div>
  )
}