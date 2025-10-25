"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Activity, Users, UserCheck, TrendingUp, Clock, Smartphone, Settings as SettingsIcon, QrCode, Loader2, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/ui-components/button";
import { Card } from "@/ui-components/card";
import { pulseClient, PulseDashboardStats, PulseEnabledTable, PulseScannerSession } from "@/lib/api/pulse-client";
import { PulseQRPairingModal } from "@/components/Pulse/PulseQRPairingModal";
import { PulseSettingsModal } from "@/components/Pulse/PulseSettingsModal";
import { supabase } from "@/lib/supabase";
import { tablesSupabase } from "@/lib/api/tables-supabase";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function PulseDashboard() {
  const params = useParams();
  const router = useRouter();
  const tableId = params.tableId as string;

  const [config, setConfig] = useState<PulseEnabledTable | null>(null);
  const [stats, setStats] = useState<PulseDashboardStats | null>(null);
  const [sessions, setSessions] = useState<PulseScannerSession[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [checkInPopup, setCheckInPopup] = useState<any | null>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    loadDashboard();
  }, [tableId]);

  // Separate effect for real-time channel setup after config is loaded
  useEffect(() => {
    if (config?.id) {
      setupRealtimeChannel();
    }

    return () => {
      // Cleanup real-time channel on unmount
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [config?.id, tableId]);

  const setupRealtimeChannel = async () => {
    if (!config?.id) return;

    // Remove existing channel if any
    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current);
    }

    try {
      console.log('🔴 Setting up real-time channel for table:', tableId);
      
      const channel = supabase
        .channel(`pulse_${tableId}_${Date.now()}`) // Unique channel name
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'pulse_check_ins',
            filter: `table_id=eq.${tableId}`
          },
          (payload) => {
            console.log('🔴 Real-time check-in received:', payload);
            
            // Reload stats and sessions immediately
            loadStats();
            loadSessions();
            
            // Show popup notification if enabled
            const checkIn = payload.new as any;
            if (config?.settings?.show_popup) {
              setCheckInPopup({
                name: checkIn.row_data?.name || checkIn.scanner_user_name || 'Guest',
                email: checkIn.row_data?.email || '',
                barcode: checkIn.barcode_scanned,
                timestamp: new Date(),
                isWalkIn: checkIn.is_walk_in || false,
              });
              
              // Auto-close after 5 seconds
              setTimeout(() => {
                setCheckInPopup(null);
              }, 5000);
            }
            
            // Show toast notification
            toast.success('New Check-in!', {
              description: `${checkIn.scanner_user_name || 'Guest'} • ${checkIn.barcode_scanned}`,
              duration: 3000,
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'pulse_check_ins',
            filter: `table_id=eq.${tableId}`
          },
          (payload) => {
            console.log('🔴 Check-in updated:', payload);
            loadStats();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'pulse_scanner_sessions',
            filter: `pulse_table_id=eq.${config.id}`
          },
          (payload) => {
            console.log('📱 Scanner session update:', payload);
            // Reload sessions immediately
            loadSessions();
          }
        )
        .subscribe((status) => {
          console.log('📡 Pulse real-time status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('✅ Real-time updates active for table:', tableId);
            toast.success('Real-time updates active', { duration: 2000 });
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Real-time channel error');
            toast.error('Real-time updates failed, using polling', { duration: 3000 });
            // Fallback to polling
            const interval = setInterval(() => {
              loadStats();
              loadSessions();
            }, 3000); // Poll every 3 seconds
            return () => clearInterval(interval);
          }
        });

      channelRef.current = channel;
    } catch (error) {
      console.error('Failed to setup real-time channel:', error);
      toast.error('Real-time updates failed, using polling');
      // Fallback to polling if real-time fails
      const interval = setInterval(() => {
        loadStats();
        loadSessions();
      }, 3000); // Poll every 3 seconds
      return () => clearInterval(interval);
    }
  };

  const loadDashboard = async () => {
    try {
      await Promise.all([
        loadConfig(),
        loadStats(),
        loadSessions(),
        loadColumns(),
      ]);
    } catch (error) {
      console.error("Error loading dashboard:", error);
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadConfig = async () => {
    const data = await pulseClient.getPulseConfig(tableId);
    setConfig(data);
  };

  const loadStats = async () => {
    const data = await pulseClient.getDashboardStats(tableId, 10);
    setStats(data);
  };

  const loadSessions = async () => {
    const data = await pulseClient.getScannerSessions(tableId, true);
    setSessions(data);
  };

  const loadColumns = async () => {
    try {
      const table = await tablesSupabase.get(tableId);
      if (table?.columns) {
        setColumns(table.columns);
      }
    } catch (error) {
      console.error("Error loading columns:", error);
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!config || !stats) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Pulse Not Found</h2>
          <p className="text-gray-600 mb-4">This table doesn't have Pulse enabled.</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Table
              </Button>
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Pulse Dashboard</h1>
                  <p className="text-sm text-gray-600">Real-time event check-in</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowSettings(!showSettings)}
                className="gap-2"
              >
                <SettingsIcon className="h-4 w-4" />
                Settings
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white gap-2"
                onClick={() => setShowQRModal(true)}
              >
                <QrCode className="h-4 w-4" />
                Pair Scanner
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Stats Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Total RSVPs */}
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total RSVPs</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {stats.total_rsvps}
                    </p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </Card>

              {/* Checked In */}
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Checked In</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                      {stats.checked_in_count}
                    </p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <UserCheck className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </Card>

              {/* Check-in Rate */}
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Check-in Rate</p>
                    <p className="text-3xl font-bold text-purple-600 mt-2">
                      {stats.check_in_rate}%
                    </p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </Card>

              {/* Walk-ins */}
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Walk-ins</p>
                    <p className="text-3xl font-bold text-orange-600 mt-2">
                      {stats.walk_in_count}
                    </p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <Users className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent Check-ins */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Check-ins</h3>
                <span className="text-sm text-gray-500">
                  Last updated: {formatTime(stats.last_check_in_at)}
                </span>
              </div>
              
              {stats.recent_check_ins.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No check-ins yet</p>
                  <p className="text-sm text-gray-400 mt-1">Check-ins will appear here in real-time</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.recent_check_ins.map((checkIn) => (
                    <div
                      key={checkIn.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-full">
                          <UserCheck className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {checkIn.scanner_user_name || "Guest Scanner"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {checkIn.barcode_scanned}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-700">
                          {formatTime(checkIn.check_in_time)}
                        </p>
                        {checkIn.check_in_count > 1 && (
                          <p className="text-xs text-orange-600">
                            {checkIn.check_in_count}x scanned
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: Active Scanners & Settings */}
          <div className="space-y-6">
            {/* Active Scanners */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Scanners</h3>
              
              <div className="flex items-center gap-3 mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <Smartphone className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-900">
                    {sessions.length} Active
                  </p>
                  <p className="text-xs text-green-700">Scanning now</p>
                </div>
              </div>

              {sessions.length === 0 ? (
                <div className="text-center py-6">
                  <Smartphone className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No active scanners</p>
                  <p className="text-xs text-gray-400 mt-1">Pair a mobile device to start</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-gray-900 text-sm">
                          {session.scanner_name}
                        </p>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-xs text-green-600">Live</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">{session.scanner_email}</p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                        <span className="text-xs text-gray-600">
                          {session.total_scans} scans
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTime(session.last_scan_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Quick Settings */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Settings</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Show Popup</span>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    config.settings.show_popup ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {config.settings.show_popup ? 'On' : 'Off'}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Play Sound</span>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    config.settings.play_sound ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {config.settings.play_sound ? 'On' : 'Off'}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Duplicate Scans</span>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    config.settings.allow_duplicate_scans ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {config.settings.allow_duplicate_scans ? 'Allowed' : 'Blocked'}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Scan Mode</span>
                  <div className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 capitalize">
                    {config.settings.scan_mode}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Guest Scanning</span>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    config.settings.guest_scanning_enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {config.settings.guest_scanning_enabled ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setShowSettings(true)}
              >
                <SettingsIcon className="h-4 w-4 mr-2" />
                Configure Settings
              </Button>
            </Card>
          </div>
        </div>
      </div>

      {/* QR Pairing Modal */}
      {config && (
        <PulseQRPairingModal
          open={showQRModal}
          onOpenChange={setShowQRModal}
          tableId={tableId}
          pulseTableId={config.id}
        />
      )}

      {/* Settings Modal */}
      {config && (
        <PulseSettingsModal
          open={showSettings}
          onOpenChange={setShowSettings}
          tableId={tableId}
          currentConfig={config}
          columns={columns}
          onSaved={() => {
            loadConfig(); // Reload config to show updated settings
            toast.success("Settings updated successfully!");
          }}
        />
      )}

      {/* Check-in Popup Notification */}
      <AnimatePresence>
        {checkInPopup && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed top-4 right-4 z-50 max-w-sm w-full"
          >
            <Card className={`p-4 shadow-2xl border-2 ${
              checkInPopup.isWalkIn 
                ? 'border-orange-500 bg-orange-50' 
                : 'border-green-500 bg-green-50'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${
                  checkInPopup.isWalkIn 
                    ? 'bg-orange-100' 
                    : 'bg-green-100'
                }`}>
                  {checkInPopup.isWalkIn ? (
                    <Users className={`h-6 w-6 ${
                      checkInPopup.isWalkIn 
                        ? 'text-orange-600' 
                        : 'text-green-600'
                    }`} />
                  ) : (
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`font-bold text-lg ${
                      checkInPopup.isWalkIn 
                        ? 'text-orange-900' 
                        : 'text-green-900'
                    }`}>
                      {checkInPopup.isWalkIn ? 'Walk-in Added!' : 'Checked In!'}
                    </h4>
                    <button
                      onClick={() => setCheckInPopup(null)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <XCircle className="h-5 w-5" />
                    </button>
                  </div>
                  <p className="text-gray-900 font-medium mb-1">
                    {checkInPopup.name}
                  </p>
                  {checkInPopup.email && (
                    <p className="text-sm text-gray-600 mb-1">
                      {checkInPopup.email}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500 font-mono">
                      ID: {checkInPopup.barcode}
                    </p>
                    <p className="text-xs text-gray-400">
                      {checkInPopup.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
