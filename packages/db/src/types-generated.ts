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
      attendance: {
        Row: {
          company_id: string
          created_at: string
          day_status: number[]
          employee_id: string
          id: string
          month_date: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          day_status?: number[]
          employee_id: string
          id?: string
          month_date: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          day_status?: number[]
          employee_id?: string
          id?: string
          month_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "leave_balance"
            referencedColumns: ["employee_id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          company_id: string
          created_at: string
          diff: Json | null
          entity: string
          entity_id: string | null
          id: number
          ip: unknown
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          company_id: string
          created_at?: string
          diff?: Json | null
          entity: string
          entity_id?: string | null
          id?: number
          ip?: unknown
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          company_id?: string
          created_at?: string
          diff?: Json | null
          entity?: string
          entity_id?: string | null
          id?: number
          ip?: unknown
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_prices: {
        Row: {
          amount_try: number
          created_at: string
          id: string
          interval: string | null
          is_active: boolean | null
          plan: string
          stripe_price_id: string
        }
        Insert: {
          amount_try: number
          created_at?: string
          id?: string
          interval?: string | null
          is_active?: boolean | null
          plan: string
          stripe_price_id: string
        }
        Update: {
          amount_try?: number
          created_at?: string
          id?: string
          interval?: string | null
          is_active?: boolean | null
          plan?: string
          stripe_price_id?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          created_at: string
          employee_quota: number
          id: string
          name: string
          plan: string
          slug: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_quota?: number
          id?: string
          name: string
          plan?: string
          slug: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_quota?: number
          id?: string
          name?: string
          plan?: string
          slug?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      departments: {
        Row: {
          company_id: string
          created_at: string
          id: string
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          employee_id: string
          id: string
          pdf_path: string | null
          signed_content_hash: string | null
          status: string
          template_id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          employee_id: string
          id?: string
          pdf_path?: string | null
          signed_content_hash?: string | null
          status?: string
          template_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          employee_id?: string
          id?: string
          pdf_path?: string | null
          signed_content_hash?: string | null
          status?: string
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "leave_balance"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "documents_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          company_id: string
          contract_end: string | null
          created_at: string
          created_by: string | null
          department_id: string | null
          email: string | null
          first_name: string
          full_name: string | null
          gender: string | null
          id: string
          last_name: string
          phone: string | null
          salary: number | null
          start_date: string
          status: string
          tc_kimlik_enc: string | null
          total_leave_days: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          company_id: string
          contract_end?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          email?: string | null
          first_name: string
          full_name?: string | null
          gender?: string | null
          id?: string
          last_name: string
          phone?: string | null
          salary?: number | null
          start_date: string
          status?: string
          tc_kimlik_enc?: string | null
          total_leave_days?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          company_id?: string
          contract_end?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          email?: string | null
          first_name?: string
          full_name?: string | null
          gender?: string | null
          id?: string
          last_name?: string
          phone?: string | null
          salary?: number | null
          start_date?: string
          status?: string
          tc_kimlik_enc?: string | null
          total_leave_days?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          accepted_at: string | null
          company_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          company_id: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          company_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invites_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_due_try: number
          amount_paid_try: number | null
          company_id: string
          created_at: string
          currency: string | null
          id: string
          invoice_pdf_url: string | null
          paid_at: string | null
          status: string
          stripe_invoice_id: string | null
        }
        Insert: {
          amount_due_try: number
          amount_paid_try?: number | null
          company_id: string
          created_at?: string
          currency?: string | null
          id?: string
          invoice_pdf_url?: string | null
          paid_at?: string | null
          status?: string
          stripe_invoice_id?: string | null
        }
        Update: {
          amount_due_try?: number
          amount_paid_try?: number | null
          company_id?: string
          created_at?: string
          currency?: string | null
          id?: string
          invoice_pdf_url?: string | null
          paid_at?: string | null
          status?: string
          stripe_invoice_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      leaves: {
        Row: {
          approver_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          days: number | null
          employee_id: string
          end_date: string
          id: string
          note: string | null
          start_date: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          approver_id?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          days?: number | null
          employee_id: string
          end_date: string
          id?: string
          note?: string | null
          start_date: string
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          approver_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          days?: number | null
          employee_id?: string
          end_date?: string
          id?: string
          note?: string | null
          start_date?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaves_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaves_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaves_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaves_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaves_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "leave_balance"
            referencedColumns: ["employee_id"]
          },
        ]
      }
      notifications: {
        Row: {
          company_id: string
          created_at: string
          id: string
          payload: Json | null
          read_at: string | null
          type: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          payload?: Json | null
          read_at?: string | null
          type: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          payload?: Json | null
          read_at?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
      profiles: {
        Row: {
          company_id: string
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          role: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean
          role?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      public_holidays: {
        Row: {
          country: string
          created_at: string
          date: string
          id: string
          name: string
        }
        Insert: {
          country?: string
          created_at?: string
          date: string
          id?: string
          name: string
        }
        Update: {
          country?: string
          created_at?: string
          date?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          company_id: string
          created_at: string
          current_period_end: string | null
          id: string
          status: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          current_period_end?: string | null
          id?: string
          status?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          current_period_end?: string | null
          id?: string
          status?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          company_id: string
          content: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          company_id: string
          content: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          content?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      leave_balance: {
        Row: {
          company_id: string | null
          employee_id: string | null
          full_name: string | null
          remaining_days: number | null
          total_leave_days: number | null
          used_days: number | null
        }
        Insert: {
          company_id?: string | null
          employee_id?: string | null
          full_name?: string | null
          remaining_days?: never
          total_leave_days?: number | null
          used_days?: never
        }
        Update: {
          company_id?: string | null
          employee_id?: string | null
          full_name?: string | null
          remaining_days?: never
          total_leave_days?: number | null
          used_days?: never
        }
        Relationships: [
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      attendance_month: {
        Args: { p_month: string }
        Returns: {
          day_status: number[]
          department_name: string
          employee_id: string
          employee_name: string
          id: string
        }[]
      }
      attendance_summary: {
        Args: { p_month: string }
        Returns: {
          _department: string
          came_count: number
          employee_id: string
          employee_name: string
          holiday_count: number
          leave_count: number
          other_count: number
          report_count: number
        }[]
      }
      audit_log: {
        Args: {
          p_action: string
          p_diff: Json
          p_entity: string
          p_entity_id: string
        }
        Returns: undefined
      }
      check_leave_overlap: {
        Args: {
          p_employee_id: string
          p_end: string
          p_exclude_leave_id?: string
          p_start: string
        }
        Returns: {
          days: number
          end_date: string
          leave_id: string
          start_date: string
          status: string
          type: string
        }[]
      }
      current_company_id: { Args: never; Returns: string }
      get_current_role: { Args: never; Returns: string }
      get_leave_balance: {
        Args: { p_employee_id: string }
        Returns: {
          pending_days: number
          remaining_days: number
          total_leave_days: number
          used_days: number
        }[]
      }
      is_staff: { Args: never; Returns: boolean }
      list_employees_with_stats: {
        Args: never
        Returns: {
          contract_end: string
          created_at: string
          department_id: string
          department_name: string
          email: string
          first_name: string
          full_name: string
          gender: string
          id: string
          last_name: string
          phone: string
          remaining_leave_days: number
          salary: number
          start_date: string
          status: string
          total_leave_days: number
          used_leave_days: number
        }[]
      }
      list_leaves_with_employee: {
        Args: {
          p_department_id?: string
          p_from?: string
          p_status?: string
          p_to?: string
          p_type?: string
        }
        Returns: {
          approver_id: string
          approver_name: string
          created_at: string
          days: number
          department_id: string
          department_name: string
          employee_id: string
          employee_name: string
          end_date: string
          id: string
          note: string
          start_date: string
          status: string
          type: string
        }[]
      }
      notify_user: {
        Args: { p_payload: Json; p_type: string; p_user_id: string }
        Returns: undefined
      }
      render_template: {
        Args: { p_employee_id: string; p_template_id: string }
        Returns: string
      }
      sign_up_company: {
        Args: {
          p_company_name: string
          p_company_slug: string
          p_full_name: string
        }
        Returns: string
      }
      tc_kimlik_decrypt: { Args: { p_enc: string }; Returns: string }
      tc_kimlik_encrypt: { Args: { p_raw: string }; Returns: string }
      upsert_attendance: {
        Args: { p_day_status: number[]; p_employee_id: string; p_month: string }
        Returns: string
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

