'use client'

import { useState, useMemo } from 'react'
import { Search, Plus, Users, GraduationCap, Calendar, Mail, Phone, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Participant, ProgramEnrollment } from '@/types/participants'
import { Activity } from '@/types/activities-hubs'
import { Button } from '@/ui-components/button'
import { Input } from '@/ui-components/input'

interface EnrolledViewProps {
  activities: Activity[]
  participants: Participant[]
  onAddParticipant: () => void
  onSelectParticipant: (participant: Participant) => void
}

export function EnrolledView({ 
  activities, 
  participants,
  onAddParticipant,
  onSelectParticipant
}: EnrolledViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProgram, setSelectedProgram] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'byProgram' | 'all'>('byProgram')

  // Filter participants based on search and program
  const filteredParticipants = useMemo(() => {
    return participants.filter(participant => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        participant.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        participant.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        participant.student_id.toLowerCase().includes(searchQuery.toLowerCase())

      // Program filter
      const matchesProgram = selectedProgram === 'all' || 
        participant.enrolled_programs.some(enrollment => 
          enrollment.activity_id === selectedProgram && enrollment.status === 'active'
        )

      return matchesSearch && matchesProgram
    })
  }, [participants, searchQuery, selectedProgram])

  // Group participants by program
  const participantsByProgram = useMemo(() => {
    const grouped: Record<string, Participant[]> = {}
    
    filteredParticipants.forEach(participant => {
      participant.enrolled_programs
        .filter(enrollment => enrollment.status === 'active')
        .forEach(enrollment => {
          if (!grouped[enrollment.activity_id]) {
            grouped[enrollment.activity_id] = []
          }
          if (!grouped[enrollment.activity_id].some(p => p.id === participant.id)) {
            grouped[enrollment.activity_id].push(participant)
          }
        })
    })
    
    return grouped
  }, [filteredParticipants])

  // Calculate total enrolled count
  const totalEnrolled = participants.filter(p => 
    p.enrolled_programs.some(e => e.status === 'active')
  ).length

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
        <div className="px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Enrolled Participants</h1>
              <p className="text-blue-100 text-sm mt-1">Manage program enrollments</p>
            </div>
            <Button
              onClick={onAddParticipant}
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Participant
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-blue-200" />
                <span className="text-xs text-blue-200">Total Enrolled</span>
              </div>
              <div className="text-2xl font-bold">{totalEnrolled}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <GraduationCap className="w-4 h-4 text-blue-200" />
                <span className="text-xs text-blue-200">Programs</span>
              </div>
              <div className="text-2xl font-bold">{activities.length}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-blue-200" />
                <span className="text-xs text-blue-200">This Week</span>
              </div>
              <div className="text-2xl font-bold">0</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-blue-200" />
                <span className="text-xs text-blue-200">Pending</span>
              </div>
              <div className="text-2xl font-bold">0</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search by name or student ID..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Program Filter */}
          <select
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Programs</option>
            {activities.map(activity => (
              <option key={activity.id} value={activity.id}>
                {activity.name}
              </option>
            ))}
          </select>

          {/* View Mode */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('byProgram')}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md transition-colors",
                viewMode === 'byProgram'
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              By Program
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md transition-colors",
                viewMode === 'all'
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 sm:px-6 py-6">
        {viewMode === 'byProgram' ? (
          // Grouped by program
          <div className="space-y-6">
            {Object.entries(participantsByProgram).length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No enrolled participants found</p>
                <Button
                  onClick={onAddParticipant}
                  variant="outline"
                  className="mt-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Participant
                </Button>
              </div>
            ) : (
              Object.entries(participantsByProgram).map(([activityId, programParticipants]) => {
                const activity = activities.find(a => a.id === activityId)
                if (!activity) return null

                return (
                  <div key={activityId} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    {/* Program Header */}
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{activity.name}</h3>
                          <p className="text-sm text-gray-500">{programParticipants.length} enrolled</p>
                        </div>
                        <div className="text-xs text-gray-500">
                          {activity.category}
                        </div>
                      </div>
                    </div>

                    {/* Participants List */}
                    <div className="divide-y divide-gray-100">
                      {programParticipants.map(participant => (
                        <ParticipantRow
                          key={participant.id}
                          participant={participant}
                          onClick={() => onSelectParticipant(participant)}
                        />
                      ))}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        ) : (
          // All participants view
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {filteredParticipants.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No participants found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredParticipants.map(participant => (
                  <ParticipantRow
                    key={participant.id}
                    participant={participant}
                    onClick={() => onSelectParticipant(participant)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Participant Row Component
function ParticipantRow({ participant, onClick }: { participant: Participant; onClick: () => void }) {
  const activeEnrollments = participant.enrolled_programs.filter(e => e.status === 'active')

  return (
    <button
      onClick={onClick}
      className="w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left group"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-blue-600">
                {participant.first_name[0]}{participant.last_name[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">
                {participant.first_name} {participant.last_name}
              </div>
              <div className="text-sm text-gray-500">
                ID: {participant.student_id}
                {participant.grade_level && ` • Grade ${participant.grade_level}`}
              </div>
            </div>
          </div>
          
          {/* Contact Info */}
          <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-2 ml-13">
            {participant.contact_email && (
              <div className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                <span>{participant.contact_email}</span>
              </div>
            )}
            {participant.contact_phone && (
              <div className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                <span>{participant.contact_phone}</span>
              </div>
            )}
          </div>

          {/* Programs */}
          {activeEnrollments.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2 ml-13">
              {activeEnrollments.map(enrollment => (
                <span
                  key={enrollment.id}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700"
                >
                  {enrollment.activity_name}
                </span>
              ))}
            </div>
          )}
        </div>

        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 flex-shrink-0 ml-4" />
      </div>
    </button>
  )
}
