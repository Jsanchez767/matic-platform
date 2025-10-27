"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui-components/dialog'
import { Button } from '@/ui-components/button'
import { Input } from '@/ui-components/input'
import { Label } from '@/ui-components/label'
import { Upload, Palette, X } from 'lucide-react'
import { workspacesSupabase } from '@/lib/api/workspaces-supabase'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Workspace } from '@/types/workspaces'

interface WorkspaceSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  workspace: Workspace
  onUpdate: (workspace: Workspace) => void
}

const COLOR_PRESETS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Green', value: '#10B981' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Violet', value: '#7C3AED' },
  { name: 'Fuchsia', value: '#D946EF' },
]

export function WorkspaceSettingsModal({ isOpen, onClose, workspace, onUpdate }: WorkspaceSettingsModalProps) {
  const [name, setName] = useState(workspace.name)
  const [description, setDescription] = useState(workspace.description || '')
  const [color, setColor] = useState(workspace.color || '#3B82F6')
  const [icon, setIcon] = useState(workspace.icon || '')
  const [logoUrl, setLogoUrl] = useState(workspace.logo_url || '')
  const [isLogoUploading, setIsLogoUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Reset form when workspace changes
  useEffect(() => {
    setName(workspace.name)
    setDescription(workspace.description || '')
    setColor(workspace.color || '#3B82F6')
    setIcon(workspace.icon || '')
    setLogoUrl(workspace.logo_url || '')
  }, [workspace])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB')
      return
    }

    setIsLogoUploading(true)

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${workspace.id}_${Date.now()}.${fileExt}`
      const filePath = `workspace-logos/${fileName}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('workspace-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('workspace-assets')
        .getPublicUrl(filePath)

      // Delete old logo if exists
      if (logoUrl && logoUrl.includes('workspace-assets')) {
        const oldPath = logoUrl.split('/workspace-assets/').pop()
        if (oldPath) {
          await supabase.storage
            .from('workspace-assets')
            .remove([oldPath])
        }
      }

      setLogoUrl(publicUrl)
      toast.success('Logo uploaded successfully')
    } catch (error: any) {
      console.error('Logo upload error:', error)
      toast.error(error.message || 'Failed to upload logo')
    } finally {
      setIsLogoUploading(false)
    }
  }

  const handleRemoveLogo = async () => {
    if (!logoUrl) return

    try {
      // Delete from storage if it's a Supabase storage URL
      if (logoUrl.includes('workspace-assets')) {
        const filePath = logoUrl.split('/workspace-assets/').pop()
        if (filePath) {
          const { error } = await supabase.storage
            .from('workspace-assets')
            .remove([filePath])
          
          if (error) {
            console.error('Error deleting file:', error)
          }
        }
      }

      setLogoUrl('')
      toast.success('Logo removed')
    } catch (error) {
      console.error('Error removing logo:', error)
      toast.error('Failed to remove logo')
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Workspace name is required')
      return
    }

    setIsSaving(true)

    try {
      const updates = {
        name: name.trim(),
        description: description.trim() || undefined,
        color,
        icon: icon || undefined,
        logo_url: logoUrl || undefined,
      }

      const updatedWorkspace = await workspacesSupabase.update(workspace.id, updates)
      
      onUpdate(updatedWorkspace)
      toast.success('Workspace settings saved!')
      onClose()
    } catch (error) {
      console.error('Failed to update workspace:', error)
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Workspace Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>Workspace Logo</Label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                {logoUrl ? (
                  <img src={logoUrl} alt="Workspace logo" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={isLogoUploading}
                  className="hidden"
                  id="logo-upload"
                />
                <label htmlFor="logo-upload">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isLogoUploading}
                    onClick={(e) => {
                      e.preventDefault()
                      document.getElementById('logo-upload')?.click()
                    }}
                  >
                    {isLogoUploading ? 'Uploading...' : 'Upload Logo'}
                  </Button>
                </label>
                {logoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="ml-2"
                    onClick={handleRemoveLogo}
                  >
                    Remove
                  </Button>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG or GIF (max. 2MB)
                </p>
              </div>
            </div>
          </div>

          {/* Workspace Name */}
          <div className="space-y-2">
            <Label htmlFor="workspace-name">Workspace Name *</Label>
            <Input
              id="workspace-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Workspace"
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="workspace-description">Description</Label>
            <textarea
              id="workspace-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this workspace for?"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-500">
              {description.length}/500 characters
            </p>
          </div>

          {/* Icon/Emoji */}
          <div className="space-y-2">
            <Label htmlFor="workspace-icon">Workspace Icon (Emoji)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="workspace-icon"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="🚀"
                maxLength={2}
                className="w-20 text-center text-2xl"
              />
              <span className="text-sm text-gray-500">
                Use an emoji to represent your workspace
              </span>
            </div>
          </div>

          {/* Color Picker */}
          <div className="space-y-3">
            <Label>Workspace Color</Label>
            <div className="flex items-center gap-3 flex-wrap">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setColor(preset.value)}
                  className={`w-10 h-10 rounded-lg border-2 transition-all ${
                    color === preset.value
                      ? 'border-gray-900 scale-110'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: preset.value }}
                  title={preset.name}
                />
              ))}
              {/* Custom color input */}
              <div className="relative">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border-2 border-gray-200 cursor-pointer"
                  title="Custom color"
                />
                <Palette className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-white pointer-events-none mix-blend-difference" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div
                className="w-6 h-6 rounded border border-gray-200"
                style={{ backgroundColor: color }}
              />
              <span className="font-mono">{color.toUpperCase()}</span>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2 pt-4 border-t border-gray-200">
            <Label>Preview</Label>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl font-semibold"
                  style={{ backgroundColor: color }}
                >
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-cover rounded-lg" />
                  ) : icon ? (
                    icon
                  ) : (
                    name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{name || 'Workspace Name'}</div>
                  {description && (
                    <div className="text-sm text-gray-600 line-clamp-1">{description}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
