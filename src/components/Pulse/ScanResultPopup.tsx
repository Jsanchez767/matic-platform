"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, User, Phone, Mail, MapPin, Clock, X } from "lucide-react";
import { Button } from "@/ui-components/button";

interface ScanResultPopupProps {
  open: boolean;
  onClose: () => void;
  success: boolean;
  rowData?: Record<string, any>;
  barcodeValue: string;
  checkInTime: Date;
  scannerName?: string;
  isDuplicate?: boolean;
  checkInCount?: number;
  onAddWalkIn?: () => void;
  autoCloseSeconds?: number;
}

export function ScanResultPopup({
  open,
  onClose,
  success,
  rowData,
  barcodeValue,
  checkInTime,
  scannerName,
  isDuplicate = false,
  checkInCount = 1,
  onAddWalkIn,
  autoCloseSeconds = 3
}: ScanResultPopupProps) {
  const [countdown, setCountdown] = useState(autoCloseSeconds);

  // Auto-close timer
  useEffect(() => {
    if (!open || !success) {
      setCountdown(autoCloseSeconds);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onClose();
          return autoCloseSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, success, onClose, autoCloseSeconds]);

  // Reset countdown when opening
  useEffect(() => {
    if (open) {
      setCountdown(autoCloseSeconds);
    }
  }, [open, autoCloseSeconds]);

  // Vibration feedback
  useEffect(() => {
    if (open && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      if (success) {
        // Two short vibrations for success
        navigator.vibrate([100, 50, 100]);
      } else {
        // One long vibration for failure
        navigator.vibrate(400);
      }
    }
  }, [open, success]);

  if (!open) return null;

  // Visual feedback animations
  const flashClass = success 
    ? "animate-pulse-green" 
    : "animate-pulse-red";

  // Extract common fields from rowData
  const getName = () => {
    if (!rowData) return "Unknown";
    return rowData.name || rowData.Name || rowData.full_name || rowData["Full Name"] || "Unknown";
  };

  const getEmail = () => {
    if (!rowData) return undefined;
    return rowData.email || rowData.Email || rowData["Email Address"];
  };

  const getPhone = () => {
    if (!rowData) return undefined;
    return rowData.phone || rowData.Phone || rowData["Phone Number"];
  };

  const getGroup = () => {
    if (!rowData) return undefined;
    return rowData.school || rowData.School || rowData.group || rowData.Group || rowData.company || rowData.Company;
  };

  const getPhoto = () => {
    if (!rowData) return undefined;
    return rowData.photo || rowData.Photo || rowData.avatar || rowData.Avatar || rowData.image || rowData.Image;
  };

  const getNotes = () => {
    if (!rowData) return undefined;
    return rowData.notes || rowData.Notes || rowData.comments || rowData.Comments;
  };

  return (
    <>
      {/* Full-screen flash overlay */}
      <div 
        className={`fixed inset-0 z-[100] pointer-events-none ${flashClass}`}
        style={{
          backgroundColor: success ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
          animation: success ? 'flash-green 0.5s ease-out' : 'flash-red 0.5s ease-out'
        }}
      />

      {/* Modal Overlay */}
      <div className="fixed inset-0 z-[101] bg-black/50 flex items-center justify-center p-4">
        <div 
          className={`relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all duration-300 ${
            open ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Success State */}
          {success && (
            <div className="p-6 text-center">
              {/* Status Icon */}
              <div className={`mx-auto w-20 h-20 mb-4 rounded-full flex items-center justify-center ${
                isDuplicate ? 'bg-orange-100' : 'bg-green-100'
              }`}>
                <CheckCircle className={`h-12 w-12 ${isDuplicate ? 'text-orange-600' : 'text-green-600'}`} />
              </div>

              {/* Status Text */}
              <h3 className={`text-2xl font-bold mb-1 ${isDuplicate ? 'text-orange-600' : 'text-green-600'}`}>
                {isDuplicate ? 'ALREADY CHECKED IN' : 'RSVP CONFIRMED'}
              </h3>
              {isDuplicate && checkInCount > 1 && (
                <p className="text-sm text-orange-600 mb-4">
                  Check-in #{checkInCount}
                </p>
              )}

              {/* Photo */}
              {getPhoto() && (
                <div className="mb-4">
                  <img 
                    src={getPhoto()} 
                    alt={getName()} 
                    className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-green-200"
                  />
                </div>
              )}

              {/* Attendee Info */}
              <div className="space-y-3 mb-4 text-left">
                {/* Name */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <User className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-medium">Name</p>
                    <p className="text-sm font-semibold text-gray-900">{getName()}</p>
                  </div>
                </div>

                {/* Email */}
                {getEmail() && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 font-medium">Email</p>
                      <p className="text-sm text-gray-900">{getEmail()}</p>
                    </div>
                  </div>
                )}

                {/* Phone */}
                {getPhone() && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 font-medium">Phone</p>
                      <p className="text-sm text-gray-900">{getPhone()}</p>
                    </div>
                  </div>
                )}

                {/* Group/School */}
                {getGroup() && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 font-medium">School/Group</p>
                      <p className="text-sm text-gray-900">{getGroup()}</p>
                    </div>
                  </div>
                )}

                {/* Check-in Time */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Clock className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-medium">Check-in Time</p>
                    <p className="text-sm text-gray-900">
                      {checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* Scanner Info */}
                {scannerName && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-600">
                      Scanned by {scannerName}
                    </p>
                  </div>
                )}

                {/* Notes */}
                {getNotes() && (
                  <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                    <p className="text-xs text-yellow-700 font-medium mb-1">Notes</p>
                    <p className="text-sm text-yellow-900">{getNotes()}</p>
                  </div>
                )}
              </div>

              {/* Auto-close countdown */}
              <div className="text-xs text-gray-500 mb-3">
                Auto-closing in {countdown}s
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          )}

          {/* Not Found State */}
          {!success && (
            <div className="p-6 text-center">
              {/* Status Icon */}
              <div className="mx-auto w-20 h-20 mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-12 w-12 text-red-600" />
              </div>

              {/* Status Text */}
              <h3 className="text-2xl font-bold mb-2 text-red-600">
                NOT ON RSVP LIST
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                This barcode was not found in the RSVP list
              </p>

              {/* Scanned Barcode */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 font-medium mb-1">Scanned Code</p>
                <p className="text-lg font-mono font-bold text-gray-900">{barcodeValue}</p>
              </div>

              {/* Check-in Time */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {/* Scanner Info */}
              {scannerName && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-600">
                    Scanned by {scannerName}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1"
                >
                  Close
                </Button>
                {onAddWalkIn && (
                  <Button
                    onClick={() => {
                      onAddWalkIn();
                      onClose();
                    }}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    Add as Walk-In
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes flash-green {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes flash-red {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </>
  );
}
