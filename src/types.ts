export type UserRole = 'guest' | 'student' | 'mentor' | 'management' | 'super_admin';

export interface Profile {
  id: string;
  display_name: string;
  email: string;
  role: UserRole;
  department?: string;
  is_active: boolean;
  created_at: string;
}

export type AreaCategory =
  | 'Dining & Food'
  | 'Academic & Library'
  | 'Administration'
  | 'Finance & Fees'
  | 'Printing & Reprographics'
  | 'Labs & Innovation'
  | 'Student Services';

export interface Area {
  id: string;
  stable_identifier: string;
  name: string;
  category: AreaCategory | string;
  description: string;
  building: string;
  floor: string;
  counters: number;
  service_minutes: number;
  operating_hours: string;
  assigned_mentor_id: string | null;
  assigned_mentor_name?: string | null;
  status: 'active' | 'inactive' | 'archived';
  last_modified_by?: string;
  created_at: string;
  updated_at: string;
  // Computed stats from backend
  report_count?: number;
  live_report_count?: number;
  demo_report_count?: number;
  avg_wait_minutes?: number;
  active_queue_count?: number;
}

export interface QueueSession {
  id: string;
  area_id: string;
  area_stable_identifier: string;
  area_name: string;
  user_id: string | null;
  started_at: string;
  ended_at: string | null;
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  cancel_reason?: string | null;
  duration_minutes?: number | null;
}

export interface WaitReport {
  id: string;
  area_id: string;
  area_name?: string;
  area_category?: string;
  user_id: string | null;
  user_name?: string | null;
  queue_session_id: string | null;
  duration_minutes: number;
  reporting_source: 'qr_timer' | 'manual';
  feedback_note?: string | null;
  issue_tag?: string | null;
  is_demo: boolean;
  created_at: string;
}

export type SuggestionStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Review'
  | 'Approved'
  | 'Rejected'
  | 'Implemented';

export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface ImprovementSuggestion {
  id: string;
  area_id: string;
  area_name?: string;
  mentor_id: string;
  mentor_name?: string;
  title: string;
  description: string;
  proposed_solution: string;
  priority: PriorityLevel;
  estimated_cost: number | null;
  supporting_observation: string;
  status: SuggestionStatus;
  management_response?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Intervention {
  id: string;
  suggestion_id: string | null;
  area_id: string;
  area_name?: string;
  title: string;
  description: string;
  assigned_to: string;
  assigned_to_name?: string;
  estimated_cost: number | null;
  approved_by: string;
  approved_by_name?: string;
  implementation_date: string;
  status: 'Planned' | 'In Progress' | 'Implemented' | 'Verified';
  baseline_wait_minutes?: number | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_name: string;
  actor_role: UserRole;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  created_at: string;
}

export interface InstitutionSettings {
  institution_name: string;
  tagline: string;
  timezone: string;
  language_default: 'en' | 'ml';
  max_report_minutes: number;
  rate_limit_per_hour: number;
  demo_mode_enabled: boolean;
  categories: string[];
  supabase_connected: boolean;
}
