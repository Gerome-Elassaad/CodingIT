export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface UserProfile {
  id: string
  user_id: string
  full_name?: string
  display_name?: string
  first_name?: string
  last_name?: string
  work_description?: string
  avatar_url?: string
  onboarding_completed?: boolean
  created_at: string
  updated_at: string
}

export interface UserPreferences {
  id: string
  user_id: string
  ai_assistance: boolean
  smart_suggestions: boolean
  theme: 'light' | 'dark' | 'system'
  font_family: 'inter' | 'jetbrains-mono' | 'cal-sans'
  email_notifications: boolean
  marketing_emails: boolean
  security_alerts: boolean
  analytics_enabled?: boolean
  data_sharing_enabled?: boolean
  telemetry_enabled?: boolean
  auto_template?: string
  created_at: string
  updated_at: string
}

export interface UserIntegration {
  id: string
  user_id: string
  service_name: string
  is_connected: boolean
  connection_data?: Record<string, any>
  last_sync_at?: string
  created_at: string
  updated_at: string
}

export interface UserSecuritySettings {
  id: string
  user_id: string
  two_factor_enabled: boolean
  backup_codes?: string[]
  last_password_change?: string
  login_notifications?: boolean
  created_at: string
  updated_at: string
}

export type ProfileInsert = Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>;
export type UserPreferencesInsert = Omit<UserPreferences, 'id' | 'created_at' | 'updated_at'>;
export type UserIntegrationInsert = Omit<UserIntegration, 'id' | 'created_at' | 'updated_at'>;
export type UserSecuritySettingsInsert = Omit<UserSecuritySettings, 'id' | 'created_at' | 'updated_at'>;

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: UserProfile;
        Insert: ProfileInsert;
        Update: Partial<UserProfile>;
      };
      user_preferences: {
        Row: UserPreferences;
        Insert: UserPreferencesInsert;
        Update: Partial<UserPreferences>;
      };
      user_integrations: {
        Row: UserIntegration;
        Insert: UserIntegrationInsert;
        Update: Partial<UserIntegration>;
      };
      user_security_settings: {
        Row: UserSecuritySettings;
        Insert: UserSecuritySettingsInsert;
        Update: Partial<UserSecuritySettings>;
      };
    };
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
