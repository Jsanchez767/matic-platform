"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/ui-components/dialog";
import { Button } from "@/ui-components/button";
import { Settings as SettingsIcon, Save, Loader2 } from "lucide-react";
import { pulseClient, PulseEnabledTable, PulseSettings } from "@/lib/api/pulse-client";
import { toast } from "sonner";

interface PulseSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableId: string;
  currentConfig: PulseEnabledTable;
  onSaved: () => void;
}

export function PulseSettingsModal({
  open,
  onOpenChange,
  tableId,
  currentConfig,
  onSaved
}: PulseSettingsModalProps) {
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PulseSettings>(currentConfig.settings);

  // Reset settings when modal opens
  useEffect(() => {
    if (open) {
      setSettings(currentConfig.settings);
    }
  }, [open, currentConfig]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await pulseClient.updatePulseConfig(tableId, { settings });
      toast.success("Settings saved successfully!");
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const toggleSetting = (key: keyof PulseSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const setScanMode = (mode: 'rapid' | 'verification' | 'manual') => {
    setSettings(prev => ({
      ...prev,
      scan_mode: mode
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="bg-green-100 p-2 rounded-lg">
              <SettingsIcon className="h-5 w-5 text-green-600" />
            </div>
            Pulse Settings
          </DialogTitle>
          <DialogDescription>
            Configure how Pulse check-in behaves for this event
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 overflow-y-auto flex-1">
          {/* Display Settings */}
          <div>
            <h4 className="font-semibold text-sm text-gray-900 mb-3">Display</h4>
            <div className="space-y-3">
              {/* Show Popup */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Show Check-in Popup</p>
                  <p className="text-xs text-gray-600">Display popup on dashboard when someone checks in</p>
                </div>
                <button
                  onClick={() => toggleSetting('show_popup')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.show_popup ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.show_popup ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Play Sound */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Play Sound</p>
                  <p className="text-xs text-gray-600">Play sound effect on successful check-in</p>
                </div>
                <button
                  onClick={() => toggleSetting('play_sound')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.play_sound ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.play_sound ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Highlight Checked In */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Highlight Checked-In</p>
                  <p className="text-xs text-gray-600">Highlight rows in table when checked in</p>
                </div>
                <button
                  onClick={() => toggleSetting('highlight_checked_in')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.highlight_checked_in ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.highlight_checked_in ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Show Photos */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Show Student Photos</p>
                  <p className="text-xs text-gray-600">Display profile photos in check-in popup and table</p>
                </div>
                <button
                  onClick={() => toggleSetting('show_photos')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.show_photos ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.show_photos ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Show RSVP Notes */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Show RSVP Notes</p>
                  <p className="text-xs text-gray-600">Display notes/comments in check-in popup</p>
                </div>
                <button
                  onClick={() => toggleSetting('show_notes')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.show_notes ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.show_notes ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Auto-scroll */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Auto-Scroll to Latest</p>
                  <p className="text-xs text-gray-600">Auto-scroll dashboard to show latest check-in</p>
                </div>
                <button
                  onClick={() => toggleSetting('auto_scroll')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.auto_scroll ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.auto_scroll ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Alert Settings */}
          <div>
            <h4 className="font-semibold text-sm text-gray-900 mb-3">Alerts</h4>
            <div className="space-y-3">
              {/* Alert on Duplicate */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Alert on Duplicate Scan</p>
                  <p className="text-xs text-gray-600">Show warning when same person scans multiple times</p>
                </div>
                <button
                  onClick={() => toggleSetting('alert_on_duplicate')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.alert_on_duplicate ? 'bg-orange-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.alert_on_duplicate ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Alert on Non-RSVP */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Alert on Non-RSVP Scan</p>
                  <p className="text-xs text-gray-600">Show alert when scanned barcode not on RSVP list</p>
                </div>
                <button
                  onClick={() => toggleSetting('alert_on_non_rsvp')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.alert_on_non_rsvp ? 'bg-red-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.alert_on_non_rsvp ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Scanning Behavior */}
          <div>
            <h4 className="font-semibold text-sm text-gray-900 mb-3">Scanning Behavior</h4>
            <div className="space-y-3">
              {/* Allow Duplicate Scans */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Allow Duplicate Scans</p>
                  <p className="text-xs text-gray-600">Allow same person to check in multiple times</p>
                </div>
                <button
                  onClick={() => toggleSetting('allow_duplicate_scans')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.allow_duplicate_scans ? 'bg-orange-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.allow_duplicate_scans ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Scan Mode */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900 mb-2">Scan Mode</p>
                <p className="text-xs text-gray-600 mb-3">How the scanner processes barcodes</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setScanMode('rapid')}
                    className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                      settings.scan_mode === 'rapid'
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Rapid
                  </button>
                  <button
                    onClick={() => setScanMode('verification')}
                    className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                      settings.scan_mode === 'verification'
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Verify
                  </button>
                  <button
                    onClick={() => setScanMode('manual')}
                    className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                      settings.scan_mode === 'manual'
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Manual
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {settings.scan_mode === 'rapid' && '⚡ Instant check-in without confirmation'}
                  {settings.scan_mode === 'verification' && '✓ Shows preview before confirming'}
                  {settings.scan_mode === 'manual' && '👆 Requires tap to confirm each scan'}
                </p>
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          <div>
            <h4 className="font-semibold text-sm text-gray-900 mb-3">Advanced</h4>
            <div className="space-y-3">
              {/* Offline Mode */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Offline Mode</p>
                  <p className="text-xs text-gray-600">Cache RSVP list for offline scanning</p>
                </div>
                <button
                  onClick={() => toggleSetting('offline_mode')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.offline_mode ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.offline_mode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Guest Scanning */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Guest Scanning</p>
                  <p className="text-xs text-gray-600">Allow scanning without authentication</p>
                </div>
                <button
                  onClick={() => toggleSetting('guest_scanning_enabled')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.guest_scanning_enabled ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.guest_scanning_enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
