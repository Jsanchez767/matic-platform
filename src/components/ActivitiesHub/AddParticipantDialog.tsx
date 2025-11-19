'use client'

import { useState } from 'react'
import { X, UserPlus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/ui-components/dialog'
import { Button } from '@/ui-components/button'
import { Input } from '@/ui-components/input'
import { Label } from '@/ui-components/label'
import { CreateParticipantInput } from '@/types/participants'
import { Activity } from '@/types/activities-hubs'

interface AddParticipantDialogProps {
  open: boolean
  onClose: () => void
  onSave: (participant: CreateParticipantInput, programIds: string[]) => void
  activities: Activity[]
}

export function AddParticipantDialog({
  open,
  onClose,
  onSave,
  activities
}: AddParticipantDialogProps) {
  const [formData, setFormData] = useState<CreateParticipantInput>({
    first_name: '',
    last_name: '',
    student_id: '',
    school_code: '',
    grade_level: '',
    contact_first_name: '',
    contact_last_name: '',
    contact_phone: '',
    contact_email: '',
  })
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData, selectedPrograms)
    handleClose()
  }

  const handleClose = () => {
    setFormData({
      first_name: '',
      last_name: '',
      student_id: '',
      school_code: '',
      grade_level: '',
      contact_first_name: '',
      contact_last_name: '',
      contact_phone: '',
      contact_email: '',
    })
    setSelectedPrograms([])
    onClose()
  }

  const toggleProgram = (programId: string) => {
    setSelectedPrograms(prev =>
      prev.includes(programId)
        ? prev.filter(id => id !== programId)
        : [...prev, programId]
    )
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Add New Participant
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Student Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Student Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  required
                  value={formData.first_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  required
                  value={formData.last_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                  placeholder="Enter last name"
                />
              </div>
              <div>
                <Label htmlFor="student_id">Student ID *</Label>
                <Input
                  id="student_id"
                  required
                  value={formData.student_id}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setFormData({ ...formData, student_id: e.target.value })
                  }
                  placeholder="e.g., 50262867"
                />
              </div>
              <div>
                <Label htmlFor="school_code">School Code</Label>
                <Input
                  id="school_code"
                  value={formData.school_code}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setFormData({ ...formData, school_code: e.target.value })
                  }
                  placeholder="e.g., 609715"
                />
              </div>
              <div>
                <Label htmlFor="grade_level">Grade Level</Label>
                <select
                  id="grade_level"
                  value={formData.grade_level}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                    setFormData({ ...formData, grade_level: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select grade</option>
                  <option value="K">Kindergarten</option>
                  <option value="1">1st Grade</option>
                  <option value="2">2nd Grade</option>
                  <option value="3">3rd Grade</option>
                  <option value="4">4th Grade</option>
                  <option value="5">5th Grade</option>
                  <option value="6">6th Grade</option>
                  <option value="7">7th Grade</option>
                  <option value="8">8th Grade</option>
                  <option value="9">9th Grade</option>
                  <option value="10">10th Grade</option>
                  <option value="11">11th Grade</option>
                  <option value="12">12th Grade</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Person */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Contact Person</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact_first_name">First Name</Label>
                <Input
                  id="contact_first_name"
                  value={formData.contact_first_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setFormData({ ...formData, contact_first_name: e.target.value })
                  }
                  placeholder="Contact first name"
                />
              </div>
              <div>
                <Label htmlFor="contact_last_name">Last Name</Label>
                <Input
                  id="contact_last_name"
                  value={formData.contact_last_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setFormData({ ...formData, contact_last_name: e.target.value })
                  }
                  placeholder="Contact last name"
                />
              </div>
              <div>
                <Label htmlFor="contact_phone">Phone</Label>
                <Input
                  id="contact_phone"
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setFormData({ ...formData, contact_phone: e.target.value })
                  }
                  placeholder="708-510-4811"
                />
              </div>
              <div>
                <Label htmlFor="contact_email">Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setFormData({ ...formData, contact_email: e.target.value })
                  }
                  placeholder="contact@example.com"
                />
              </div>
            </div>
          </div>

          {/* Program Selection */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Enroll in Programs</h3>
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-48 overflow-y-auto">
              {activities.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  No programs available
                </div>
              ) : (
                activities.map(activity => (
                  <label
                    key={activity.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPrograms.includes(activity.id)}
                      onChange={() => toggleProgram(activity.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">{activity.name}</div>
                      {activity.category && (
                        <div className="text-xs text-gray-500">{activity.category}</div>
                      )}
                    </div>
                  </label>
                ))
              )}
            </div>
            {selectedPrograms.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                {selectedPrograms.length} program{selectedPrograms.length !== 1 ? 's' : ''} selected
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">
              Add Participant
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
