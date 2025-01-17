export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
        }
        Insert: {
          access_token: string
          client_id?: string | null
          created_at?: string
          deleted_at?: string | null
          expires_at?: string | null
          id?: string
        }
        Update: {
          access_token?: string
          client_id?: string | null
          created_at?: string
          deleted_at?: string | null
          expires_at?: string | null
          id?: string
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
      clients: {
        Row: {
          agency_id: string | null
          client_info: Json | null
          created_at: string
          deleted_at: string | null
          facebook: string | null
          id: string
          instagram: string | null
          marketing_info: string | null
          name: string
          packages: Json | null
          payment_day: number | null
          phone: string | null
          search_text: unknown | null
        }
        Insert: {
          agency_id?: string | null
          client_info?: Json | null
          created_at?: string
          deleted_at?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          marketing_info?: string | null
          name: string
          packages?: Json | null
          payment_day?: number | null
          phone?: string | null
          search_text?: unknown | null
        }
        Update: {
          agency_id?: string | null
          client_info?: Json | null
          created_at?: string
          deleted_at?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          marketing_info?: string | null
          name?: string
          packages?: Json | null
          payment_day?: number | null
          phone?: string | null
          search_text?: unknown | null
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
      profiles: {
        Row: {
          agency_id: string | null
          created_at: string
          deleted_at: string | null
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          agency_id?: string | null
          created_at?: string
          deleted_at?: string | null
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          agency_id?: string | null
          created_at?: string
          deleted_at?: string | null
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
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
    }
    Views: {
      deleted_items: {
        Row: {
          content: string | null
          deleted_at: string | null
          id: string | null
          type: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_initial_super_admin: {
        Args: {
          user_id: string
          full_name: string
        }
        Returns: undefined
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      user_role:
        | "super_admin"
        | "agency_owner"
        | "marketing_manager"
        | "designer"
        | "filming_crew"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
