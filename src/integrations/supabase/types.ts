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
      clients: {
        Row: {
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
        Relationships: []
      }
      publications: {
        Row: {
          client_id: string | null
          created_at: string
          date: string
          deleted_at: string | null
          description: string | null
          google_calendar_event_id: string | null
          id: string
          is_published: boolean | null
          name: string
          package_id: string | null
          type: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          date: string
          deleted_at?: string | null
          description?: string | null
          google_calendar_event_id?: string | null
          id?: string
          is_published?: boolean | null
          name: string
          package_id?: string | null
          type: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          date?: string
          deleted_at?: string | null
          description?: string | null
          google_calendar_event_id?: string | null
          id?: string
          is_published?: boolean | null
          name?: string
          package_id?: string | null
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
