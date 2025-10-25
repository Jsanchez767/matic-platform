"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui-components/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/ui-components/dialog";
import { Activity, Loader2 } from "lucide-react";
import { pulseSupabase } from "@/lib/api/pulse-supabase";
import { toast } from "sonner";

interface EnablePulseButtonProps {
  tableId: string;
  workspaceId: string;
}

export function EnablePulseButton({ tableId, workspaceId }: EnablePulseButtonProps) {
  const router = useRouter();
  const [isPulseEnabled, setIsPulseEnabled] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnabling, setIsEnabling] = useState(false);
  const [showEnableDialog, setShowEnableDialog] = useState(false);

  // Check if Pulse is already enabled
  useEffect(() => {
    checkPulseStatus();
  }, [tableId]);

  const checkPulseStatus = async () => {
    try {
      const config = await pulseSupabase.getPulseConfig(tableId);
      setIsPulseEnabled(config?.enabled || false);
    } catch (error: any) {
      console.error("Error checking Pulse status:", error);
      setIsPulseEnabled(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnablePulse = async () => {
    console.log('🔵 Enable Pulse clicked', { tableId, workspaceId });
    setIsEnabling(true);
    try {
      console.log('📤 Sending enablePulse request...');
      const result = await pulseSupabase.enablePulse({
        table_id: tableId,
        workspace_id: workspaceId,
      });
      console.log('✅ Pulse enabled successfully:', result);
      
      toast.success("Pulse enabled! Opening dashboard...");
      setIsPulseEnabled(true);
      setShowEnableDialog(false);
      
      // Redirect to Pulse dashboard
      router.push(`/pulse/${tableId}`);
    } catch (error: any) {
      console.error("❌ Error enabling Pulse:", error);
      toast.error(error.message || "Failed to enable Pulse");
    } finally {
      setIsEnabling(false);
    }
  };

  const handleOpenDashboard = () => {
    router.push(`/pulse/${tableId}`);
  };

  if (isLoading) {
    return null; // Or show skeleton
  }

  if (isPulseEnabled) {
    // Pulse is enabled - show dashboard button
    return (
      <Button
        onClick={handleOpenDashboard}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        <Activity className="h-4 w-4 mr-2" />
        Pulse Dashboard
      </Button>
    );
  }

  // Pulse not enabled - show enable button
  return (
    <>
      <Button
        onClick={() => setShowEnableDialog(true)}
        variant="outline"
        className="border-green-600 text-green-600 hover:bg-green-50"
      >
        <Activity className="h-4 w-4 mr-2" />
        Enable Pulse
      </Button>

      <Dialog open={showEnableDialog} onOpenChange={setShowEnableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable Pulse Check-In</DialogTitle>
            <DialogDescription>
              Transform this table into a real-time event check-in system
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">What is Pulse?</h4>
              <p className="text-sm text-gray-600">
                Pulse turns your table into a powerful event check-in system with:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Real-time attendance tracking</li>
                <li>• Mobile barcode scanning</li>
                <li>• Live dashboard with stats</li>
                <li>• Multiple scanner support</li>
                <li>• Offline mode for venues</li>
                <li>• Guest scanning (no accounts needed)</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Perfect for:</strong> Conferences, concerts, workshops, meetups, 
                class attendance, or any event with 50+ attendees
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm">How it works:</h4>
              <ol className="text-sm text-gray-600 space-y-1 ml-4 list-decimal">
                <li>Enable Pulse on this table</li>
                <li>Configure check-in settings in dashboard</li>
                <li>Pair mobile devices with QR code</li>
                <li>Staff scans attendee barcodes/QR codes</li>
                <li>Dashboard updates in real-time</li>
              </ol>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                console.log('Cancel button clicked');
                setShowEnableDialog(false);
              }}
              disabled={isEnabling}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                console.log('🟢 Enable Pulse button clicked');
                handleEnablePulse();
              }}
              disabled={isEnabling}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isEnabling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enabling...
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4 mr-2" />
                  Enable Pulse
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
