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
      ativos: {
        Row: {
          arquivo_url: string | null
          categoria: string
          cliente_id: string | null
          created_at: string
          eh_extra: boolean
          id: string
          link_entrega: string | null
          nome: string
          prazo: string | null
          projeto_id: string | null
          refacoes: number
          servico_id: string | null
          status: string
          updated_at: string
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          arquivo_url?: string | null
          categoria?: string
          cliente_id?: string | null
          created_at?: string
          eh_extra?: boolean
          id?: string
          link_entrega?: string | null
          nome: string
          prazo?: string | null
          projeto_id?: string | null
          refacoes?: number
          servico_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          arquivo_url?: string | null
          categoria?: string
          cliente_id?: string | null
          created_at?: string
          eh_extra?: boolean
          id?: string
          link_entrega?: string | null
          nome?: string
          prazo?: string | null
          projeto_id?: string | null
          refacoes?: number
          servico_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ativos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ativos_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ativos_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ativos_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          apelido: string | null
          briefing_checklist: Json
          created_at: string
          drive_url: string | null
          id: string
          logo_url: string | null
          manual_marca_url: string | null
          nome: string
          paleta_cores: Json
          updated_at: string
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          apelido?: string | null
          briefing_checklist?: Json
          created_at?: string
          drive_url?: string | null
          id?: string
          logo_url?: string | null
          manual_marca_url?: string | null
          nome: string
          paleta_cores?: Json
          updated_at?: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          apelido?: string | null
          briefing_checklist?: Json
          created_at?: string
          drive_url?: string | null
          id?: string
          logo_url?: string | null
          manual_marca_url?: string | null
          nome?: string
          paleta_cores?: Json
          updated_at?: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      campanhas: {
        Row: {
          canal: string | null
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          id: string
          meta_leads: number | null
          nome: string
          notas: string | null
          status: string
          tipo: string
          updated_at: string
          budget: number | null
          workspace_id: string
        }
        Insert: {
          canal?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          meta_leads?: number | null
          nome: string
          notas?: string | null
          status?: string
          tipo?: string
          updated_at?: string
          budget?: number | null
          workspace_id: string
        }
        Update: {
          canal?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          meta_leads?: number | null
          nome?: string
          notas?: string | null
          status?: string
          tipo?: string
          updated_at?: string
          budget?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campanhas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_pages: {
        Row: {
          cliente_id: string | null
          conteudo: Json | null
          created_at: string
          id: string
          nome: string
          slug: string
          status: string
          template_id: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          cliente_id?: string | null
          conteudo?: Json | null
          created_at?: string
          id?: string
          nome: string
          slug: string
          status?: string
          template_id: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          cliente_id?: string | null
          conteudo?: Json | null
          created_at?: string
          id?: string
          nome?: string
          slug?: string
          status?: string
          template_id?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "landing_pages_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landing_pages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          cidade: string | null
          cliente_id: string | null
          created_at: string
          estado: string | null
          faturamento_est: string | null
          id: string
          instagram: string | null
          linkedin: string | null
          nome: string
          notas: string | null
          num_funcionarios: string | null
          segmento: string | null
          tags: Json | null
          telefone: string | null
          updated_at: string
          user_id: string | null
          website: string | null
          workspace_id: string
        }
        Insert: {
          cidade?: string | null
          cliente_id?: string | null
          created_at?: string
          estado?: string | null
          faturamento_est?: string | null
          id?: string
          instagram?: string | null
          linkedin?: string | null
          nome: string
          notas?: string | null
          num_funcionarios?: string | null
          segmento?: string | null
          tags?: Json | null
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
          workspace_id: string
        }
        Update: {
          cidade?: string | null
          cliente_id?: string | null
          created_at?: string
          estado?: string | null
          faturamento_est?: string | null
          id?: string
          instagram?: string | null
          linkedin?: string | null
          nome?: string
          notas?: string | null
          num_funcionarios?: string | null
          segmento?: string | null
          tags?: Json | null
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "empresas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empresas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
          payload: Json | null
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          cargo: string | null
          created_at: string
          email: string | null
          empresa_id: string | null
          id: string
          nome: string
          notas: string | null
          origem: string | null
          score: number | null
          status: string
          tags: Json | null
          telefone: string | null
          temperatura: string
          ultimo_contato: string | null
          updated_at: string
          user_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          workspace_id: string
        }
        Insert: {
          cargo?: string | null
          created_at?: string
          email?: string | null
          empresa_id?: string | null
          id?: string
          nome: string
          notas?: string | null
          origem?: string | null
          score?: number | null
          status?: string
          tags?: Json | null
          telefone?: string | null
          temperatura?: string
          ultimo_contato?: string | null
          updated_at?: string
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          workspace_id: string
        }
        Update: {
          cargo?: string | null
          created_at?: string
          email?: string | null
          empresa_id?: string | null
          id?: string
          nome?: string
          notas?: string | null
          origem?: string | null
          score?: number | null
          status?: string
          tags?: Json | null
          telefone?: string | null
          temperatura?: string
          ultimo_contato?: string | null
          updated_at?: string
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      marca_dna: {
        Row: {
          cliente_id: string | null
          concorrentes: Json | null
          created_at: string
          diferenciais: string | null
          emojis_permitidos: boolean | null
          id: string
          linha_editorial: string | null
          media_engajamento: number | null
          melhor_formato: string | null
          melhor_horario: string | null
          missao: string | null
          palavras_chave: Json | null
          palavras_proibidas: Json | null
          persona_primaria: Json | null
          persona_secundaria: Json | null
          posicionamento: string | null
          tom_voz: string | null
          updated_at: string
          valores: string | null
          visao: string | null
          workspace_id: string
        }
        Insert: {
          cliente_id?: string | null
          concorrentes?: Json | null
          created_at?: string
          diferenciais?: string | null
          emojis_permitidos?: boolean | null
          id?: string
          linha_editorial?: string | null
          media_engajamento?: number | null
          melhor_formato?: string | null
          melhor_horario?: string | null
          missao?: string | null
          palavras_chave?: Json | null
          palavras_proibidas?: Json | null
          persona_primaria?: Json | null
          persona_secundaria?: Json | null
          posicionamento?: string | null
          tom_voz?: string | null
          updated_at?: string
          valores?: string | null
          visao?: string | null
          workspace_id: string
        }
        Update: {
          cliente_id?: string | null
          concorrentes?: Json | null
          created_at?: string
          diferenciais?: string | null
          emojis_permitidos?: boolean | null
          id?: string
          linha_editorial?: string | null
          media_engajamento?: number | null
          melhor_formato?: string | null
          melhor_horario?: string | null
          missao?: string | null
          palavras_chave?: Json | null
          palavras_proibidas?: Json | null
          persona_primaria?: Json | null
          persona_secundaria?: Json | null
          posicionamento?: string | null
          tom_voz?: string | null
          updated_at?: string
          valores?: string | null
          visao?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marca_dna_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marca_dna_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      oportunidades: {
        Row: {
          created_at: string
          data_fechamento: string | null
          data_fechamento_est: string | null
          descricao: string | null
          empresa_id: string | null
          id: string
          lead_id: string | null
          motivo_perda: string | null
          notas: string | null
          probabilidade: number | null
          projeto_id: string | null
          stage_id: string | null
          tipo_servico: string | null
          titulo: string
          updated_at: string
          user_id: string | null
          valor: number | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          data_fechamento?: string | null
          data_fechamento_est?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          lead_id?: string | null
          motivo_perda?: string | null
          notas?: string | null
          probabilidade?: number | null
          projeto_id?: string | null
          stage_id?: string | null
          tipo_servico?: string | null
          titulo: string
          updated_at?: string
          user_id?: string | null
          valor?: number | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          data_fechamento?: string | null
          data_fechamento_est?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          lead_id?: string | null
          motivo_perda?: string | null
          notas?: string | null
          probabilidade?: number | null
          projeto_id?: string | null
          stage_id?: string | null
          tipo_servico?: string | null
          titulo?: string
          updated_at?: string
          user_id?: string | null
          valor?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oportunidades_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_stages: {
        Row: {
          cor: string | null
          created_at: string
          id: string
          nome: string
          ordem: number
          tipo: string
          workspace_id: string
        }
        Insert: {
          cor?: string | null
          created_at?: string
          id?: string
          nome: string
          ordem?: number
          tipo?: string
          workspace_id: string
        }
        Update: {
          cor?: string | null
          created_at?: string
          id?: string
          nome?: string
          ordem?: number
          tipo?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      projetos: {
        Row: {
          briefing_checklist: Json | null
          briefing_completo: boolean
          cliente_id: string
          created_at: string
          descricao: string | null
          id: string
          nome: string
          status: string
          updated_at: string
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          briefing_checklist?: Json | null
          briefing_completo?: boolean
          cliente_id: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          status?: string
          updated_at?: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          briefing_checklist?: Json | null
          briefing_completo?: boolean
          cliente_id?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projetos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projetos_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      servicos: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          nome: string
          updated_at: string
          user_id: string | null
          valor_base: number
          workspace_id: string | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
          user_id?: string | null
          valor_base?: number
          workspace_id?: string | null
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
          user_id?: string | null
          valor_base?: number
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "servicos_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          cor_primaria: string | null
          created_at: string
          id: string
          logo_url: string | null
          nome: string
          plano: string
          segmento: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          cor_primaria?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          nome: string
          plano?: string
          segmento?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          cor_primaria?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          nome?: string
          plano?: string
          segmento?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
