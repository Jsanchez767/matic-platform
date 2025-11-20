'use client'

import { useState } from 'react'
import { X, Save, UserCircle, Home, GraduationCap, Users, Phone, Mail, Calendar, Trash2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Participant, UpdateParticipantInput } from '@/types/participants'
import { Activity } from '@/types/activities-hubs'
import { Button } from '@/ui-components/button'
import { Input } from '@/ui-components/input'
import { Label } from '@/ui-components/label'

interface ParticipantDetailPanelProps {
  participant: Participant | null
  activities: Activity[]
  onClose: () => void
  onSave: (id: string, updates: UpdateParticipantInput) => void
  onDelete: (id: string) => void
  onUnenroll: (participantId: string, enrollmentId: string) => void
  onEnroll: (participantId: string, activityId: string) => void
}

export function ParticipantDetailPanel({
  participant,
  activities,
  onClose,
  onSave,
  onDelete,
  onUnenroll,
  onEnroll
}: ParticipantDetailPanelProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<UpdateParticipantInput>({})
  const [activeSection, setActiveSection] = useState<string>('student')
  const [showEnrollDialog, setShowEnrollDialog] = useState(false)
  const [selectedActivityId, setSelectedActivityId] = useState<string>('')

  if (!participant) return null

  const handleEdit = () => {
    setFormData({
      first_name: participant.first_name,
      last_name: participant.last_name,
      student_id: participant.student_id,
      school_code: participant.school_code,
      student_phone: participant.student_phone,
      street_number: participant.street_number,
      address_direction: participant.address_direction,
      street_name: participant.street_name,
      street_type: participant.street_type,
      postal_code: participant.postal_code,
      birth_date: participant.birth_date,
      age: participant.age,
      gender: participant.gender,
      ethnicity: participant.ethnicity,
      feeder_school_student: participant.feeder_school_student,
      feeder_school: participant.feeder_school,
      feeder_school_other: participant.feeder_school_other,
      grade_level: participant.grade_level,
      special_ed: participant.special_ed,
      ell_student: participant.ell_student,
      primary_disability: participant.primary_disability,
      primary_language: participant.primary_language,
      iep: participant.iep,
      free_reduced_meal: participant.free_reduced_meal,
      number_of_family_members: participant.number_of_family_members,
      contact_first_name: participant.contact_first_name,
      contact_last_name: participant.contact_last_name,
      contact_relation: participant.contact_relation,
      contact_phone: participant.contact_phone,
      contact_email: participant.contact_email,
      consent_on_file: participant.consent_on_file,
    })
    setIsEditing(true)
  }

  const handleSave = () => {
    onSave(participant.id, formData)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setFormData({})
    setIsEditing(false)
  }

  const getValue = (key: keyof Participant) => {
    if (isEditing && key in formData) {
      return formData[key as keyof UpdateParticipantInput]
    }
    return participant[key]
  }

  const updateField = (key: keyof UpdateParticipantInput, value: any) => {
    setFormData({ ...formData, [key]: value })
  }

  const activeEnrollments = participant.enrolled_programs.filter(e => e.status === 'active')
  const enrolledActivityIds = new Set(participant.enrolled_programs.map(e => e.activity_id))
  const availableActivities = activities.filter(a => !enrolledActivityIds.has(a.id))

  const handleEnrollClick = () => {
    if (availableActivities.length > 0) {
      setSelectedActivityId(availableActivities[0].id)
      setShowEnrollDialog(true)
    }
  }

  const handleConfirmEnroll = () => {
    if (selectedActivityId) {
      onEnroll(participant.id, selectedActivityId)
      setShowEnrollDialog(false)
      setSelectedActivityId('')
    }
  }

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[600px] bg-white shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-lg font-bold">
              {participant.first_name[0]}{participant.last_name[0]}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold">
              {participant.first_name} {participant.last_name}
            </h2>
            <p className="text-blue-100 text-sm">ID: {participant.student_id}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Action Bar */}
      <div className="border-b border-gray-200 px-6 py-3 flex items-center justify-between bg-gray-50">
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button size="sm" onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={handleEdit}>
              Edit
            </Button>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onDelete(participant.id)}
          className="text-red-600 hover:text-red-700 hover:border-red-300"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 px-6">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveSection('student')}
            className={cn(
              "py-3 border-b-2 font-medium text-sm transition-colors",
              activeSection === 'student'
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            <UserCircle className="w-4 h-4 inline mr-2" />
            Student Info
          </button>
          <button
            onClick={() => setActiveSection('contact')}
            className={cn(
              "py-3 border-b-2 font-medium text-sm transition-colors",
              activeSection === 'contact'
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            <Phone className="w-4 h-4 inline mr-2" />
            Contact
          </button>
          <button
            onClick={() => setActiveSection('programs')}
            className={cn(
              "py-3 border-b-2 font-medium text-sm transition-colors",
              activeSection === 'programs'
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            <GraduationCap className="w-4 h-4 inline mr-2" />
            Programs
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {activeSection === 'student' && (
          <div className="space-y-6">
            {/* Basic Information */}
            <section>
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <UserCircle className="w-4 h-4" />
                Student Data
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InfoField
                    label="Consent on File"
                    value={getValue('consent_on_file') ? 'Yes' : 'No'}
                    isEditing={isEditing}
                    type="checkbox"
                    checked={getValue('consent_on_file') as boolean}
                    onChange={(checked) => updateField('consent_on_file', checked)}
                  />
                  <InfoField
                    label="Student ID"
                    value={getValue('student_id')}
                    isEditing={isEditing}
                    onChange={(val) => updateField('student_id', val)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InfoField
                    label="School Code"
                    value={getValue('school_code')}
                    isEditing={isEditing}
                    onChange={(val) => updateField('school_code', val)}
                  />
                  <InfoField
                    label="First Name"
                    value={getValue('first_name')}
                    isEditing={isEditing}
                    onChange={(val) => updateField('first_name', val)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InfoField
                    label="Last Name"
                    value={getValue('last_name')}
                    isEditing={isEditing}
                    onChange={(val) => updateField('last_name', val)}
                  />
                  <InfoField
                    label="Student Phone"
                    value={getValue('student_phone')}
                    isEditing={isEditing}
                    onChange={(val) => updateField('student_phone', val)}
                  />
                </div>
              </div>
            </section>

            {/* Address */}
            <section>
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Home className="w-4 h-4" />
                Address
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <InfoField
                    label="Street Number"
                    value={getValue('street_number')}
                    isEditing={isEditing}
                    onChange={(val) => updateField('street_number', val)}
                  />
                  <InfoField
                    label="Direction"
                    value={getValue('address_direction')}
                    isEditing={isEditing}
                    onChange={(val) => updateField('address_direction', val)}
                    type="select"
                    options={[
                      { value: '', label: '-' },
                      { value: 'N', label: 'N' },
                      { value: 'S', label: 'S' },
                      { value: 'E', label: 'E' },
                      { value: 'W', label: 'W' },
                    ]}
                  />
                  <InfoField
                    label="Postal Code"
                    value={getValue('postal_code')}
                    isEditing={isEditing}
                    onChange={(val) => updateField('postal_code', val)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InfoField
                    label="Street Name"
                    value={getValue('street_name')}
                    isEditing={isEditing}
                    onChange={(val) => updateField('street_name', val)}
                  />
                  <InfoField
                    label="Street Type"
                    value={getValue('street_type')}
                    isEditing={isEditing}
                    onChange={(val) => updateField('street_type', val)}
                  />
                </div>
              </div>
            </section>

            {/* Demographics */}
            <section>
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Demographics
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InfoField
                    label="Birth Date"
                    value={getValue('birth_date')}
                    isEditing={isEditing}
                    onChange={(val) => updateField('birth_date', val)}
                    type="date"
                  />
                  <InfoField
                    label="Age"
                    value={getValue('age')}
                    isEditing={isEditing}
                    onChange={(val) => updateField('age', val ? parseInt(val) : undefined)}
                    type="number"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InfoField
                    label="Gender"
                    value={getValue('gender')}
                    isEditing={isEditing}
                    onChange={(val) => updateField('gender', val)}
                    type="select"
                    options={[
                      { value: '', label: 'Select' },
                      { value: 'Female', label: 'Female' },
                      { value: 'Male', label: 'Male' },
                      { value: 'Other', label: 'Other' },
                      { value: 'Prefer not to say', label: 'Prefer not to say' },
                    ]}
                  />
                  <InfoField
                    label="Ethnicity"
                    value={getValue('ethnicity')}
                    isEditing={isEditing}
                    onChange={(val) => updateField('ethnicity', val)}
                  />
                </div>
              </div>
            </section>

            {/* Education */}
            <section>
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                Education
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InfoField
                    label="Feeder School Student?"
                    value={getValue('feeder_school_student') ? 'Yes' : 'No'}
                    isEditing={isEditing}
                    type="radio"
                    checked={getValue('feeder_school_student') as boolean}
                    onChange={(checked) => updateField('feeder_school_student', checked)}
                  />
                  <InfoField
                    label="Grade Level"
                    value={getValue('grade_level')}
                    isEditing={isEditing}
                    onChange={(val) => updateField('grade_level', val)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InfoField
                    label="Feeder School"
                    value={getValue('feeder_school')}
                    isEditing={isEditing}
                    onChange={(val) => updateField('feeder_school', val)}
                  />
                  <InfoField
                    label="Feeder School Other"
                    value={getValue('feeder_school_other')}
                    isEditing={isEditing}
                    onChange={(val) => updateField('feeder_school_other', val)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InfoField
                    label="Special Ed"
                    value={getValue('special_ed') ? 'Yes' : 'No'}
                    isEditing={isEditing}
                    type="checkbox"
                    checked={getValue('special_ed') as boolean}
                    onChange={(checked) => updateField('special_ed', checked)}
                  />
                  <InfoField
                    label="ELL Student"
                    value={getValue('ell_student') ? 'Y' : 'N'}
                    isEditing={isEditing}
                    type="checkbox"
                    checked={getValue('ell_student') as boolean}
                    onChange={(checked) => updateField('ell_student', checked)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InfoField
                    label="Primary Disability"
                    value={getValue('primary_disability')}
                    isEditing={isEditing}
                    onChange={(val) => updateField('primary_disability', val)}
                  />
                  <InfoField
                    label="Primary Language"
                    value={getValue('primary_language')}
                    isEditing={isEditing}
                    onChange={(val) => updateField('primary_language', val)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InfoField
                    label="IEP"
                    value={getValue('iep') ? 'Yes' : 'No'}
                    isEditing={isEditing}
                    type="checkbox"
                    checked={getValue('iep') as boolean}
                    onChange={(checked) => updateField('iep', checked)}
                  />
                  <InfoField
                    label="Free/Reduced Meal"
                    value={getValue('free_reduced_meal')}
                    isEditing={isEditing}
                    onChange={(val) => updateField('free_reduced_meal', val as any)}
                    type="select"
                    options={[
                      { value: '', label: 'Select' },
                      { value: 'Free', label: 'Free' },
                      { value: 'Reduced', label: 'Reduced' },
                      { value: 'Paid', label: 'Paid' },
                    ]}
                  />
                </div>
                <InfoField
                  label="Number of Family Members"
                  value={getValue('number_of_family_members')}
                  isEditing={isEditing}
                  onChange={(val) => updateField('number_of_family_members', val ? parseInt(val) : undefined)}
                  type="number"
                />
              </div>
            </section>
          </div>
        )}

        {activeSection === 'contact' && (
          <div className="space-y-6">
            <section>
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Contact Person
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InfoField
                    label="First Name"
                    value={getValue('contact_first_name')}
                    isEditing={isEditing}
                    onChange={(val) => updateField('contact_first_name', val)}
                  />
                  <InfoField
                    label="Last Name"
                    value={getValue('contact_last_name')}
                    isEditing={isEditing}
                    onChange={(val) => updateField('contact_last_name', val)}
                  />
                </div>
                <InfoField
                  label="Relation"
                  value={getValue('contact_relation')}
                  isEditing={isEditing}
                  onChange={(val) => updateField('contact_relation', val)}
                  type="select"
                  options={[
                    { value: '', label: 'Select' },
                    { value: 'Mother', label: 'Mother' },
                    { value: 'Father', label: 'Father' },
                    { value: 'Guardian', label: 'Guardian' },
                    { value: 'Other', label: 'Other' },
                  ]}
                />
                <InfoField
                  label="Phone"
                  value={getValue('contact_phone')}
                  isEditing={isEditing}
                  onChange={(val) => updateField('contact_phone', val)}
                />
                <InfoField
                  label="Email"
                  value={getValue('contact_email')}
                  isEditing={isEditing}
                  onChange={(val) => updateField('contact_email', val)}
                />
              </div>
            </section>
          </div>
        )}

        {activeSection === 'programs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Enrolled Programs</h3>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">
                  {activeEnrollments.length} active
                </span>
                {availableActivities.length > 0 && (
                  <Button size="sm" onClick={handleEnrollClick}>
                    <Plus className="w-4 h-4 mr-1" />
                    Enroll
                  </Button>
                )}
              </div>
            </div>

            {activeEnrollments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>Not enrolled in any programs</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeEnrollments.map(enrollment => {
                  const activity = activities.find(a => a.id === enrollment.activity_id)
                  return (
                    <div
                      key={enrollment.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {enrollment.activity_name}
                          </h4>
                          {activity && (
                            <p className="text-sm text-gray-500 mt-1">
                              {activity.category}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Enrolled: {new Date(enrollment.enrolled_date).toLocaleDateString()}
                            </div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700">
                              {enrollment.status}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onUnenroll(participant.id, enrollment.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Unenroll
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Enrollment Dialog */}
      {showEnrollDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Enroll in Program</h3>
            <div className="mb-4">
              <Label className="text-sm mb-2 block">Select Program</Label>
              <select
                value={selectedActivityId}
                onChange={(e) => setSelectedActivityId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableActivities.map(activity => (
                  <option key={activity.id} value={activity.id}>
                    {activity.name} ({activity.category})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEnrollDialog(false)
                  setSelectedActivityId('')
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleConfirmEnroll}>
                Enroll
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Info Field Component
interface InfoFieldProps {
  label: string
  value: any
  isEditing: boolean
  onChange?: (value: any) => void
  type?: 'text' | 'number' | 'date' | 'checkbox' | 'radio' | 'select'
  checked?: boolean
  options?: Array<{ value: string; label: string }>
}

function InfoField({ label, value, isEditing, onChange, type = 'text', checked, options }: InfoFieldProps) {
  if (type === 'checkbox') {
    return (
      <div>
        <Label className="text-xs text-gray-600">{label}</Label>
        {isEditing ? (
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange?.(e.target.checked)}
            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        ) : (
          <div className="text-sm text-gray-900 mt-1">{value}</div>
        )}
      </div>
    )
  }

  if (type === 'radio') {
    return (
      <div>
        <Label className="text-xs text-gray-600">{label}</Label>
        {isEditing ? (
          <div className="flex gap-4 mt-1">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={checked === true}
                onChange={() => onChange?.(true)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm">Yes</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={checked === false}
                onChange={() => onChange?.(false)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm">No</span>
            </label>
          </div>
        ) : (
          <div className="text-sm text-gray-900 mt-1">{value}</div>
        )}
      </div>
    )
  }

  if (type === 'select') {
    return (
      <div>
        <Label className="text-xs text-gray-600">{label}</Label>
        {isEditing ? (
          <select
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            className="mt-1 w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : (
          <div className="text-sm text-gray-900 mt-1">{value || '-'}</div>
        )}
      </div>
    )
  }

  return (
    <div>
      <Label className="text-xs text-gray-600">{label}</Label>
      {isEditing ? (
        <Input
          type={type}
          value={value || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value)}
          className="mt-1"
        />
      ) : (
        <div className="text-sm text-gray-900 mt-1">{value || '-'}</div>
      )}
    </div>
  )
}
