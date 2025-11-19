/**
 * Participants Data Helpers
 * Convert between table row format and participant display format
 */

import { TableRow } from '@/types/data-tables'
import { Participant } from '@/types/participants'

/**
 * Convert table row to Participant object for UI
 */
export function tableRowToParticipant(row: TableRow, tableId: string): Participant {
  const data = row.data || {}
  
  return {
    id: row.id || '',
    workspace_id: tableId,
    
    // Student Information
    consent_on_file: data.consent_on_file || false,
    student_id: data.student_id || '',
    school_code: data.school_code || '',
    first_name: data.first_name || '',
    last_name: data.last_name || '',
    student_phone: data.student_phone,
    
    // Address
    street_number: data.street_number,
    address_direction: data.address_direction,
    street_name: data.street_name,
    street_type: data.street_type,
    postal_code: data.postal_code,
    
    // Demographics
    birth_date: data.birth_date,
    age: data.age,
    gender: data.gender,
    ethnicity: data.ethnicity,
    
    // Education
    feeder_school_student: data.feeder_school_student,
    feeder_school: data.feeder_school,
    feeder_school_other: data.feeder_school_other,
    grade_level: data.grade_level,
    special_ed: data.special_ed,
    ell_student: data.ell_student,
    primary_disability: data.primary_disability,
    primary_language: data.primary_language,
    iep: data.iep,
    free_reduced_meal: data.free_reduced_meal,
    number_of_family_members: data.number_of_family_members,
    
    // Contact
    contact_first_name: data.contact_first_name,
    contact_last_name: data.contact_last_name,
    contact_relation: data.contact_relation,
    contact_phone: data.contact_phone,
    contact_email: data.contact_email,
    
    // Programs - parse from multiselect or link field
    enrolled_programs: parseEnrolledPrograms(data.enrolled_programs),
    
    // Metadata
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
    created_by: row.created_by || ''
  }
}

/**
 * Convert participant data to table row data
 */
export function participantToTableRowData(participant: Partial<Participant>): Record<string, any> {
  const rowData: Record<string, any> = {}
  
  // Map all participant fields to row data
  if (participant.consent_on_file !== undefined) rowData.consent_on_file = participant.consent_on_file
  if (participant.student_id) rowData.student_id = participant.student_id
  if (participant.school_code) rowData.school_code = participant.school_code
  if (participant.first_name) rowData.first_name = participant.first_name
  if (participant.last_name) rowData.last_name = participant.last_name
  if (participant.student_phone) rowData.student_phone = participant.student_phone
  
  // Address
  if (participant.street_number) rowData.street_number = participant.street_number
  if (participant.address_direction) rowData.address_direction = participant.address_direction
  if (participant.street_name) rowData.street_name = participant.street_name
  if (participant.street_type) rowData.street_type = participant.street_type
  if (participant.postal_code) rowData.postal_code = participant.postal_code
  
  // Demographics
  if (participant.birth_date) rowData.birth_date = participant.birth_date
  if (participant.age !== undefined) rowData.age = participant.age
  if (participant.gender) rowData.gender = participant.gender
  if (participant.ethnicity) rowData.ethnicity = participant.ethnicity
  
  // Education
  if (participant.feeder_school_student !== undefined) rowData.feeder_school_student = participant.feeder_school_student
  if (participant.feeder_school) rowData.feeder_school = participant.feeder_school
  if (participant.feeder_school_other) rowData.feeder_school_other = participant.feeder_school_other
  if (participant.grade_level) rowData.grade_level = participant.grade_level
  if (participant.special_ed !== undefined) rowData.special_ed = participant.special_ed
  if (participant.ell_student !== undefined) rowData.ell_student = participant.ell_student
  if (participant.primary_disability) rowData.primary_disability = participant.primary_disability
  if (participant.primary_language) rowData.primary_language = participant.primary_language
  if (participant.iep !== undefined) rowData.iep = participant.iep
  if (participant.free_reduced_meal) rowData.free_reduced_meal = participant.free_reduced_meal
  if (participant.number_of_family_members !== undefined) rowData.number_of_family_members = participant.number_of_family_members
  
  // Contact
  if (participant.contact_first_name) rowData.contact_first_name = participant.contact_first_name
  if (participant.contact_last_name) rowData.contact_last_name = participant.contact_last_name
  if (participant.contact_relation) rowData.contact_relation = participant.contact_relation
  if (participant.contact_phone) rowData.contact_phone = participant.contact_phone
  if (participant.contact_email) rowData.contact_email = participant.contact_email
  
  // Programs
  if (participant.enrolled_programs) {
    rowData.enrolled_programs = participant.enrolled_programs.map(p => p.activity_id)
  }
  
  return rowData
}

/**
 * Parse enrolled programs from table data
 */
function parseEnrolledPrograms(data: any): any[] {
  if (!data) return []
  
  // If it's already an array of program enrollments
  if (Array.isArray(data)) {
    return data.map((item: any) => {
      if (typeof item === 'string') {
        // Just activity ID
        return {
          id: `enrollment_${item}`,
          participant_id: '',
          activity_id: item,
          activity_name: item,
          enrolled_date: new Date().toISOString(),
          status: 'active' as const
        }
      }
      return item
    })
  }
  
  return []
}
