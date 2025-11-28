export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_conversations: {
        Row: {
          context: Json | null
          created_at: string | null
          id: string
          messages: Json[] | null
          metadata: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          id?: string
          messages?: Json[] | null
          metadata?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          id?: string
          messages?: Json[] | null
          metadata?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_feedback: {
        Row: {
          comment: string | null
          conversation_id: string | null
          created_at: string
          id: string
          message_index: number
          rating: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          message_index: number
          rating: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          message_index?: number
          rating?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_feedback_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_user_memory: {
        Row: {
          created_at: string | null
          id: string
          patterns: Json | null
          preferences: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          patterns?: Json | null
          preferences?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          patterns?: Json | null
          preferences?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          receiver_id: string
          request_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          receiver_id: string
          request_id: string
          sender_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          receiver_id?: string
          request_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "professional_public_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "pending_requests_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "professional_public_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          professional_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          professional_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          professional_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          related_id: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          related_id?: string | null
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          related_id?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "professional_public_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_live_location: {
        Row: {
          created_at: string
          heading: number | null
          id: string
          latitude: number
          longitude: number
          professional_id: string
          request_id: string
          speed: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          heading?: number | null
          id?: string
          latitude: number
          longitude: number
          professional_id: string
          request_id: string
          speed?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          heading?: number | null
          id?: string
          latitude?: number
          longitude?: number
          professional_id?: string
          request_id?: string
          speed?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_live_location_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "pending_requests_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_live_location_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_specialties: {
        Row: {
          category_id: string
          certifications: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          experience_years: number | null
          hourly_rate: number | null
          id: string
          professional_id: string
        }
        Insert: {
          category_id: string
          certifications?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          experience_years?: number | null
          hourly_rate?: number | null
          id?: string
          professional_id: string
        }
        Update: {
          category_id?: string
          certifications?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          experience_years?: number | null
          hourly_rate?: number | null
          id?: string
          professional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_specialties_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_specialties_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_public_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_specialties_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_specialties_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_verification_status: {
        Row: {
          created_at: string | null
          is_verified: boolean | null
          professional_id: string
          updated_at: string | null
          verification_level: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          is_verified?: boolean | null
          professional_id: string
          updated_at?: string | null
          verification_level?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          is_verified?: boolean | null
          professional_id?: string
          updated_at?: string | null
          verification_level?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          complement: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          formatted_address: string | null
          full_name: string | null
          id: string
          latitude: number | null
          longitude: number | null
          neighborhood: string | null
          number: string | null
          phone: string | null
          postal_code: string | null
          service_radius_km: number | null
          state: string | null
          street: string | null
          updated_at: string | null
          user_type: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          complement?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          formatted_address?: string | null
          full_name?: string | null
          id: string
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          number?: string | null
          phone?: string | null
          postal_code?: string | null
          service_radius_km?: number | null
          state?: string | null
          street?: string | null
          updated_at?: string | null
          user_type?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          complement?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          formatted_address?: string | null
          full_name?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          number?: string | null
          phone?: string | null
          postal_code?: string | null
          service_radius_km?: number | null
          state?: string | null
          street?: string | null
          updated_at?: string | null
          user_type?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          estimated_time: string | null
          id: string
          is_accepted: boolean | null
          materials_included: boolean | null
          professional_id: string
          request_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          estimated_time?: string | null
          id?: string
          is_accepted?: boolean | null
          materials_included?: boolean | null
          professional_id: string
          request_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          estimated_time?: string | null
          id?: string
          is_accepted?: boolean | null
          materials_included?: boolean | null
          professional_id?: string
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_public_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "pending_requests_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          communication: number | null
          created_at: string | null
          id: string
          images_urls: string[] | null
          price_value: number | null
          professional_id: string
          punctuality: number | null
          rating: number
          request_id: string | null
          reviewer_id: string
          service_quality: number | null
          would_recommend: boolean | null
        }
        Insert: {
          comment?: string | null
          communication?: number | null
          created_at?: string | null
          id?: string
          images_urls?: string[] | null
          price_value?: number | null
          professional_id: string
          punctuality?: number | null
          rating: number
          request_id?: string | null
          reviewer_id: string
          service_quality?: number | null
          would_recommend?: boolean | null
        }
        Update: {
          comment?: string | null
          communication?: number | null
          created_at?: string | null
          id?: string
          images_urls?: string[] | null
          price_value?: number | null
          professional_id?: string
          punctuality?: number | null
          rating?: number
          request_id?: string | null
          reviewer_id?: string
          service_quality?: number | null
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_public_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "pending_requests_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "professional_public_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      service_requests: {
        Row: {
          address: string
          attachments: Json | null
          budget_estimate: number | null
          category_id: string | null
          category_id_backup: string | null
          city: string
          client_id: string
          complement: string | null
          created_at: string | null
          description: string
          extended_status: string | null
          formatted_address: string | null
          id: string
          images_urls: string[] | null
          latitude: number | null
          longitude: number | null
          neighborhood: string | null
          number: string | null
          postal_code: string | null
          preferred_date: string | null
          state: string
          status: string
          street: string | null
          title: string
          updated_at: string | null
          urgency_level: number | null
        }
        Insert: {
          address: string
          attachments?: Json | null
          budget_estimate?: number | null
          category_id?: string | null
          category_id_backup?: string | null
          city?: string
          client_id: string
          complement?: string | null
          created_at?: string | null
          description: string
          extended_status?: string | null
          formatted_address?: string | null
          id?: string
          images_urls?: string[] | null
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          number?: string | null
          postal_code?: string | null
          preferred_date?: string | null
          state?: string
          status?: string
          street?: string | null
          title: string
          updated_at?: string | null
          urgency_level?: number | null
        }
        Update: {
          address?: string
          attachments?: Json | null
          budget_estimate?: number | null
          category_id?: string | null
          category_id_backup?: string | null
          city?: string
          client_id?: string
          complement?: string | null
          created_at?: string | null
          description?: string
          extended_status?: string | null
          formatted_address?: string | null
          id?: string
          images_urls?: string[] | null
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          number?: string | null
          postal_code?: string | null
          preferred_date?: string | null
          state?: string
          status?: string
          street?: string | null
          title?: string
          updated_at?: string | null
          urgency_level?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_category_id_backup_fkey"
            columns: ["category_id_backup"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "professional_public_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_status_history: {
        Row: {
          changed_by: string
          created_at: string
          id: string
          notes: string | null
          request_id: string
          status: string
        }
        Insert: {
          changed_by: string
          created_at?: string
          id?: string
          notes?: string | null
          request_id: string
          status: string
        }
        Update: {
          changed_by?: string
          created_at?: string
          id?: string
          notes?: string | null
          request_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_status_history_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "pending_requests_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_status_history_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string | null
          document_id: string
          id: string
          new_status: string
          previous_status: string | null
          rejection_reason: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string | null
          document_id: string
          id?: string
          new_status: string
          previous_status?: string | null
          rejection_reason?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string | null
          document_id?: string
          id?: string
          new_status?: string
          previous_status?: string | null
          rejection_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_audit_logs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "verification_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_documents: {
        Row: {
          created_at: string | null
          document_type: string
          file_url: string
          id: string
          professional_id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          document_type: string
          file_url: string
          id?: string
          professional_id: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          document_type?: string
          file_url?: string
          id?: string
          professional_id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      pending_requests_summary: {
        Row: {
          budget_estimate: number | null
          category_id: string | null
          city: string | null
          client_id: string | null
          created_at: string | null
          description: string | null
          id: string | null
          images_urls: string[] | null
          neighborhood: string | null
          preferred_date: string | null
          state: string | null
          status: string | null
          title: string | null
          urgency_level: number | null
        }
        Insert: {
          budget_estimate?: number | null
          category_id?: string | null
          city?: string | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          images_urls?: string[] | null
          neighborhood?: string | null
          preferred_date?: string | null
          state?: string | null
          status?: string | null
          title?: string | null
          urgency_level?: number | null
        }
        Update: {
          budget_estimate?: number | null
          category_id?: string | null
          city?: string | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          images_urls?: string[] | null
          neighborhood?: string | null
          preferred_date?: string | null
          state?: string | null
          status?: string | null
          title?: string | null
          urgency_level?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "professional_public_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_public_view: {
        Row: {
          avatar_url: string | null
          average_rating: number | null
          city: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          service_radius_km: number | null
          state: string | null
          total_reviews: number | null
        }
        Relationships: []
      }
      professionals_with_location: {
        Row: {
          avatar_url: string | null
          average_rating: number | null
          city: string | null
          full_name: string | null
          id: string | null
          latitude: number | null
          longitude: number | null
          service_radius_km: number | null
          state: string | null
          total_reviews: number | null
        }
        Insert: {
          avatar_url?: string | null
          average_rating?: never
          city?: string | null
          full_name?: string | null
          id?: string | null
          latitude?: number | null
          longitude?: number | null
          service_radius_km?: number | null
          state?: string | null
          total_reviews?: never
        }
        Update: {
          avatar_url?: string | null
          average_rating?: never
          city?: string | null
          full_name?: string | null
          id?: string | null
          latitude?: number | null
          longitude?: number | null
          service_radius_km?: number | null
          state?: string | null
          total_reviews?: never
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_distance: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
      }
      find_nearby_professionals: {
        Args: {
          category_filter?: string
          max_distance_km?: number
          user_lat: number
          user_lon: number
        }
        Returns: {
          avatar_url: string
          average_rating: number
          city: string
          distance_km: number
          full_name: string
          id: string
          latitude: number
          longitude: number
          state: string
          total_reviews: number
        }[]
      }
      format_address_auto: {
        Args: {
          p_city: string
          p_neighborhood: string
          p_number: string
          p_state: string
          p_street: string
        }
        Returns: string
      }
      has_quote_for_request: {
        Args: { _request_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_request_client: {
        Args: { _request_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
