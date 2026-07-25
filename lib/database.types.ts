// supabase gen types 산출물 — 수기 수정 금지 (CLAUDE.md §4: 수기 타입 금지)
// 재생성: Supabase MCP generate_typescript_types (project: bean-checker / xtczrghymzuvavutdqzn)
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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      beans: {
        Row: {
          avg_profile: Json | null
          avg_rating: number | null
          checkin_count: number
          created_at: string
          created_by: string | null
          hidden: boolean
          id: string
          merged_into: string | null
          name: string
          normalized_name: string
          official_notes: string[] | null
          origin: string
          process: string | null
          region: string | null
          roast_level: number | null
          roast_year: number | null
          roaster_id: string | null
          slug: string
          verified: boolean
        }
        Insert: {
          avg_profile?: Json | null
          avg_rating?: number | null
          checkin_count?: number
          created_at?: string
          created_by?: string | null
          hidden?: boolean
          id?: string
          merged_into?: string | null
          name: string
          normalized_name: string
          official_notes?: string[] | null
          origin: string
          process?: string | null
          region?: string | null
          roast_level?: number | null
          roast_year?: number | null
          roaster_id?: string | null
          slug: string
          verified?: boolean
        }
        Update: {
          avg_profile?: Json | null
          avg_rating?: number | null
          checkin_count?: number
          created_at?: string
          created_by?: string | null
          hidden?: boolean
          id?: string
          merged_into?: string | null
          name?: string
          normalized_name?: string
          official_notes?: string[] | null
          origin?: string
          process?: string | null
          region?: string | null
          roast_level?: number | null
          roast_year?: number | null
          roaster_id?: string | null
          slug?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "beans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beans_merged_into_fkey"
            columns: ["merged_into"]
            isOneToOne: false
            referencedRelation: "beans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beans_roaster_id_fkey"
            columns: ["roaster_id"]
            isOneToOne: false
            referencedRelation: "cafes"
            referencedColumns: ["id"]
          },
        ]
      }
      cafes: {
        Row: {
          address: string
          avg_rating: number | null
          checkin_count: number
          created_at: string
          created_by: string | null
          district: string
          hidden: boolean
          id: string
          is_roastery: boolean
          location: unknown
          name: string
          slug: string
          verified: boolean
        }
        Insert: {
          address: string
          avg_rating?: number | null
          checkin_count?: number
          created_at?: string
          created_by?: string | null
          district: string
          hidden?: boolean
          id?: string
          is_roastery?: boolean
          location: unknown
          name: string
          slug: string
          verified?: boolean
        }
        Update: {
          address?: string
          avg_rating?: number | null
          checkin_count?: number
          created_at?: string
          created_by?: string | null
          district?: string
          hidden?: boolean
          id?: string
          is_roastery?: boolean
          location?: unknown
          name?: string
          slug?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "cafes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      checkins: {
        Row: {
          bean_id: string
          brew_method: string
          cafe_id: string | null
          context: string
          created_at: string
          flavor_tags: string[]
          gps_verified: boolean
          hidden: boolean
          id: string
          is_public: boolean
          memo: string | null
          photo_url: string
          profile: Json
          rating: number
          user_id: string
        }
        Insert: {
          bean_id: string
          brew_method: string
          cafe_id?: string | null
          context: string
          created_at?: string
          flavor_tags: string[]
          gps_verified?: boolean
          hidden?: boolean
          id?: string
          is_public?: boolean
          memo?: string | null
          photo_url: string
          profile: Json
          rating: number
          user_id: string
        }
        Update: {
          bean_id?: string
          brew_method?: string
          cafe_id?: string | null
          context?: string
          created_at?: string
          flavor_tags?: string[]
          gps_verified?: boolean
          hidden?: boolean
          id?: string
          is_public?: boolean
          memo?: string | null
          photo_url?: string
          profile?: Json
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkins_bean_id_fkey"
            columns: ["bean_id"]
            isOneToOne: false
            referencedRelation: "beans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_cafe_id_fkey"
            columns: ["cafe_id"]
            isOneToOne: false
            referencedRelation: "cafes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          checkin_count: number
          created_at: string
          deleted_at: string | null
          display_name: string
          id: string
          is_admin: boolean
          photo_url: string | null
          provider: string | null
        }
        Insert: {
          checkin_count?: number
          created_at?: string
          deleted_at?: string | null
          display_name: string
          id: string
          is_admin?: boolean
          photo_url?: string | null
          provider?: string | null
        }
        Update: {
          checkin_count?: number
          created_at?: string
          deleted_at?: string | null
          display_name?: string
          id?: string
          is_admin?: boolean
          photo_url?: string | null
          provider?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          id: string
          memo: string | null
          reason: string
          reporter_id: string
          status: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          memo?: string | null
          reason: string
          reporter_id: string
          status?: string
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          id?: string
          memo?: string | null
          reason?: string
          reporter_id?: string
          status?: string
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stats: {
        Row: {
          avg_profile: Json | null
          checkin_count: number
          period: string
          top_flavor_tags: string[] | null
          top_roaster_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_profile?: Json | null
          checkin_count?: number
          period: string
          top_flavor_tags?: string[] | null
          top_roaster_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_profile?: Json | null
          checkin_count?: number
          period?: string
          top_flavor_tags?: string[] | null
          top_roaster_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
      recompute_aggregates: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
