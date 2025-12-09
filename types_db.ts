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
    PostgrestVersion: "12.2.0 (ec89f6b)"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          password_hash: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          password_hash: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          password_hash?: string
        }
        Relationships: []
      }
      contact_forms: {
        Row: {
          created_at: string | null
          custom_description: string | null
          custom_title: string | null
          fields: Json
          id: string
          name: string
          redirect_link: string | null
          send_email: boolean | null
          success_message: string | null
          updated_at: string | null
          user_id: string
          webhook_url: string | null
        }
        Insert: {
          created_at?: string | null
          custom_description?: string | null
          custom_title?: string | null
          fields: Json
          id?: string
          name: string
          redirect_link?: string | null
          send_email?: boolean | null
          success_message?: string | null
          updated_at?: string | null
          user_id: string
          webhook_url?: string | null
        }
        Update: {
          created_at?: string | null
          custom_description?: string | null
          custom_title?: string | null
          fields?: Json
          id?: string
          name?: string
          redirect_link?: string | null
          send_email?: boolean | null
          success_message?: string | null
          updated_at?: string | null
          user_id?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_forms_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_limits"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "contact_forms_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_forms_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          id: string
          stripe_customer_id: string | null
        }
        Insert: {
          id: string
          stripe_customer_id?: string | null
        }
        Update: {
          id?: string
          stripe_customer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "user_limits"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "customers_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      form_submissions: {
        Row: {
          data: Json
          form_id: string
          id: string
          internal_note: string | null
          ip_address: unknown | null
          is_archived: boolean
          spam_flag: boolean | null
          submitted_at: string | null
          user_agent: string | null
          webhook_data: Json | null
        }
        Insert: {
          data: Json
          form_id: string
          id?: string
          internal_note?: string | null
          ip_address?: unknown | null
          is_archived?: boolean
          spam_flag?: boolean | null
          submitted_at?: string | null
          user_agent?: string | null
          webhook_data?: Json | null
        }
        Update: {
          data?: Json
          form_id?: string
          id?: string
          internal_note?: string | null
          ip_address?: unknown | null
          is_archived?: boolean
          spam_flag?: boolean | null
          submitted_at?: string | null
          user_agent?: string | null
          webhook_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "contact_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      page_contact_forms: {
        Row: {
          background_color: string | null
          border_color: string | null
          border_radius: string | null
          button_background_color: string | null
          button_border_color: string | null
          button_border_radius: string | null
          button_border_width: string | null
          button_font_size: string | null
          button_font_weight: string | null
          button_hover_background_color: string | null
          button_padding: string | null
          button_text_color: string | null
          created_at: string | null
          description_color: string | null
          description_custom_text: string | null
          description_size: string | null
          display_mode: string | null
          error_font_size: string | null
          error_text_color: string | null
          form_id: string
          id: string
          input_background_color: string | null
          input_border_color: string | null
          input_border_radius: string | null
          input_focus_border_color: string | null
          input_padding: string | null
          input_text_color: string | null
          label_color: string | null
          label_font_size: string | null
          label_font_weight: string | null
          padding: string | null
          page_id: number
          placeholder_text_color: string | null
          show_description: boolean | null
          show_title: boolean | null
          success_background_color: string | null
          success_border_color: string | null
          success_button_background_color: string | null
          success_button_hover_background_color: string | null
          success_button_text_color: string | null
          success_text_color: string | null
          success_title_color: string | null
          title_color: string | null
          title_custom_text: string | null
          title_size: string | null
        }
        Insert: {
          background_color?: string | null
          border_color?: string | null
          border_radius?: string | null
          button_background_color?: string | null
          button_border_color?: string | null
          button_border_radius?: string | null
          button_border_width?: string | null
          button_font_size?: string | null
          button_font_weight?: string | null
          button_hover_background_color?: string | null
          button_padding?: string | null
          button_text_color?: string | null
          created_at?: string | null
          description_color?: string | null
          description_custom_text?: string | null
          description_size?: string | null
          display_mode?: string | null
          error_font_size?: string | null
          error_text_color?: string | null
          form_id: string
          id?: string
          input_background_color?: string | null
          input_border_color?: string | null
          input_border_radius?: string | null
          input_focus_border_color?: string | null
          input_padding?: string | null
          input_text_color?: string | null
          label_color?: string | null
          label_font_size?: string | null
          label_font_weight?: string | null
          padding?: string | null
          page_id: number
          placeholder_text_color?: string | null
          show_description?: boolean | null
          show_title?: boolean | null
          success_background_color?: string | null
          success_border_color?: string | null
          success_button_background_color?: string | null
          success_button_hover_background_color?: string | null
          success_button_text_color?: string | null
          success_text_color?: string | null
          success_title_color?: string | null
          title_color?: string | null
          title_custom_text?: string | null
          title_size?: string | null
        }
        Update: {
          background_color?: string | null
          border_color?: string | null
          border_radius?: string | null
          button_background_color?: string | null
          button_border_color?: string | null
          button_border_radius?: string | null
          button_border_width?: string | null
          button_font_size?: string | null
          button_font_weight?: string | null
          button_hover_background_color?: string | null
          button_padding?: string | null
          button_text_color?: string | null
          created_at?: string | null
          description_color?: string | null
          description_custom_text?: string | null
          description_size?: string | null
          display_mode?: string | null
          error_font_size?: string | null
          error_text_color?: string | null
          form_id?: string
          id?: string
          input_background_color?: string | null
          input_border_color?: string | null
          input_border_radius?: string | null
          input_focus_border_color?: string | null
          input_padding?: string | null
          input_text_color?: string | null
          label_color?: string | null
          label_font_size?: string | null
          label_font_weight?: string | null
          padding?: string | null
          page_id?: number
          placeholder_text_color?: string | null
          show_description?: boolean | null
          show_title?: boolean | null
          success_background_color?: string | null
          success_border_color?: string | null
          success_button_background_color?: string | null
          success_button_hover_background_color?: string | null
          success_button_text_color?: string | null
          success_text_color?: string | null
          success_title_color?: string | null
          title_color?: string | null
          title_custom_text?: string | null
          title_size?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_contact_forms_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "contact_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_contact_forms_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          accent_color_override: string | null
          background_image: string | null
          contact_form_id: string | null
          created_at: string | null
          custom_path: string
          font_override: string | null
          header_image_styles: Json | null
          header_image_url: string | null
          headline_and_paragraph_styles: Json | null
          id: number
          intro_copy: string | null
          link_global_styles: Json | null
          links: Json | null
          muso_stats_config: Json | null
          page_background_color: string | null
          page_headline: string | null
          page_metadata: Json | null
          page_name: string | null
          player_id: number | null
          previous_path: string | null
          show_branding: boolean | null
          social_link_styles: Json | null
          social_links: Json | null
          text_color: string | null
          user_branding_name: string | null
          user_id: string
        }
        Insert: {
          accent_color_override?: string | null
          background_image?: string | null
          contact_form_id?: string | null
          created_at?: string | null
          custom_path?: string
          font_override?: string | null
          header_image_styles?: Json | null
          header_image_url?: string | null
          headline_and_paragraph_styles?: Json | null
          id?: number
          intro_copy?: string | null
          link_global_styles?: Json | null
          links?: Json | null
          muso_stats_config?: Json | null
          page_background_color?: string | null
          page_headline?: string | null
          page_metadata?: Json | null
          page_name?: string | null
          player_id?: number | null
          previous_path?: string | null
          show_branding?: boolean | null
          social_link_styles?: Json | null
          social_links?: Json | null
          text_color?: string | null
          user_branding_name?: string | null
          user_id: string
        }
        Update: {
          accent_color_override?: string | null
          background_image?: string | null
          contact_form_id?: string | null
          created_at?: string | null
          custom_path?: string
          font_override?: string | null
          header_image_styles?: Json | null
          header_image_url?: string | null
          headline_and_paragraph_styles?: Json | null
          id?: number
          intro_copy?: string | null
          link_global_styles?: Json | null
          links?: Json | null
          muso_stats_config?: Json | null
          page_background_color?: string | null
          page_headline?: string | null
          page_metadata?: Json | null
          page_name?: string | null
          player_id?: number | null
          previous_path?: string | null
          show_branding?: boolean | null
          social_link_styles?: Json | null
          social_links?: Json | null
          text_color?: string | null
          user_branding_name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pages_contact_form_id_fkey"
            columns: ["contact_form_id"]
            isOneToOne: false
            referencedRelation: "contact_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pages_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_limits"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "pages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      player_songs: {
        Row: {
          created_at: string
          id: number
          mixflip_enabled: boolean
          order: number | null
          player_id: number
          song_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          mixflip_enabled?: boolean
          order?: number | null
          player_id: number
          song_id: number
        }
        Update: {
          created_at?: string
          id?: number
          mixflip_enabled?: boolean
          order?: number | null
          player_id?: number
          song_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "player_songs_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_songs_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          accent_color: string
          after_audio_label: string
          after_button_active_color: string | null
          after_button_inactive_color: string | null
          after_text_color: string | null
          after_text_color_active: string | null
          after_text_color_inactive: string | null
          artist_name_color: string | null
          auto_advance: boolean
          background_color: string
          before_audio_label: string
          before_button_active_color: string | null
          before_button_inactive_color: string | null
          before_text_color: string | null
          before_text_color_active: string | null
          before_text_color_inactive: string | null
          created_at: string
          default_to_after: boolean
          description: string | null
          description_color: string | null
          font_family: string | null
          foreground_neutral: string
          global_artwork: string | null
          header_layout: Json | null
          id: number
          mobile_artwork_position: string | null
          play_button_background_color: string | null
          play_button_border_color: string | null
          play_pause_icon_color: string | null
          player_border_color: string | null
          player_name: string
          player_type: string
          playhead_background_color: string | null
          playhead_progress_color: string | null
          playlist_background_color: string | null
          playlist_border_color: string | null
          playlist_divider_color: string | null
          playlist_layout_order: string | null
          playlist_order: Json | null
          playlist_selected_track_text_color: string | null
          playlist_text_color: string | null
          public_path: string
          selected_track_color: string | null
          show_artwork: boolean
          show_artwork_mobile: boolean
          show_branding: boolean
          song_name_color: string | null
          text_color: string
          theme: string
          toggle_border_color: string | null
          user_id: string
        }
        Insert: {
          accent_color?: string
          after_audio_label?: string
          after_button_active_color?: string | null
          after_button_inactive_color?: string | null
          after_text_color?: string | null
          after_text_color_active?: string | null
          after_text_color_inactive?: string | null
          artist_name_color?: string | null
          auto_advance?: boolean
          background_color?: string
          before_audio_label?: string
          before_button_active_color?: string | null
          before_button_inactive_color?: string | null
          before_text_color?: string | null
          before_text_color_active?: string | null
          before_text_color_inactive?: string | null
          created_at?: string
          default_to_after?: boolean
          description?: string | null
          description_color?: string | null
          font_family?: string | null
          foreground_neutral?: string
          global_artwork?: string | null
          header_layout?: Json | null
          id?: number
          mobile_artwork_position?: string | null
          play_button_background_color?: string | null
          play_button_border_color?: string | null
          play_pause_icon_color?: string | null
          player_border_color?: string | null
          player_name: string
          player_type?: string
          playhead_background_color?: string | null
          playhead_progress_color?: string | null
          playlist_background_color?: string | null
          playlist_border_color?: string | null
          playlist_divider_color?: string | null
          playlist_layout_order?: string | null
          playlist_order?: Json | null
          playlist_selected_track_text_color?: string | null
          playlist_text_color?: string | null
          public_path?: string
          selected_track_color?: string | null
          show_artwork?: boolean
          show_artwork_mobile?: boolean
          show_branding?: boolean
          song_name_color?: string | null
          text_color?: string
          theme?: string
          toggle_border_color?: string | null
          user_id: string
        }
        Update: {
          accent_color?: string
          after_audio_label?: string
          after_button_active_color?: string | null
          after_button_inactive_color?: string | null
          after_text_color?: string | null
          after_text_color_active?: string | null
          after_text_color_inactive?: string | null
          artist_name_color?: string | null
          auto_advance?: boolean
          background_color?: string
          before_audio_label?: string
          before_button_active_color?: string | null
          before_button_inactive_color?: string | null
          before_text_color?: string | null
          before_text_color_active?: string | null
          before_text_color_inactive?: string | null
          created_at?: string
          default_to_after?: boolean
          description?: string | null
          description_color?: string | null
          font_family?: string | null
          foreground_neutral?: string
          global_artwork?: string | null
          header_layout?: Json | null
          id?: number
          mobile_artwork_position?: string | null
          play_button_background_color?: string | null
          play_button_border_color?: string | null
          play_pause_icon_color?: string | null
          player_border_color?: string | null
          player_name?: string
          player_type?: string
          playhead_background_color?: string | null
          playhead_progress_color?: string | null
          playlist_background_color?: string | null
          playlist_border_color?: string | null
          playlist_divider_color?: string | null
          playlist_layout_order?: string | null
          playlist_order?: Json | null
          playlist_selected_track_text_color?: string | null
          playlist_text_color?: string | null
          public_path?: string
          selected_track_color?: string | null
          show_artwork?: boolean
          show_artwork_mobile?: boolean
          show_branding?: boolean
          song_name_color?: string | null
          text_color?: string
          theme?: string
          toggle_border_color?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_players_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_limits"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_players_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_players_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_limits"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "players_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      prices: {
        Row: {
          active: boolean | null
          currency: string | null
          description: string | null
          id: string
          interval: Database["public"]["Enums"]["pricing_plan_interval"] | null
          interval_count: number | null
          metadata: Json | null
          product_id: string | null
          trial_period_days: number | null
          type: Database["public"]["Enums"]["pricing_type"] | null
          unit_amount: number | null
        }
        Insert: {
          active?: boolean | null
          currency?: string | null
          description?: string | null
          id: string
          interval?: Database["public"]["Enums"]["pricing_plan_interval"] | null
          interval_count?: number | null
          metadata?: Json | null
          product_id?: string | null
          trial_period_days?: number | null
          type?: Database["public"]["Enums"]["pricing_type"] | null
          unit_amount?: number | null
        }
        Update: {
          active?: boolean | null
          currency?: string | null
          description?: string | null
          id?: string
          interval?: Database["public"]["Enums"]["pricing_plan_interval"] | null
          interval_count?: number | null
          metadata?: Json | null
          product_id?: string | null
          trial_period_days?: number | null
          type?: Database["public"]["Enums"]["pricing_type"] | null
          unit_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean | null
          allow_wav: boolean
          audio_size_limit: number
          classic_audio_size_limit: number | null
          description: string | null
          id: string
          image: string | null
          metadata: Json | null
          name: string
          player_limit: number | null
          quickclip_limit: number
          quickclip_size_limit: number
          require_branding: boolean | null
          song_limit: number | null
        }
        Insert: {
          active?: boolean | null
          allow_wav?: boolean
          audio_size_limit?: number
          classic_audio_size_limit?: number | null
          description?: string | null
          id: string
          image?: string | null
          metadata?: Json | null
          name?: string
          player_limit?: number | null
          quickclip_limit?: number
          quickclip_size_limit?: number
          require_branding?: boolean | null
          song_limit?: number | null
        }
        Update: {
          active?: boolean | null
          allow_wav?: boolean
          audio_size_limit?: number
          classic_audio_size_limit?: number | null
          description?: string | null
          id?: string
          image?: string | null
          metadata?: Json | null
          name?: string
          player_limit?: number | null
          quickclip_limit?: number
          quickclip_size_limit?: number
          require_branding?: boolean | null
          song_limit?: number | null
        }
        Relationships: []
      }
      quick_clips: {
        Row: {
          created_at: string | null
          duration_seconds: number | null
          id: number
          name: string
          order: number | null
          player_id: number | null
          r2_key: string
          size_bytes: number
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          duration_seconds?: number | null
          id?: number
          name: string
          order?: number | null
          player_id?: number | null
          r2_key: string
          size_bytes: number
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number | null
          id?: number
          name?: string
          order?: number | null
          player_id?: number | null
          r2_key?: string
          size_bytes?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quick_clips_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quick_clips_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_limits"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "quick_clips_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quick_clips_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      song_folders: {
        Row: {
          created_at: string | null
          folder_name: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          folder_name: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          folder_name?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      songs: {
        Row: {
          after_audio_url: string | null
          album_artwork_url: string | null
          artist: string | null
          before_audio_url: string | null
          classic_audio_url: string | null
          created_at: string
          folder_id: string | null
          id: number
          song_description: string | null
          song_name: string
          song_type: string
          user_id: string
        }
        Insert: {
          after_audio_url?: string | null
          album_artwork_url?: string | null
          artist?: string | null
          before_audio_url?: string | null
          classic_audio_url?: string | null
          created_at?: string
          folder_id?: string | null
          id?: number
          song_description?: string | null
          song_name: string
          song_type?: string
          user_id?: string
        }
        Update: {
          after_audio_url?: string | null
          album_artwork_url?: string | null
          artist?: string | null
          before_audio_url?: string | null
          classic_audio_url?: string | null
          created_at?: string
          folder_id?: string | null
          id?: number
          song_description?: string | null
          song_name?: string
          song_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_songs_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_limits"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_songs_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_songs_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "songs_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "song_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "songs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_limits"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "songs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "songs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_archive: {
        Row: {
          cancel_at: string | null
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created: string | null
          current_period_end: string | null
          current_period_start: string | null
          ended_at: string | null
          id: string
          metadata: Json | null
          price_id: string | null
          quantity: number | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          trial_end: string | null
          trial_start: string | null
          user_id: string | null
        }
        Insert: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          ended_at?: string | null
          id: string
          metadata?: Json | null
          price_id?: string | null
          quantity?: number | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          trial_end?: string | null
          trial_start?: string | null
          user_id?: string | null
        }
        Update: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          price_id?: string | null
          quantity?: number | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          trial_end?: string | null
          trial_start?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at: string | null
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created: string
          current_period_end: string
          current_period_start: string
          ended_at: string | null
          id: string
          metadata: Json | null
          price_id: string | null
          quantity: number | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          trial_end: string | null
          trial_start: string | null
          user_id: string
        }
        Insert: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created?: string
          current_period_end?: string
          current_period_start?: string
          ended_at?: string | null
          id: string
          metadata?: Json | null
          price_id?: string | null
          quantity?: number | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          trial_end?: string | null
          trial_start?: string | null
          user_id: string
        }
        Update: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created?: string
          current_period_end?: string
          current_period_start?: string
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          price_id?: string | null
          quantity?: number | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          trial_end?: string | null
          trial_start?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_limits"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_limits"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          affiliate_program_code: string | null
          avatar_url: string | null
          billing_address: Json | null
          full_name: string | null
          has_active_subscription: boolean | null
          has_payment_method: boolean | null
          id: string
          landing_page_count: number
          muso_profile_id: string | null
          player_count: number
          referral_code: string | null
          song_count: number
          weekly_digest_email: boolean
        }
        Insert: {
          affiliate_program_code?: string | null
          avatar_url?: string | null
          billing_address?: Json | null
          full_name?: string | null
          has_active_subscription?: boolean | null
          has_payment_method?: boolean | null
          id: string
          landing_page_count?: number
          muso_profile_id?: string | null
          player_count?: number
          referral_code?: string | null
          song_count?: number
          weekly_digest_email?: boolean
        }
        Update: {
          affiliate_program_code?: string | null
          avatar_url?: string | null
          billing_address?: Json | null
          full_name?: string | null
          has_active_subscription?: boolean | null
          has_payment_method?: boolean | null
          id?: string
          landing_page_count?: number
          muso_profile_id?: string | null
          player_count?: number
          referral_code?: string | null
          song_count?: number
          weekly_digest_email?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      user_limits: {
        Row: {
          current_player_count: number | null
          current_song_count: number | null
          full_name: string | null
          player_limit: number | null
          song_limit: number | null
          user_id: string | null
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          has_active_subscription: boolean | null
          id: string | null
        }
        Insert: {
          has_active_subscription?: boolean | null
          id?: string | null
        }
        Update: {
          has_active_subscription?: boolean | null
          id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      archive_canceled_subscriptions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      decrement_landing_page_count: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      increment_landing_page_count: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      pricing_plan_interval: "day" | "week" | "month" | "year"
      pricing_type: "one_time" | "recurring"
      subscription_status:
        | "trialing"
        | "active"
        | "canceled"
        | "incomplete"
        | "incomplete_expired"
        | "past_due"
        | "unpaid"
        | "paused"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      pricing_plan_interval: ["day", "week", "month", "year"],
      pricing_type: ["one_time", "recurring"],
      subscription_status: [
        "trialing",
        "active",
        "canceled",
        "incomplete",
        "incomplete_expired",
        "past_due",
        "unpaid",
        "paused",
      ],
    },
  },
} as const
