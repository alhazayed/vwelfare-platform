// ─────────────────────────────────────────────────────────────────────────────
// Vwelfare Database Types — v1
//
// TO REGENERATE from live schema (recommended after any migration):
//   npx supabase gen types typescript --project-id wyzezyctpvlohuuhzyof > src/types/database.ts
//
// The types below follow the exact structure @supabase/supabase-js v2 requires.
// Missing Views / Enums / CompositeTypes / Relationships causes inference to
// return `never` on typed queries — which was the build error.
// ─────────────────────────────────────────────────────────────────────────────

export type Role = 'patient' | 'clinician' | 'admin' | 'superadmin';
export type AssessmentStatus = 'pending' | 'completed' | 'expired';
export type ArticleStatus = 'draft' | 'under_review' | 'published';
export type AlertType = 'drug_interaction' | 'polypharmacy';
export type MedFrequency = 'once-daily' | 'twice-daily' | 'three-daily' | 'as-needed' | 'before-bed' | 'with-meals' | 'weekly' | 'other';
export type ArticleCategory = 'anxiety' | 'depression' | 'sleep' | 'stress' | 'relationships' | 'stigma_culture';

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: Role;
          full_name_en: string;
          full_name_ar: string | null;
          language_preference: 'ar' | 'en';
          assigned_clinician_id: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role: Role;
          full_name_en?: string;
          full_name_ar?: string | null;
          language_preference?: 'ar' | 'en';
          assigned_clinician_id?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          role?: Role;
          full_name_en?: string;
          full_name_ar?: string | null;
          language_preference?: 'ar' | 'en';
          assigned_clinician_id?: string | null;
          avatar_url?: string | null;
        };
        Relationships: [];
      };
      patient_profiles: {
        Row: {
          id: string;
          date_of_birth: string | null;
          gender: 'male' | 'female' | 'prefer_not_to_say' | 'other' | null;
          phone_number: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          emergency_contact_relation: 'family' | 'friend' | 'colleague' | 'other' | null;
          consent_given_at: string | null;
          platform_joined_at: string;
          share_mood_notes: boolean;
          share_journal_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['patient_profiles']['Row']> & { id: string };
        Update: Partial<Omit<Database['public']['Tables']['patient_profiles']['Row'], 'id' | 'created_at'>>;
        Relationships: [];
      };
      mood_logs: {
        Row: {
          id: string;
          patient_id: string;
          log_date: string;
          mood_score: number;
          energy_score: number;
          anxiety_score: number;
          sleep_hours: number | null;
          mood_note: string | null;
          note_shared: boolean;
          created_at: string;
        };
        Insert: {
          patient_id: string;
          log_date: string;
          mood_score: number;
          energy_score: number;
          anxiety_score: number;
          sleep_hours?: number | null;
          mood_note?: string | null;
          note_shared?: boolean;
        };
        Update: { note_shared?: boolean };
        Relationships: [];
      };
      journal_entries: {
        Row: {
          id: string;
          patient_id: string;
          body: string;
          is_shared: boolean;
          shared_at: string | null;
          word_count: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: { patient_id: string; body?: string; is_shared?: boolean };
        Update: { body?: string; is_shared?: boolean; shared_at?: string | null; word_count?: number | null };
        Relationships: [];
      };
      medications: {
        Row: {
          id: string;
          patient_id: string;
          drugbank_drug_id: string | null;
          drug_name_display: string;
          dosage: string | null;
          frequency: MedFrequency | null;
          prescribed_by: string | null;
          started_month: string | null;
          is_active: boolean;
          deactivated_at: string | null;
          created_at: string;
        };
        Insert: {
          patient_id: string;
          drug_name_display: string;
          drugbank_drug_id?: string | null;
          dosage?: string | null;
          frequency?: MedFrequency | null;
          prescribed_by?: string | null;
          started_month?: string | null;
          is_active?: boolean;
        };
        Update: {
          dosage?: string | null;
          frequency?: MedFrequency | null;
          prescribed_by?: string | null;
          is_active?: boolean;
          deactivated_at?: string | null;
        };
        Relationships: [];
      };
      medication_alerts: {
        Row: {
          id: string;
          patient_id: string;
          alert_type: AlertType;
          drug_ids: string[] | null;
          drugbank_interaction_id: string | null;
          severity: 'major' | 'moderate' | 'minor' | null;
          mechanism_en: string | null;
          mechanism_ar: string | null;
          acknowledged_by: string | null;
          acknowledged_at: string | null;
          created_at: string;
        };
        Insert: {
          patient_id: string;
          alert_type: AlertType;
          drug_ids?: string[] | null;
          drugbank_interaction_id?: string | null;
          severity?: 'major' | 'moderate' | 'minor' | null;
          mechanism_en?: string | null;
          mechanism_ar?: string | null;
        };
        Update: { acknowledged_by?: string | null; acknowledged_at?: string | null };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          patient_id: string;
          clinician_id: string;
          sender_id: string;
          body: string;
          read_at: string | null;
          attachments: Json;
          created_at: string;
        };
        Insert: {
          patient_id: string;
          clinician_id: string;
          sender_id: string;
          body: string;
          attachments?: Json;
        };
        Update: { read_at?: string | null };
        Relationships: [];
      };
      assessment_definitions: {
        Row: {
          id: string;
          code: string;
          name_en: string;
          name_ar: string;
          description_en: string | null;
          description_ar: string | null;
          total_questions: number;
          scoring_logic: Json;
          high_risk_threshold: number | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['assessment_definitions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Omit<Database['public']['Tables']['assessment_definitions']['Row'], 'id' | 'created_at'>>;
        Relationships: [];
      };
      assessment_assignments: {
        Row: {
          id: string;
          patient_id: string;
          clinician_id: string;
          definition_id: string;
          assigned_at: string;
          due_date: string | null;
          status: AssessmentStatus;
          completed_submission_id: string | null;
          note_to_patient_en: string | null;
          note_to_patient_ar: string | null;
        };
        Insert: {
          patient_id: string;
          clinician_id: string;
          definition_id: string;
          due_date?: string | null;
          note_to_patient_en?: string | null;
          note_to_patient_ar?: string | null;
        };
        Update: { status?: AssessmentStatus; completed_submission_id?: string | null };
        Relationships: [];
      };
      assessment_submissions: {
        Row: {
          id: string;
          assignment_id: string;
          patient_id: string;
          definition_id: string;
          total_score: number;
          severity_band: string;
          started_at: string;
          submitted_at: string;
          high_risk_flag: boolean;
        };
        Insert: Omit<Database['public']['Tables']['assessment_submissions']['Row'], 'id'>;
        Update: never;
        Relationships: [];
      };
      content_articles: {
        Row: {
          id: string;
          category: ArticleCategory;
          title_en: string;
          title_ar: string;
          body_en: string;
          body_ar: string;
          status: ArticleStatus;
          clinical_reviewer_id: string | null;
          reviewed_at: string | null;
          version: number;
          published_at: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['content_articles']['Row'], 'id' | 'version' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Database['public']['Tables']['content_articles']['Row'], 'id' | 'created_at'>>;
        Relationships: [];
      };
      invitations: {
        Row: {
          id: string;
          email: string;
          assigned_clinician_id: string;
          token_hash: string;
          created_by: string;
          created_at: string;
          expires_at: string;
          accepted_at: string | null;
          status: 'pending' | 'accepted' | 'expired' | 'cancelled';
        };
        Insert: {
          email: string;
          assigned_clinician_id: string;
          token_hash: string;
          created_by: string;
          expires_at?: string;
        };
        Update: { accepted_at?: string | null; status?: 'pending' | 'accepted' | 'expired' | 'cancelled' };
        Relationships: [];
      };
      notification_log: {
        Row: {
          id: string;
          recipient_id: string;
          channel: 'push' | 'email' | 'sms';
          type: string;
          payload: Json;
          sent_at: string;
          status: 'sent' | 'failed' | 'pending';
        };
        Insert: {
          recipient_id: string;
          channel: 'push' | 'email' | 'sms';
          type: string;
          payload?: Json;
        };
        Update: { status?: 'sent' | 'failed' | 'pending' };
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: string;
          actor_id: string;
          action: string;
          target_type: string | null;
          target_id: string | null;
          reason: string | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          actor_id: string;
          action: string;
          target_type?: string | null;
          target_id?: string | null;
          reason?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
        };
        Update: never;
        Relationships: [];
      };
      platform_settings: {
        Row: { key: string; value: string; updated_at: string; updated_by: string | null };
        Insert: { key: string; value: string };
        Update: { value?: string; updated_by?: string | null };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
