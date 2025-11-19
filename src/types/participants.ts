/**
 * Participant Types
 * Based on CPS Student Data form structure
 */

export type Participant = {
  id: string;
  workspace_id: string;
  
  // Student Information
  consent_on_file: boolean;
  student_id: string;
  school_code: string;
  first_name: string;
  last_name: string;
  student_phone?: string;
  
  // Address Information
  street_number?: string;
  address_direction?: string; // N, S, E, W
  street_name?: string;
  street_type?: string; // AVE, ST, BLVD, etc.
  postal_code?: string;
  
  // Demographics
  birth_date?: string;
  age?: number;
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  ethnicity?: string;
  
  // Education
  feeder_school_student?: boolean;
  feeder_school?: string;
  feeder_school_other?: string;
  grade_level?: string;
  special_ed?: boolean;
  ell_student?: boolean;
  primary_disability?: string;
  primary_language?: string;
  iep?: boolean;
  free_reduced_meal?: 'Free' | 'Reduced' | 'Paid';
  number_of_family_members?: number;
  
  // Contact Person
  contact_first_name?: string;
  contact_last_name?: string;
  contact_relation?: string; // Mother, Father, Guardian, etc.
  contact_phone?: string;
  contact_email?: string;
  
  // Enrollment
  enrolled_programs: ProgramEnrollment[];
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by: string;
};

export type ProgramEnrollment = {
  id: string;
  participant_id: string;
  activity_id: string;
  activity_name: string;
  enrolled_date: string;
  status: 'active' | 'inactive' | 'completed' | 'withdrawn';
  notes?: string;
};

// Input types for API requests
export type CreateParticipantInput = {
  // Required fields
  first_name: string;
  last_name: string;
  student_id: string;
  
  // Optional fields
  consent_on_file?: boolean;
  school_code?: string;
  student_phone?: string;
  street_number?: string;
  address_direction?: string;
  street_name?: string;
  street_type?: string;
  postal_code?: string;
  birth_date?: string;
  age?: number;
  gender?: Participant['gender'];
  ethnicity?: string;
  feeder_school_student?: boolean;
  feeder_school?: string;
  feeder_school_other?: string;
  grade_level?: string;
  special_ed?: boolean;
  ell_student?: boolean;
  primary_disability?: string;
  primary_language?: string;
  iep?: boolean;
  free_reduced_meal?: Participant['free_reduced_meal'];
  number_of_family_members?: number;
  contact_first_name?: string;
  contact_last_name?: string;
  contact_relation?: string;
  contact_phone?: string;
  contact_email?: string;
};

export type UpdateParticipantInput = Partial<CreateParticipantInput>;

export type EnrollParticipantInput = {
  participant_id: string;
  activity_id: string;
  enrolled_date?: string;
  notes?: string;
};

export type UpdateEnrollmentInput = {
  status?: ProgramEnrollment['status'];
  notes?: string;
};

export type ParticipantFilters = {
  search?: string;
  activity_id?: string;
  grade_level?: string;
  status?: 'active' | 'inactive' | 'all';
  enrolled?: boolean;
};
