# Workspace Logo Storage Setup

This document explains how to set up Supabase Storage for workspace logos.

## Overview

The workspace settings modal now supports uploading logos to Supabase Storage. Logos are stored in a dedicated bucket and their public URLs are saved to the `workspaces` table.

## Storage Bucket Setup

### 1. Create the Storage Bucket

In your Supabase dashboard:

1. Go to **Storage** in the left sidebar
2. Click **Create a new bucket**
3. Bucket name: `workspace-assets`
4. Make it **Public** (check the "Public bucket" option)
5. Click **Create bucket**

### 2. Set Up Storage Policies

After creating the bucket, set up the following policies:

#### Policy 1: Allow Authenticated Users to Upload
```sql
CREATE POLICY "Authenticated users can upload workspace logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'workspace-assets' 
  AND (storage.foldername(name))[1] = 'workspace-logos'
);
```

#### Policy 2: Allow Authenticated Users to Update Their Logos
```sql
CREATE POLICY "Authenticated users can update workspace logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'workspace-assets' 
  AND (storage.foldername(name))[1] = 'workspace-logos'
);
```

#### Policy 3: Allow Authenticated Users to Delete Their Logos
```sql
CREATE POLICY "Authenticated users can delete workspace logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'workspace-assets' 
  AND (storage.foldername(name))[1] = 'workspace-logos'
);
```

#### Policy 4: Public Read Access
```sql
CREATE POLICY "Public read access for workspace assets"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'workspace-assets');
```

### Alternative: Set Up via Supabase Dashboard

You can also set up these policies via the Supabase dashboard:

1. Go to **Storage** → **Policies**
2. Click **New Policy** for the `workspace-assets` bucket
3. Use the policy editor to create the above policies

## Implementation Details

### File Upload Flow

1. **User selects image** → File validation (type, size)
2. **Generate unique filename** → `{workspace_id}_{timestamp}.{ext}`
3. **Upload to storage** → `workspace-assets/workspace-logos/{filename}`
4. **Get public URL** → Store in `workspaces.logo_url`
5. **Delete old logo** → If replacing existing logo

### File Constraints

- **Max file size:** 2MB
- **Allowed types:** All image types (image/*)
- **Storage path:** `workspace-logos/{workspace_id}_{timestamp}.{ext}`

### Code Location

- **Upload logic:** `src/components/WorkspaceSettingsModal.tsx` → `handleLogoUpload()`
- **Delete logic:** `src/components/WorkspaceSettingsModal.tsx` → `handleRemoveLogo()`
- **API update:** `src/lib/api/workspaces-supabase.ts` → `update()`

## Database Schema

The `workspaces` table must have a `logo_url` column:

```sql
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS logo_url TEXT;
```

## Testing

1. Open a workspace
2. Click your profile icon → **Settings**
3. Click **Upload Logo**
4. Select an image file (PNG, JPG, or GIF, max 2MB)
5. Verify the logo appears in the preview
6. Click **Save**
7. Verify the logo persists and appears in the workspace switcher

## Troubleshooting

### "Failed to upload logo" error

- Check that the `workspace-assets` bucket exists
- Verify the bucket is set to **Public**
- Check that storage policies are set up correctly
- Verify user is authenticated

### Logo not displaying after upload

- Check browser console for CORS errors
- Verify the public URL is correct in the database
- Check that the storage bucket has public read access

### "Failed to remove logo" error

- Verify the delete policy is set up correctly
- Check that the user has permission to delete the file

## Future Enhancements

- [ ] Image optimization/resizing before upload
- [ ] Support for more file formats (SVG)
- [ ] Crop/edit functionality
- [ ] CDN integration for faster loading
- [ ] Automatic cleanup of unused logos
