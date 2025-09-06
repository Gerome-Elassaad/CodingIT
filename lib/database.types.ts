export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          user_id: string
          team_id?: string
          title: string
          description?: string
          template_id?: string
          status: 'active' | 'archived' | 'deleted'
          is_public: boolean
          metadata?: Json
          created_at: string
          updated_at: string
          deleted_at?: string
        }
        Insert: {
          id?: string
          user_id: string
          team_id?: string
          title: string
          description?: string
          template_id?: string
          status?: 'active' | 'archived' | 'deleted'
          is_public?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
          deleted_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          team_id?: string
          title?: string
          description?: string
          template_id?: string
          status?: 'active' | 'archived' | 'deleted'
          is_public?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
          deleted_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          project_id: string
          role: 'user' | 'assistant'
          content: Json
          object_data?: Json
          result_data?: Json
          sequence_number: number
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          role: 'user' | 'assistant'
          content: Json
          object_data?: Json
          result_data?: Json
          sequence_number: number
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          role?: 'user' | 'assistant'
          content?: Json
          object_data?: Json
          result_data?: Json
          sequence_number?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      save_message_and_update_project: {
        Args: {
          project_id_param: string
          role_param: 'user' | 'assistant'
          content_param: Json
          object_data_param: Json
          result_data_param: Json
          sequence_number_param: number
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
