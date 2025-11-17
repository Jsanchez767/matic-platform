import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { WorkspaceTabProvider } from '@/components/WorkspaceTabProvider';
import { NavigationLayout } from '@/components/NavigationLayout';
import { ActivitiesHubPage } from './ActivitiesHubPage';

interface PageProps {
  params: {
    slug: string;
    hubSlug: string;
  };
}

async function getWorkspace(slug: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export default async function Page({ params }: PageProps) {
  const workspace = await getWorkspace(params.slug);

  if (!workspace) {
    notFound();
  }

  return (
    <WorkspaceTabProvider workspaceId={workspace.id}>
      <NavigationLayout workspaceSlug={params.slug}>
        <Suspense fallback={
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading activity...</div>
          </div>
        }>
          <ActivitiesHubPage 
            workspaceId={workspace.id}
            hubSlug={params.hubSlug}
          />
        </Suspense>
      </NavigationLayout>
    </WorkspaceTabProvider>
  );
}
