"use client";

import React, { useEffect, useState } from "react";
import { Plus, Settings, Trash2, FolderOpen, Layout } from "lucide-react";
import { Button } from "@/ui-components/button";
import { Card } from "@/ui-components/card";
import { Badge } from "@/ui-components/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/ui-components/dialog";
import { Input } from "@/ui-components/input";
import {
  listRequestHubs,
  createRequestHub,
  deleteRequestHub,
  type RequestHub
} from "@/lib/api/request-hubs-client";
import { supabase } from "@/lib/supabase";
import { useTabContext } from "@/components/WorkspaceTabProvider";
import { toast } from "sonner";

interface RequestHubListPageProps {
  workspaceId: string;
}

export function RequestHubListPage({ workspaceId }: RequestHubListPageProps) {
  const [hubs, setHubs] = useState<RequestHub[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedHub, setSelectedHub] = useState<RequestHub | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { tabManager } = useTabContext();
  
  // Form state
  const [newHubName, setNewHubName] = useState("");
  const [newHubDescription, setNewHubDescription] = useState("");
  const [newHubSlug, setNewHubSlug] = useState("");

  useEffect(() => {
    loadHubs();
  }, [workspaceId]);

  // Auto-generate slug from name
  useEffect(() => {
    if (newHubName) {
      const slug = newHubName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setNewHubSlug(slug);
    }
  }, [newHubName]);

  const loadHubs = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading request hubs for workspace:', workspaceId)
      const data = await listRequestHubs(workspaceId, { includeInactive: true });
      console.log('✅ Request hubs loaded:', data.length, data)
      setHubs(data);
      if (data.length === 0) {
        toast.info('No request hubs found. Create your first hub!')
      }
    } catch (error: any) {
      console.error('❌ Error loading request hubs:', error);
      toast.error(`Failed to load request hubs: ${error.message}`)
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHub = async () => {
    if (!newHubName.trim() || !newHubSlug.trim()) {
      return;
    }

    try {
      setCreating(true);
      
      // Get user ID from auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to create a hub.");
        return;
      }
      
      const newHub = await createRequestHub(workspaceId, {
        workspace_id: workspaceId,
        name: newHubName.trim(),
        slug: newHubSlug.trim(),
        description: newHubDescription.trim() || undefined,
        is_active: true,
        settings: {
          theme: {
            primary_color: "#6366f1",
          },
          notifications: {
            email_on_submit: true,
          },
        },
      });

      // Create default tabs - simplified config without metrics/charts for now
      const defaultTabs = [
        {
          hub_id: newHub.id,
          name: "Dashboard",
          slug: "dashboard",
          type: "dashboard" as const,
          icon: "LayoutDashboard",
          position: 0,
          config: {},  // Will be configured later in hub builder
        },
        {
          hub_id: newHub.id,
          name: "My Requests",
          slug: "my-requests",
          type: "my-requests" as const,
          icon: "User",
          position: 1,
          config: {},
        },
        {
          hub_id: newHub.id,
          name: "New Request",
          slug: "new-request",
          type: "new-request" as const,
          icon: "Plus",
          position: 2,
          config: {},
        },
      ];

      // Tabs are created automatically by the backend
      toast.success(`Request Hub "${newHub.name}" created successfully!`);
      
      setHubs([...hubs, newHub]);
      setCreateDialogOpen(false);
      resetForm();
      
      // Reload hubs to get the tabs
      await loadHubs();
    } catch (error) {
      console.error("Failed to create request hub:", error);
      alert("Failed to create request hub. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteHub = async () => {
    if (!selectedHub) return;

    try {
      setDeleting(true);
      await deleteRequestHub(workspaceId, selectedHub.id);
      setHubs(hubs.filter((h) => h.id !== selectedHub.id));
      toast.success(`Request Hub "${selectedHub.name}" deleted successfully`);
      setDeleteDialogOpen(false);
      setSelectedHub(null);
    } catch (error: any) {
      console.error("Failed to delete request hub:", error);
      toast.error(`Failed to delete request hub: ${error.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const resetForm = () => {
    setNewHubName("");
    setNewHubDescription("");
    setNewHubSlug("");
  };

  const handleOpenHub = (hub: RequestHub) => {
    // Open hub in new tab
    if (tabManager) {
      tabManager.addTab({
        title: hub.name,
        type: 'custom',
        url: `/workspace/${workspaceId}/request-hubs/${hub.slug}`,
        workspaceId,
        metadata: { hubId: hub.id, hubSlug: hub.slug }
      });
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading request hubs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Request Hubs</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage customizable request management systems
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Hub
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {hubs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-center max-w-md">
              <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Request Hubs Yet
              </h3>
              <p className="text-gray-600 mb-6">
                Create your first request hub to start managing requests with
                customizable workflows and forms.
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Hub
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hubs.map((hub) => (
              <Card
                key={hub.id}
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleOpenHub(hub)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Layout className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {hub.name}
                      </h3>
                      <p className="text-sm text-gray-500">/{hub.slug}</p>
                    </div>
                  </div>
                  <Badge variant={hub.is_active ? "default" : "secondary"}>
                    {hub.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>

                {hub.description && (
                  <p className="text-sm text-gray-600 mb-4">
                    {hub.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Request Hub</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Open settings
                        console.log("Settings for", hub);
                      }}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedHub(hub);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Hub Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Request Hub</DialogTitle>
            <DialogDescription>
              Create a new request management hub with customizable tabs and
              workflows.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Hub Name *
              </label>
              <Input
                placeholder="IT Support Requests"
                value={newHubName}
                onChange={(e) => setNewHubName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                URL Slug *
              </label>
              <Input
                placeholder="it-support-requests"
                value={newHubSlug}
                onChange={(e) => setNewHubSlug(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Used in the URL: /hub/{newHubSlug || "slug"}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Description
              </label>
              <Input
                placeholder="Manage IT support tickets and requests"
                value={newHubDescription}
                onChange={(e) => setNewHubDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateHub}
              disabled={creating || !newHubName.trim() || !newHubSlug.trim()}
            >
              {creating ? "Creating..." : "Create Hub"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Hub Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Request Hub</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedHub?.name}"? This will
              also delete all tabs and cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedHub(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteHub}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete Hub"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
