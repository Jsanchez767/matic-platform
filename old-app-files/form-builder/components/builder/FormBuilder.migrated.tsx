"use client"

// Form Builder - Main collaborative form builder component
// MIGRATED: Now uses FastAPI REST endpoints instead of direct Supabase queries
// YJS collaboration features temporarily disabled (to be re-implemented)

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import { 
  Save, 
  Eye, 
  Share2, 
  Settings, 
  Users, 
  Undo, 
  Redo,
  Play,
  Loader2 
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

// NEW: Import forms API client
import { formsAPI, type Form, type FormField } from '@/lib/api/forms-client'

// Components (will be created)
import { FormCanvas } from './FormCanvas'
import { FieldPalette } from './FieldPalette'
import { FormPreview } from './FormPreview'
import { FormSettings } from './FormSettings'
import { CollaboratorList } from './CollaboratorList'

interface FormBuilderProps {
  formId: string
  onFormChange?: () => void
}

export default function FormBuilder({ formId, onFormChange }: FormBuilderProps) {
  const router = useRouter()
  const supabase = createClient() // Keep for auth only

  // Component state
  const [form, setForm] = useState<Form | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [collaborators, setCollaborators] = useState([])

  // Form fields state (replaces formStructure)
  const [fields, setFields] = useState<FormField[]>([])
  
  // YJS collaboration - DISABLED for now
  // TODO: Re-implement with WebSocket-based collaboration
  const [isConnected, setIsConnected] = useState(false)
  const [isSynced, setIsSynced] = useState(false)

  // Debug: Log fields changes
  useEffect(() => {
    console.log('FormBuilder: fields state changed:', fields)
  }, [fields])

  // Load form data
  useEffect(() => {
    if (!formId) return
    loadFormData()
  }, [formId])

  /**
   * Load form data from FastAPI backend
   * MIGRATED: Uses formsAPI.get() instead of supabase.from('forms')
   */
  const loadFormData = async () => {
    try {
      setIsLoading(true)
      console.log('Loading form data for formId:', formId)

      // NEW: Use FastAPI endpoint
      const formData = await formsAPI.get(formId)
      
      console.log('🔍 [FormBuilder] Loaded form data:', formData)
      console.log('🔍 [FormBuilder] Form fields:', formData.fields)
      
      setForm(formData)
      setFields(formData.fields || [])
      
      console.log('✅ [FormBuilder] Form loaded with', formData.fields?.length || 0, 'fields')
      
    } catch (error) {
      console.error('❌ [FormBuilder] Error loading form data:', error)
      // TODO: Show error toast to user
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Save form changes to backend
   * MIGRATED: Uses formsAPI.update() instead of multiple Supabase queries
   */
  const handleSave = async () => {
    if (!form || isSaving) return

    try {
      setIsSaving(true)
      console.log('💾 [FormBuilder] Saving form...')

      // NEW: Single API call to update form and fields
      const updatedForm = await formsAPI.update(form.id, {
        name: form.name,
        description: form.description,
        settings: form.settings,
        fields: fields,
      })

      console.log('✅ [FormBuilder] Form saved successfully')
      setForm(updatedForm)
      setFields(updatedForm.fields || [])
      
      // Notify parent component
      onFormChange?.()
      
      // TODO: Show success toast
      
    } catch (error) {
      console.error('❌ [FormBuilder] Error saving form:', error)
      // TODO: Show error toast
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Publish form (make it live)
   * MIGRATED: Uses formsAPI.publish()
   */
  const handlePublish = async () => {
    if (!form) return

    try {
      setIsSaving(true)
      console.log('📢 [FormBuilder] Publishing form...')

      // Save current changes first
      await handleSave()
      
      // Then publish
      const publishedForm = await formsAPI.publish(form.id)
      
      console.log('✅ [FormBuilder] Form published successfully')
      setForm(publishedForm)
      
      // TODO: Show success toast
      
    } catch (error) {
      console.error('❌ [FormBuilder] Error publishing form:', error)
      // TODO: Show error toast
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Add a new field to the form
   */
  const handleAddField = useCallback((fieldType: string) => {
    const newField: FormField = {
      id: uuidv4(),
      name: `field_${Date.now()}`,
      label: `New ${fieldType} Field`,
      field_type: fieldType,
      position: fields.length,
      is_visible: true,
      settings: {},
      validation: {},
      options: {},
    }

    setFields(prev => [...prev, newField])
    console.log('➕ [FormBuilder] Added new field:', newField)
  }, [fields])

  /**
   * Update an existing field
   */
  const handleUpdateField = useCallback((fieldId: string, updates: Partial<FormField>) => {
    setFields(prev => 
      prev.map(field => 
        field.id === fieldId 
          ? { ...field, ...updates }
          : field
      )
    )
    console.log('✏️ [FormBuilder] Updated field:', fieldId, updates)
  }, [])

  /**
   * Remove a field from the form
   */
  const handleRemoveField = useCallback((fieldId: string) => {
    setFields(prev => prev.filter(field => field.id !== fieldId))
    console.log('🗑️ [FormBuilder] Removed field:', fieldId)
  }, [])

  /**
   * Reorder fields (for drag & drop)
   */
  const handleReorderFields = useCallback((newOrder: FormField[]) => {
    const reorderedFields = newOrder.map((field, index) => ({
      ...field,
      position: index,
    }))
    setFields(reorderedFields)
    console.log('🔄 [FormBuilder] Reordered fields')
  }, [])

  /**
   * Update form metadata (title, description, settings)
   */
  const handleUpdateFormMetadata = useCallback((updates: Partial<Form>) => {
    if (!form) return
    setForm({ ...form, ...updates })
  }, [form])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-600">Loading form builder...</p>
        </div>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900 mb-2">Form not found</p>
          <p className="text-sm text-gray-600 mb-4">The form you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/forms')}>
            Back to Forms
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header / Toolbar */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900">
            {form.name || 'Untitled Form'}
          </h1>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            form.status === 'published' 
              ? 'bg-green-100 text-green-800' 
              : form.status === 'draft'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {form.status}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Collaboration indicator */}
          {isConnected && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-green-50 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-700">Connected</span>
            </div>
          )}

          {/* Action buttons */}
          <Button variant="ghost" size="sm" disabled>
            <Undo className="w-4 h-4 mr-1" />
            Undo
          </Button>
          <Button variant="ghost" size="sm" disabled>
            <Redo className="w-4 h-4 mr-1" />
            Redo
          </Button>
          
          <div className="w-px h-6 bg-gray-300 mx-2"></div>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsPreviewOpen(true)}
          >
            <Eye className="w-4 h-4 mr-1" />
            Preview
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings className="w-4 h-4 mr-1" />
            Settings
          </Button>
          <Button variant="ghost" size="sm" disabled>
            <Share2 className="w-4 h-4 mr-1" />
            Share
          </Button>
          <Button variant="ghost" size="sm" disabled>
            <Users className="w-4 h-4 mr-1" />
            Collaborators
          </Button>
          
          <div className="w-px h-6 bg-gray-300 mx-2"></div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-1" />
                Save
              </>
            )}
          </Button>
          <Button 
            size="sm"
            onClick={handlePublish}
            disabled={isSaving || form.status === 'published'}
          >
            <Play className="w-4 h-4 mr-1" />
            Publish
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Field Palette */}
        <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <FieldPalette onAddField={handleAddField} />
        </aside>

        {/* Center - Form Canvas */}
        <main className="flex-1 overflow-y-auto p-6">
          <FormCanvas
            fields={fields}
            onUpdateField={handleUpdateField}
            onRemoveField={handleRemoveField}
            onReorderFields={handleReorderFields}
          />
        </main>

        {/* Right Sidebar - Field Properties (if field selected) */}
        {/* TODO: Add field properties panel */}
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && (
        <FormPreview
          form={form}
          fields={fields}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <FormSettings
          form={form}
          onUpdate={handleUpdateFormMetadata}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  )
}
