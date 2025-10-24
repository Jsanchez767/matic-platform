"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/ui-components/dialog";
import { QrCode, Smartphone, Copy, Check, RefreshCw } from "lucide-react";
import { Button } from "@/ui-components/button";
import QRCode from "qrcode";
import { toast } from "sonner";

interface PulseQRPairingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableId: string;
  pulseTableId: string;
}

export function PulseQRPairingModal({ open, onOpenChange, tableId, pulseTableId }: PulseQRPairingModalProps) {
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>("");
  const [pairingCode, setPairingCode] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [scannerUrl, setScannerUrl] = useState<string>("");

  useEffect(() => {
    if (open) {
      generatePairingQR();
    }
  }, [open, tableId, pulseTableId]);

  const generatePairingQR = async () => {
    try {
      // Generate 6-character pairing code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      setPairingCode(code);

      // Build scanner URL
      let baseUrl = window.location.origin;
      
      // Development override
      const isLocalDev = process.env.NODE_ENV === 'development' || 
                        window.location.search.includes('dev=true') ||
                        localStorage.getItem('force_localhost') === 'true';
      
      if (isLocalDev && !baseUrl.includes('localhost')) {
        baseUrl = `http://localhost:${window.location.port || '3000'}`;
      }

      // Pulse scanner URL with mode parameter
      const url = `${baseUrl}/scan?table=${tableId}&pulse=${pulseTableId}&code=${code}&mode=pulse`;
      setScannerUrl(url);

      const pairingData = {
        type: 'pulse_scanner_pairing',
        tableId,
        pulseTableId,
        pairingCode: code,
        mode: 'pulse',
        url
      };

      console.log('🔗 Generated Pulse QR URL:', url);

      // Generate QR code with green color for Pulse
      const qrDataURL = await QRCode.toDataURL(JSON.stringify(pairingData), {
        width: 256,
        margin: 2,
        color: { dark: '#059669', light: '#FFFFFF' } // Green for Pulse
      });

      setQrCodeDataURL(qrDataURL);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    }
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(scannerUrl);
      setCopied(true);
      toast.success('URL copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy URL');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="bg-green-100 p-2 rounded-lg">
              <QrCode className="h-5 w-5 text-green-600" />
            </div>
            Pair Mobile Scanner
          </DialogTitle>
          <DialogDescription>
            Scan this QR code with your mobile device to start scanning attendee barcodes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* QR Code Display */}
          {qrCodeDataURL ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
                <img 
                  src={qrCodeDataURL} 
                  alt="Pulse Scanner QR Code"
                  className="w-64 h-64"
                />
              </div>

              {/* Pairing Code */}
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Pairing Code</p>
                <div className="font-mono text-2xl font-bold text-green-600 tracking-wider">
                  {pairingCode}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-green-600" />
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <Smartphone className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm text-blue-900 mb-2">
                  How to pair:
                </h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Open your phone's camera app</li>
                  <li>Point camera at QR code above</li>
                  <li>Tap the notification to open scanner</li>
                  <li>Enter your name and start scanning!</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Manual URL Option */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500">Or copy the link manually:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={scannerUrl}
                readOnly
                className="flex-1 px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-lg font-mono"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={copyUrl}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between gap-2">
            <Button
              variant="outline"
              onClick={generatePairingQR}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              New Code
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
