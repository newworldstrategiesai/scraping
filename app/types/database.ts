export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      app_config: {
        Row: {
          id: string;
          company_name: string | null;
          message_template: string | null;
          sms_delay_sec: number | null;
          include_unknown_phone_type: boolean | null;
          addresses_csv_name: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          company_name?: string | null;
          message_template?: string | null;
          sms_delay_sec?: number | null;
          include_unknown_phone_type?: boolean | null;
          addresses_csv_name?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          company_name?: string | null;
          message_template?: string | null;
          sms_delay_sec?: number | null;
          include_unknown_phone_type?: boolean | null;
          addresses_csv_name?: string | null;
          updated_at?: string | null;
        };
      };
      jobs: {
        Row: {
          id: string;
          action: string;
          payload: Json;
          status: "pending" | "running" | "success" | "failed";
          created_at: string | null;
          started_at: string | null;
          finished_at: string | null;
          log: string | null;
          error: string | null;
        };
        Insert: {
          id?: string;
          action: string;
          payload?: Json;
          status?: "pending" | "running" | "success" | "failed";
          created_at?: string | null;
          started_at?: string | null;
          finished_at?: string | null;
          log?: string | null;
          error?: string | null;
        };
        Update: {
          action?: string;
          payload?: Json;
          status?: "pending" | "running" | "success" | "failed";
          started_at?: string | null;
          finished_at?: string | null;
          log?: string | null;
          error?: string | null;
        };
      };
      form_submissions: {
        Row: {
          id: string;
          name: string | null;
          phone: string | null;
          address: string | null;
          email: string | null;
          message: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name?: string | null;
          phone?: string | null;
          address?: string | null;
          email?: string | null;
          message?: string | null;
          created_at?: string | null;
        };
        Update: {
          name?: string | null;
          phone?: string | null;
          address?: string | null;
          email?: string | null;
          message?: string | null;
          created_at?: string | null;
        };
      };
    };
  };
}

export type AppConfig = Database["public"]["Tables"]["app_config"]["Row"];
export type Job = Database["public"]["Tables"]["jobs"]["Row"];
export type JobInsert = Database["public"]["Tables"]["jobs"]["Insert"];
export type FormSubmission = Database["public"]["Tables"]["form_submissions"]["Row"];
export type FormSubmissionInsert = Database["public"]["Tables"]["form_submissions"]["Insert"];
