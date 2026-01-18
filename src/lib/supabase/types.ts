// =====================================================
// ELITE TRACK - TIPOS GERADOS PARA SUPABASE
// Este arquivo será substituído quando você rodar:
// npx supabase gen types typescript --project-id <seu-projeto> > src/lib/supabase/types.ts
// =====================================================

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
      users: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          avatar: string | null
          role: 'client' | 'executor' | 'admin'
          vip_level: 'standard' | 'gold' | 'platinum' | null
          password_hash: string | null
          requires_password_change: boolean
          created_at: string
          updated_at: string
          last_login: string | null
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          avatar?: string | null
          role?: 'client' | 'executor' | 'admin'
          vip_level?: 'standard' | 'gold' | 'platinum' | null
          password_hash?: string | null
          requires_password_change?: boolean
          created_at?: string
          updated_at?: string
          last_login?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          avatar?: string | null
          role?: 'client' | 'executor' | 'admin'
          vip_level?: 'standard' | 'gold' | 'platinum' | null
          password_hash?: string | null
          requires_password_change?: boolean
          created_at?: string
          updated_at?: string
          last_login?: string | null
        }
      }
      vehicles: {
        Row: {
          id: string
          brand: string
          model: string
          year: number
          color: string
          plate: string
          blinding_level: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          brand: string
          model: string
          year: number
          color: string
          plate: string
          blinding_level?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          brand?: string
          model?: string
          year?: number
          color?: string
          plate?: string
          blinding_level?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      vehicle_images: {
        Row: {
          id: string
          vehicle_id: string
          image_url: string
          is_primary: boolean
          created_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          image_url: string
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string
          image_url?: string
          is_primary?: boolean
          created_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          vehicle_id: string
          user_id: string
          status: 'pending' | 'in_progress' | 'completed' | 'delivered'
          progress: number
          start_date: string
          estimated_delivery: string
          actual_delivery: string | null
          qr_code: string | null
          vehicle_received_date: string | null
          process_start_date: string | null
          completed_date: string | null
          registration_qr_code: string | null
          permanent_qr_code: string | null
          invite_token: string | null
          invite_expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          user_id: string
          status?: 'pending' | 'in_progress' | 'completed' | 'delivered'
          progress?: number
          start_date: string
          estimated_delivery: string
          actual_delivery?: string | null
          qr_code?: string | null
          vehicle_received_date?: string | null
          process_start_date?: string | null
          completed_date?: string | null
          registration_qr_code?: string | null
          permanent_qr_code?: string | null
          invite_token?: string | null
          invite_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string
          user_id?: string
          status?: 'pending' | 'in_progress' | 'completed' | 'delivered'
          progress?: number
          start_date?: string
          estimated_delivery?: string
          actual_delivery?: string | null
          qr_code?: string | null
          vehicle_received_date?: string | null
          process_start_date?: string | null
          completed_date?: string | null
          registration_qr_code?: string | null
          permanent_qr_code?: string | null
          invite_token?: string | null
          invite_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      timeline_steps: {
        Row: {
          id: string
          project_id: string
          title: string
          description: string | null
          status: 'pending' | 'in_progress' | 'completed'
          date: string | null
          estimated_date: string | null
          technician: string | null
          notes: string | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          description?: string | null
          status?: 'pending' | 'in_progress' | 'completed'
          date?: string | null
          estimated_date?: string | null
          technician?: string | null
          notes?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          title?: string
          description?: string | null
          status?: 'pending' | 'in_progress' | 'completed'
          date?: string | null
          estimated_date?: string | null
          technician?: string | null
          notes?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      step_photos: {
        Row: {
          id: string
          step_id: string
          photo_url: string
          created_at: string
        }
        Insert: {
          id?: string
          step_id: string
          photo_url: string
          created_at?: string
        }
        Update: {
          id?: string
          step_id?: string
          photo_url?: string
          created_at?: string
        }
      }
      blinding_specs: {
        Row: {
          id: string
          project_id: string
          level: string
          certification: string
          certification_number: string | null
          valid_until: string | null
          glass_type: string | null
          glass_thickness: string | null
          warranty: string | null
          technical_responsible: string | null
          installation_date: string | null
          total_weight: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          level: string
          certification: string
          certification_number?: string | null
          valid_until?: string | null
          glass_type?: string | null
          glass_thickness?: string | null
          warranty?: string | null
          technical_responsible?: string | null
          installation_date?: string | null
          total_weight?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          level?: string
          certification?: string
          certification_number?: string | null
          valid_until?: string | null
          glass_type?: string | null
          glass_thickness?: string | null
          warranty?: string | null
          technical_responsible?: string | null
          installation_date?: string | null
          total_weight?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          title: string
          message: string
          type: 'info' | 'success' | 'warning' | 'alert'
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id?: string | null
          title: string
          message: string
          type?: 'info' | 'success' | 'warning' | 'alert'
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string | null
          title?: string
          message?: string
          type?: 'info' | 'success' | 'warning' | 'alert'
          read?: boolean
          created_at?: string
        }
      }
      support_tickets: {
        Row: {
          id: string
          project_id: string
          user_id: string
          title: string
          description: string
          status: 'open' | 'in_progress' | 'resolved' | 'closed'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          category: 'general' | 'technical' | 'delivery' | 'warranty' | 'rescue'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          title: string
          description: string
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          category?: 'general' | 'technical' | 'delivery' | 'warranty' | 'rescue'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          title?: string
          description?: string
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          category?: 'general' | 'technical' | 'delivery' | 'warranty' | 'rescue'
          created_at?: string
          updated_at?: string
        }
      }
      registration_invites: {
        Row: {
          id: string
          token: string
          project_id: string
          vehicle_plate: string
          vehicle_info: string | null
          owner_name: string
          owner_email: string | null
          owner_phone: string | null
          status: 'pending' | 'used' | 'expired' | 'revoked'
          created_at: string
          expires_at: string
          used_at: string | null
          used_by: string | null
          created_by: string
          notes: string | null
        }
        Insert: {
          id?: string
          token: string
          project_id: string
          vehicle_plate: string
          vehicle_info?: string | null
          owner_name: string
          owner_email?: string | null
          owner_phone?: string | null
          status?: 'pending' | 'used' | 'expired' | 'revoked'
          created_at?: string
          expires_at: string
          used_at?: string | null
          used_by?: string | null
          created_by: string
          notes?: string | null
        }
        Update: {
          id?: string
          token?: string
          project_id?: string
          vehicle_plate?: string
          vehicle_info?: string | null
          owner_name?: string
          owner_email?: string | null
          owner_phone?: string | null
          status?: 'pending' | 'used' | 'expired' | 'revoked'
          created_at?: string
          expires_at?: string
          used_at?: string | null
          used_by?: string | null
          created_by?: string
          notes?: string | null
        }
      }
      temp_passwords: {
        Row: {
          id: string
          email: string
          password_hash: string
          project_id: string | null
          used: boolean
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          email: string
          password_hash: string
          project_id?: string | null
          used?: boolean
          created_at?: string
          expires_at: string
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string
          project_id?: string | null
          used?: boolean
          created_at?: string
          expires_at?: string
        }
      }
    }
    Views: Record<never, never>
    Functions: Record<never, never>
    Enums: {
      user_role: 'client' | 'executor' | 'admin'
      vip_level: 'standard' | 'gold' | 'platinum'
      project_status: 'pending' | 'in_progress' | 'completed' | 'delivered'
      step_status: 'pending' | 'in_progress' | 'completed'
      ticket_status: 'open' | 'in_progress' | 'resolved' | 'closed'
      ticket_priority: 'low' | 'medium' | 'high' | 'urgent'
      ticket_category: 'general' | 'technical' | 'delivery' | 'warranty' | 'rescue'
      invite_status: 'pending' | 'used' | 'expired' | 'revoked'
      notification_type: 'info' | 'success' | 'warning' | 'alert'
    }
    CompositeTypes: Record<never, never>
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
