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
      aether_objects: {
        Row: {
          created_at: string
          data_json: Json
          id: string
          object_type: string
          project_id: string | null
          qa_status: string | null
          summary: string | null
          title: string
          updated_at: string
          user_id: string
          version: number
          workspace_id: string
        }
        Insert: {
          created_at?: string
          data_json?: Json
          id?: string
          object_type: string
          project_id?: string | null
          qa_status?: string | null
          summary?: string | null
          title: string
          updated_at?: string
          user_id: string
          version?: number
          workspace_id: string
        }
        Update: {
          created_at?: string
          data_json?: Json
          id?: string
          object_type?: string
          project_id?: string | null
          qa_status?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aether_objects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aether_objects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata_json: Json
          risk_level: string
          status: string
          target_id: string | null
          target_type: string | null
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata_json?: Json
          risk_level?: string
          status?: string
          target_id?: string | null
          target_type?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata_json?: Json
          risk_level?: string
          status?: string
          target_id?: string | null
          target_type?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string | null
          created_at: string
          data_json: Json
          id: string
          message_type: string
          role: string
          session_id: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          data_json?: Json
          id?: string
          message_type?: string
          role: string
          session_id: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          data_json?: Json
          id?: string
          message_type?: string
          role?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string
          id: string
          status: string
          title: string | null
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          title?: string | null
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      model_states: {
        Row: {
          config_json: Json
          id: string
          model_name: string | null
          model_type: string
          status: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          config_json?: Json
          id?: string
          model_name?: string | null
          model_type: string
          status?: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          config_json?: Json
          id?: string
          model_name?: string | null
          model_type?: string
          status?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "model_states_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          project_type: string | null
          status: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          project_type?: string | null
          status?: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          project_type?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      qa_reports: {
        Row: {
          created_at: string
          id: string
          issues_json: Json
          object_id: string | null
          recommended_fixes_json: Json
          run_id: string | null
          status: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          issues_json?: Json
          object_id?: string | null
          recommended_fixes_json?: Json
          run_id?: string | null
          status: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          issues_json?: Json
          object_id?: string | null
          recommended_fixes_json?: Json
          run_id?: string | null
          status?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qa_reports_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "aether_objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_reports_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_reports_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      runs: {
        Row: {
          created_at: string
          finished_at: string | null
          id: string
          input_json: Json
          output_json: Json
          project_id: string | null
          qa_status: string | null
          run_type: string
          started_at: string | null
          status: string
          summary: string | null
          title: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          finished_at?: string | null
          id?: string
          input_json?: Json
          output_json?: Json
          project_id?: string | null
          qa_status?: string | null
          run_type: string
          started_at?: string | null
          status?: string
          summary?: string | null
          title?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          finished_at?: string | null
          id?: string
          input_json?: Json
          output_json?: Json
          project_id?: string | null
          qa_status?: string | null
          run_type?: string
          started_at?: string | null
          status?: string
          summary?: string | null
          title?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "runs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          user_id: string
          value_json: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          user_id: string
          value_json?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          user_id?: string
          value_json?: Json
        }
        Relationships: []
      }
      social_collections: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          name: string
          owner_user_id: string
          post_ids: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name: string
          owner_user_id: string
          post_ids?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name?: string
          owner_user_id?: string
          post_ids?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      social_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_comment_id: string | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "social_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts: {
        Row: {
          allow_comments: boolean
          allow_remix: boolean
          allow_store_link: boolean
          author_user_id: string
          content: string
          created_at: string
          id: string
          linked_object_id: string | null
          linked_object_type: string | null
          post_type: string
          qa_notes: Json
          qa_status: string
          store_item_id: string | null
          tags: string[]
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          allow_comments?: boolean
          allow_remix?: boolean
          allow_store_link?: boolean
          author_user_id: string
          content?: string
          created_at?: string
          id?: string
          linked_object_id?: string | null
          linked_object_type?: string | null
          post_type?: string
          qa_notes?: Json
          qa_status?: string
          store_item_id?: string | null
          tags?: string[]
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          allow_comments?: boolean
          allow_remix?: boolean
          allow_store_link?: boolean
          author_user_id?: string
          content?: string
          created_at?: string
          id?: string
          linked_object_id?: string | null
          linked_object_type?: string | null
          post_type?: string
          qa_notes?: Json
          qa_status?: string
          store_item_id?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      social_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      social_publish_audits: {
        Row: {
          action: string
          blocked_reasons: Json
          created_at: string
          id: string
          linked_object_id: string | null
          metadata: Json
          post_id: string | null
          qa_status: string
          safety_status: string
          user_id: string
          visibility: string
        }
        Insert: {
          action: string
          blocked_reasons?: Json
          created_at?: string
          id?: string
          linked_object_id?: string | null
          metadata?: Json
          post_id?: string | null
          qa_status?: string
          safety_status?: string
          user_id: string
          visibility: string
        }
        Update: {
          action?: string
          blocked_reasons?: Json
          created_at?: string
          id?: string
          linked_object_id?: string | null
          metadata?: Json
          post_id?: string | null
          qa_status?: string
          safety_status?: string
          user_id?: string
          visibility?: string
        }
        Relationships: []
      }
      social_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      version_records: {
        Row: {
          change_type: string
          created_at: string
          data_json: Json
          id: string
          summary: string | null
          target_id: string | null
          target_type: string
          user_id: string
          version: number
          workspace_id: string
        }
        Insert: {
          change_type: string
          created_at?: string
          data_json?: Json
          id?: string
          summary?: string | null
          target_id?: string | null
          target_type: string
          user_id: string
          version: number
          workspace_id: string
        }
        Update: {
          change_type?: string
          created_at?: string
          data_json?: Json
          id?: string
          summary?: string | null
          target_id?: string | null
          target_type?: string
          user_id?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "version_records_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      webxxm_packages: {
        Row: {
          capability_id: string | null
          enabled_at: string | null
          id: string
          installed_at: string | null
          manifest_json: Json
          name: string
          package_id: string
          status: string
          updated_at: string
          user_id: string
          version: string | null
          workspace_id: string
        }
        Insert: {
          capability_id?: string | null
          enabled_at?: string | null
          id?: string
          installed_at?: string | null
          manifest_json?: Json
          name: string
          package_id: string
          status?: string
          updated_at?: string
          user_id: string
          version?: string | null
          workspace_id: string
        }
        Update: {
          capability_id?: string | null
          enabled_at?: string | null
          id?: string
          installed_at?: string | null
          manifest_json?: Json
          name?: string
          package_id?: string
          status?: string
          updated_at?: string
          user_id?: string
          version?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webxxm_packages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_founder: { Args: { _user_id: string }; Returns: boolean }
      owns_workspace: { Args: { _ws: string }; Returns: boolean }
    }
    Enums: {
      app_role: "normal_user" | "advanced_user" | "founder" | "admin"
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
      app_role: ["normal_user", "advanced_user", "founder", "admin"],
    },
  },
} as const
