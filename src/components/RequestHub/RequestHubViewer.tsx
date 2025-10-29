"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, Settings, Plus, GripVertical } from "lucide-react";
import { Button } from "@/ui-components/button";
import { Badge } from "@/ui-components/badge";
import { requestHubsSupabase } from "@/lib/api/request-hubs-supabase";
import type { RequestHub, RequestHubTab } from "@/types/request-hub";

interface RequestHubViewerProps {
  hubId?: string;
  hubSlug?: string;
  workspaceId: string;
  onBack?: () => void;
}

export function RequestHubViewer({
  hubId,
  hubSlug,
  workspaceId,
  onBack,
}: RequestHubViewerProps) {
  const [hub, setHub] = useState<RequestHub | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  useEffect(() => {
    loadHub();
  }, [hubId, hubSlug, workspaceId]);

  const loadHub = async () => {
    try {
      setLoading(true);
      let data: RequestHub;

      if (hubId) {
        data = await requestHubsSupabase.get(hubId);
      } else if (hubSlug) {
        data = await requestHubsSupabase.getBySlug(workspaceId, hubSlug);
      } else {
        throw new Error("Either hubId or hubSlug is required");
      }

      setHub(data);
      // Set first tab as active
      if (data.tabs && data.tabs.length > 0) {
        setActiveTabId(data.tabs[0].id);
      }
    } catch (error) {
      console.error("Failed to load request hub:", error);
    } finally {
      setLoading(false);
    }
  };

  const activeTab = hub?.tabs?.find((tab) => tab.id === activeTabId);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading hub...</p>
        </div>
      </div>
    );
  }

  if (!hub) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Hub Not Found
          </h3>
          <p className="text-gray-600 mb-4">
            The requested hub could not be found.
          </p>
          {onBack && (
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Hubs
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (
                <Button variant="ghost" size="sm" onClick={onBack}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {hub.name}
                  </h1>
                  <Badge variant={hub.is_active ? "default" : "secondary"}>
                    {hub.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {hub.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {hub.description}
                  </p>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6">
          <div className="flex items-center gap-1 overflow-x-auto">
            {hub.tabs
              ?.sort((a, b) => a.position - b.position)
              .filter((tab) => tab.is_visible)
              .map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`
                    px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                    ${
                      activeTabId === tab.id
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                    }
                  `}
                >
                  {tab.name}
                </button>
              ))}
            <Button variant="ghost" size="sm" className="ml-2">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {activeTab ? (
          <TabContent tab={activeTab} hub={hub} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <p>No tab selected</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Tab Content Renderer
function TabContent({ tab, hub }: { tab: RequestHubTab; hub: RequestHub }) {
  switch (tab.type) {
    case "dashboard":
      return <DashboardTabContent tab={tab} hub={hub} />;
    case "my-requests":
      return <MyRequestsTabContent tab={tab} hub={hub} />;
    case "new-request":
      return <NewRequestTabContent tab={tab} hub={hub} />;
    case "approvals":
      return <ApprovalsTabContent tab={tab} hub={hub} />;
    case "all-requests":
      return <AllRequestsTabContent tab={tab} hub={hub} />;
    case "analytics":
      return <AnalyticsTabContent tab={tab} hub={hub} />;
    case "custom":
      return <CustomTabContent tab={tab} hub={hub} />;
    default:
      return (
        <div className="p-6">
          <div className="text-center text-gray-500">
            <p>Unknown tab type: {tab.type}</p>
          </div>
        </div>
      );
  }
}

// Tab Content Components (Placeholders for now)
function DashboardTabContent({
  tab,
  hub,
}: {
  tab: RequestHubTab;
  hub: RequestHub;
}) {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Metric Cards */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-600 mb-2">
            Total Requests
          </div>
          <div className="text-3xl font-bold text-gray-900">0</div>
          <div className="text-sm text-gray-500 mt-1">No requests yet</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-600 mb-2">Pending</div>
          <div className="text-3xl font-bold text-gray-900">0</div>
          <div className="text-sm text-gray-500 mt-1">Awaiting review</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-600 mb-2">
            Approved
          </div>
          <div className="text-3xl font-bold text-gray-900">0</div>
          <div className="text-sm text-green-600 mt-1">All time</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Requests
          </h3>
        </div>
        <div className="p-6">
          <div className="text-center text-gray-500 py-8">
            <p>No recent requests</p>
            <p className="text-sm mt-2">
              Requests will appear here once they're submitted
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MyRequestsTabContent({
  tab,
  hub,
}: {
  tab: RequestHubTab;
  hub: RequestHub;
}) {
  return (
    <div className="p-6">
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          My Requests
        </h3>
        <p className="text-gray-600 mb-4">
          View and track your submitted requests
        </p>
        <p className="text-sm text-gray-500">Coming soon</p>
      </div>
    </div>
  );
}

function NewRequestTabContent({
  tab,
  hub,
}: {
  tab: RequestHubTab;
  hub: RequestHub;
}) {
  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Submit New Request
          </h3>
          <p className="text-gray-600 mb-4">
            Fill out a form to submit a new request
          </p>
          <p className="text-sm text-gray-500">Coming soon</p>
        </div>
      </div>
    </div>
  );
}

function ApprovalsTabContent({
  tab,
  hub,
}: {
  tab: RequestHubTab;
  hub: RequestHub;
}) {
  return (
    <div className="p-6">
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Approval Queue
        </h3>
        <p className="text-gray-600 mb-4">
          Review and approve pending requests
        </p>
        <p className="text-sm text-gray-500">Coming soon</p>
      </div>
    </div>
  );
}

function AllRequestsTabContent({
  tab,
  hub,
}: {
  tab: RequestHubTab;
  hub: RequestHub;
}) {
  return (
    <div className="p-6">
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          All Requests
        </h3>
        <p className="text-gray-600 mb-4">
          View all requests across the organization
        </p>
        <p className="text-sm text-gray-500">Coming soon</p>
      </div>
    </div>
  );
}

function AnalyticsTabContent({
  tab,
  hub,
}: {
  tab: RequestHubTab;
  hub: RequestHub;
}) {
  return (
    <div className="p-6">
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics</h3>
        <p className="text-gray-600 mb-4">
          View charts and insights for your requests
        </p>
        <p className="text-sm text-gray-500">Coming soon</p>
      </div>
    </div>
  );
}

function CustomTabContent({
  tab,
  hub,
}: {
  tab: RequestHubTab;
  hub: RequestHub;
}) {
  return (
    <div className="p-6">
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {tab.name}
        </h3>
        <p className="text-gray-600 mb-4">Custom tab content</p>
        <p className="text-sm text-gray-500">Coming soon</p>
      </div>
    </div>
  );
}
