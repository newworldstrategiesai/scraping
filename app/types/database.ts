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
      opt_outs: {
        Row: {
          id: string;
          phone_number: string;
          date: string | null;
          source: string | null;
        };
        Insert: {
          id?: string;
          phone_number: string;
          date?: string | null;
          source?: string | null;
        };
        Update: {
          phone_number?: string;
          date?: string | null;
          source?: string | null;
        };
      };
      warm_leads: {
        Row: {
          id: string;
          phone_number: string;
          full_name: string | null;
          address: string | null;
          first_reply_text: string | null;
          reply_time: string | null;
          source_campaign: string | null;
        };
        Insert: {
          id?: string;
          phone_number: string;
          full_name?: string | null;
          address?: string | null;
          first_reply_text?: string | null;
          reply_time?: string | null;
          source_campaign?: string | null;
        };
        Update: {
          phone_number?: string;
          full_name?: string | null;
          address?: string | null;
          first_reply_text?: string | null;
          reply_time?: string | null;
          source_campaign?: string | null;
        };
      };
      list_metadata: {
        Row: {
          id: string;
          name: string;
          list_type: string;
          source: string;
          source_identifier: string | null;
          row_count: number | null;
          last_updated_at: string | null;
          updated_by_job_id: string | null;
        };
        Insert: {
          id: string;
          name: string;
          list_type: string;
          source?: string;
          source_identifier?: string | null;
          row_count?: number | null;
          last_updated_at?: string | null;
          updated_by_job_id?: string | null;
        };
        Update: {
          name?: string;
          list_type?: string;
          source?: string;
          source_identifier?: string | null;
          row_count?: number | null;
          last_updated_at?: string | null;
          updated_by_job_id?: string | null;
        };
      };
      list_preview: {
        Row: {
          list_id: string;
          rows: Json;
          updated_at: string | null;
        };
        Insert: {
          list_id: string;
          rows?: Json;
          updated_at?: string | null;
        };
        Update: {
          rows?: Json;
          updated_at?: string | null;
        };
      };
      contact_notes: {
        Row: {
          id: string;
          phone_number: string;
          note: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          phone_number: string;
          note: string;
          created_at?: string | null;
        };
        Update: {
          phone_number?: string;
          note?: string;
          created_at?: string | null;
        };
      };
      sms_cell_list_rows: {
        Row: {
          id: string;
          phone_number: string;
          full_name: string | null;
          address: string | null;
          source_address: string | null;
          lead_type: string | null;
          resident_type: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          phone_number: string;
          full_name?: string | null;
          address?: string | null;
          source_address?: string | null;
          lead_type?: string | null;
          resident_type?: string | null;
          created_at?: string | null;
        };
        Update: {
          phone_number?: string;
          full_name?: string | null;
          address?: string | null;
          source_address?: string | null;
          lead_type?: string | null;
          resident_type?: string | null;
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
export type OptOut = Database["public"]["Tables"]["opt_outs"]["Row"];
export type OptOutInsert = Database["public"]["Tables"]["opt_outs"]["Insert"];
export type WarmLead = Database["public"]["Tables"]["warm_leads"]["Row"];
export type WarmLeadInsert = Database["public"]["Tables"]["warm_leads"]["Insert"];
export type ListMetadata = Database["public"]["Tables"]["list_metadata"]["Row"];
export type ListPreview = Database["public"]["Tables"]["list_preview"]["Row"];
export type ContactNote = Database["public"]["Tables"]["contact_notes"]["Row"];
export type ContactNoteInsert = Database["public"]["Tables"]["contact_notes"]["Insert"];
export type SmsCellListRow = Database["public"]["Tables"]["sms_cell_list_rows"]["Row"];
