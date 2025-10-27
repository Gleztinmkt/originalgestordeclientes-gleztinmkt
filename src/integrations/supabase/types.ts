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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      agencies: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          owner_id: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          owner_id?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          owner_id?: string | null
        }
        Relationships: []
      }
      client_links: {
        Row: {
          access_token: string
          client_id: string | null
          created_at: string
          deleted_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          unique_id: string | null
        }
        Insert: {
          access_token: string
          client_id?: string | null
          created_at?: string
          deleted_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          unique_id?: string | null
        }
        Update: {
          access_token?: string
          client_id?: string | null
          created_at?: string
          deleted_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          unique_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_links_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_notes: {
        Row: {
          client_id: string | null
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          client_id?: string | null
          content: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          client_id?: string | null
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_tax_info: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          tax_id: string | null
          tax_id_type: Database["public"]["Enums"]["tax_id_type"]
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          tax_id?: string | null
          tax_id_type?: Database["public"]["Enums"]["tax_id_type"]
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          tax_id?: string | null
          tax_id_type?: Database["public"]["Enums"]["tax_id_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_tax_info_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          agency_id: string | null
          client_info: Json | null
          created_at: string
          deleted_at: string | null
          facebook: string | null
          id: string
          instagram: string | null
          last_post: string | null
          marketing_info: string | null
          name: string
          packages: Json | null
          payment_day: number | null
          phone: string | null
          search_text: unknown
        }
        Insert: {
          agency_id?: string | null
          client_info?: Json | null
          created_at?: string
          deleted_at?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          last_post?: string | null
          marketing_info?: string | null
          name: string
          packages?: Json | null
          payment_day?: number | null
          phone?: string | null
          search_text?: unknown
        }
        Update: {
          agency_id?: string | null
          client_info?: Json | null
          created_at?: string
          deleted_at?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          last_post?: string | null
          marketing_info?: string | null
          name?: string
          packages?: Json | null
          payment_day?: number | null
          phone?: string | null
          search_text?: unknown
        }
        Relationships: [
          {
            foreignKeyName: "clients_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      deleted_items: {
        Row: {
          content: string | null
          deleted_at: string | null
          id: string
          original_id: string | null
          type: string | null
        }
        Insert: {
          content?: string | null
          deleted_at?: string | null
          id?: string
          original_id?: string | null
          type?: string | null
        }
        Update: {
          content?: string | null
          deleted_at?: string | null
          id?: string
          original_id?: string | null
          type?: string | null
        }
        Relationships: []
      }
      designers: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          client_id: string | null
          created_at: string
          deleted_at: string | null
          id: string
          invoice_date: string
          is_split_payment: boolean | null
          original_amount: number
          package_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          client_id?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          invoice_date: string
          is_split_payment?: boolean | null
          original_amount: number
          package_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          client_id?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          invoice_date?: string
          is_split_payment?: boolean | null
          original_amount?: number
          package_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      note_replies: {
        Row: {
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          note_id: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          note_id?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          note_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "note_replies_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "client_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_data: Json | null
          action_type: string | null
          client_id: string | null
          date: string
          deleted_at: string | null
          id: string
          message: string
          priority: string | null
          publication_id: string | null
          read: boolean | null
          task_id: string | null
          title: string
          type: string
        }
        Insert: {
          action_data?: Json | null
          action_type?: string | null
          client_id?: string | null
          date?: string
          deleted_at?: string | null
          id?: string
          message: string
          priority?: string | null
          publication_id?: string | null
          read?: boolean | null
          task_id?: string | null
          title: string
          type: string
        }
        Update: {
          action_data?: Json | null
          action_type?: string | null
          client_id?: string | null
          date?: string
          deleted_at?: string | null
          id?: string
          message?: string
          priority?: string | null
          publication_id?: string | null
          read?: boolean | null
          task_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_publication_id_fkey"
            columns: ["publication_id"]
            isOneToOne: false
            referencedRelation: "publications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      package_prices: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          agency_id: string | null
          created_at: string
          deleted_at: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          agency_id?: string | null
          created_at?: string
          deleted_at?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          agency_id?: string | null
          created_at?: string
          deleted_at?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      publication_notes: {
        Row: {
          content: string
          created_at: string | null
          id: string
          publication_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          publication_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          publication_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "publication_notes_publication_id_fkey"
            columns: ["publication_id"]
            isOneToOne: false
            referencedRelation: "publications"
            referencedColumns: ["id"]
          },
        ]
      }
      publication_planning: {
        Row: {
          client_id: string | null
          completed: boolean | null
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          month: string
          status: string | null
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          completed?: boolean | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          month: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          completed?: boolean | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          month?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "publication_planning_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      publications: {
        Row: {
          approved: boolean | null
          client_id: string | null
          copywriting: string | null
          created_at: string
          date: string
          deleted_at: string | null
          description: string | null
          designer: string | null
          filming_time: string | null
          google_calendar_event_id: string | null
          google_calendar_id: string | null
          id: string
          in_editing: boolean | null
          in_review: boolean | null
          is_published: boolean | null
          links: string | null
          name: string
          needs_editing: boolean | null
          needs_recording: boolean | null
          package_id: string | null
          reference_materials: Json | null
          status: string | null
          type: string
        }
        Insert: {
          approved?: boolean | null
          client_id?: string | null
          copywriting?: string | null
          created_at?: string
          date: string
          deleted_at?: string | null
          description?: string | null
          designer?: string | null
          filming_time?: string | null
          google_calendar_event_id?: string | null
          google_calendar_id?: string | null
          id?: string
          in_editing?: boolean | null
          in_review?: boolean | null
          is_published?: boolean | null
          links?: string | null
          name: string
          needs_editing?: boolean | null
          needs_recording?: boolean | null
          package_id?: string | null
          reference_materials?: Json | null
          status?: string | null
          type: string
        }
        Update: {
          approved?: boolean | null
          client_id?: string | null
          copywriting?: string | null
          created_at?: string
          date?: string
          deleted_at?: string | null
          description?: string | null
          designer?: string | null
          filming_time?: string | null
          google_calendar_event_id?: string | null
          google_calendar_id?: string | null
          id?: string
          in_editing?: boolean | null
          in_review?: boolean | null
          is_published?: boolean | null
          links?: string | null
          name?: string
          needs_editing?: boolean | null
          needs_recording?: boolean | null
          package_id?: string | null
          reference_materials?: Json | null
          status?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "publications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          client_id: string | null
          completed: boolean | null
          content: string
          created_at: string
          date: string | null
          deleted_at: string | null
          description: string | null
          execution_date: string | null
          id: string
          reminder_date: string | null
          reminder_frequency: string | null
          type: string | null
        }
        Insert: {
          client_id?: string | null
          completed?: boolean | null
          content: string
          created_at?: string
          date?: string | null
          deleted_at?: string | null
          description?: string | null
          execution_date?: string | null
          id?: string
          reminder_date?: string | null
          reminder_frequency?: string | null
          type?: string | null
        }
        Update: {
          client_id?: string | null
          completed?: boolean | null
          content?: string
          created_at?: string
          date?: string | null
          deleted_at?: string | null
          description?: string | null
          execution_date?: string | null
          id?: string
          reminder_date?: string | null
          reminder_frequency?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_calendar_preferences: {
        Row: {
          created_at: string
          id: string
          selected_calendar_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          selected_calendar_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          selected_calendar_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_admin_role: { Args: { user_id: string }; Returns: boolean }
      create_initial_super_admin: {
        Args: { full_name: string; user_id: string }
        Returns: undefined
      }
      is_super_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      tax_id_type: "CUIT" | "Consumidor Final"
      user_role: "admin" | "designer"
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
      tax_id_type: ["CUIT", "Consumidor Final"],
      user_role: ["admin", "designer"],
    },
  },
} as const
