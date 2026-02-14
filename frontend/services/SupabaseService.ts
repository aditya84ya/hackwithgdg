import { createClient } from '@supabase/supabase-js';
import { Lead, CallLog, AgentConfig, CallHistoryItem } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const hasValidConfig = supabaseUrl && supabaseAnonKey && 
  supabaseUrl !== 'your_supabase_url_here' && 
  supabaseAnonKey !== 'your_supabase_anon_key_here';

if (!hasValidConfig) {
  console.warn('⚠️ Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
}

export const supabase = hasValidConfig 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any;

export const SupabaseService = {
  async getLeads(): Promise<Lead[]> {
    if (!supabase) {
      console.warn('Supabase not configured, returning empty leads array');
      return [];
    }
    
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leads:', error);
      throw error;
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      businessName: item.business_name,
      address: item.address,
      phone: item.phone,
      email: item.email,
      status: item.status,
      notes: item.notes,
      source: item.source
    }));
  },

  async addLead(lead: Omit<Lead, 'id'>): Promise<Lead> {
    const dbLead = {
      // id is auto-generated if not provided, but here we might prefer to let DB generate it unless we want to use the one from LeadFinder
      // Since LeadFinder generates a UUID, we can use it, or let Supabase generate one.
      // LeadFinder: id: crypto.randomUUID()
      // Let's use the ID if provided, or clean it up.
      name: lead.name,
      business_name: lead.businessName,
      address: lead.address,
      phone: lead.phone,
      email: lead.email,
      status: lead.status,
      notes: lead.notes,
      source: lead.source
    };

    const { data, error } = await supabase
      .from('leads')
      .insert([dbLead])
      .select()
      .single();

    if (error) {
      console.error('Error adding lead:', error);
      throw error;
    }

    return {
        id: data.id,
        name: data.name,
        businessName: data.business_name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        status: data.status,
        notes: data.notes,
        source: data.source
    };
  },

  async updateLeadStatus(id: string, status: Lead['status']): Promise<void> {
    const { error } = await supabase
      .from('leads')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Error updating lead status:', error);
      throw error;
    }
  },
  async updateLead(id: string, updates: Partial<Lead>): Promise<void> {
    const { error } = await supabase
      .from('leads')
      .update({
        name: updates.name,
        business_name: updates.businessName,
        address: updates.address,
        phone: updates.phone,
        email: updates.email,
        status: updates.status,
        notes: updates.notes,
        source: updates.source
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating lead:', error);
      throw error;
    }
  },

  async logCall(call: CallLog): Promise<CallLog> {
    const { data, error } = await supabase
      .from('calls')
      .insert([{
        lead_id: call.lead_id,
        started_at: call.started_at,
        ended_at: call.ended_at,
        duration_seconds: call.duration_seconds,
        summary: call.summary,
        status: call.status
      }])
      .select()
      .single();

    if (error) {
      console.error('Error logging call:', error);
      throw error;
    }

    return data;
  },

  async updateCall(id: string, updates: Partial<CallLog>): Promise<void> {
    const { error } = await supabase
      .from('calls')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating call:', error);
      throw error;
    }
  },

  async getCalls(): Promise<CallHistoryItem[]> {
    if (!supabase) {
      console.warn('Supabase not configured, returning empty calls array');
      return [];
    }
    
    const { data, error } = await supabase
      .from('calls')
      .select(`
        id,
        ultravox_call_id,
        started_at,
        duration_seconds,
        summary,
        status,
        leads (
          name,
          business_name
        )
      `)
      .order('started_at', { ascending: false });

    if (error) {
      console.error('Error fetching calls:', error);
      throw error;
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      ultravox_call_id: item.ultravox_call_id,
      started_at: item.started_at,
      duration_seconds: item.duration_seconds || 0,
      summary: item.summary,
      status: item.status,
      lead_name: item.leads?.name,
      lead_business: item.leads?.business_name
    }));
  },

  // ==================== AGENT OPERATIONS ====================

  async getAgents(): Promise<AgentConfig[]> {
    if (!supabase) {
      console.warn('Supabase not configured, returning empty agents array');
      return [];
    }
    
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching agents:', error);
      throw error;
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      tone: item.tone,
      script: item.script,
      voiceId: item.voice_id,
      voiceSpeed: item.voice_speed ? parseFloat(item.voice_speed) : 1.0,
      languageStyle: item.language_style
    }));
  },

  async addAgent(agent: AgentConfig): Promise<AgentConfig> {
    const dbAgent = {
      name: agent.name,
      tone: agent.tone,
      script: agent.script,
      voice_id: agent.voiceId,
      voice_speed: agent.voiceSpeed || 1.0,
      language_style: agent.languageStyle || 'Tanglish',
      is_active: true
    };

    const { data, error } = await supabase
      .from('agents')
      .insert([dbAgent])
      .select()
      .single();

    if (error) {
      console.error('Error adding agent:', error);
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      tone: data.tone,
      script: data.script,
      voiceId: data.voice_id,
      voiceSpeed: data.voice_speed ? parseFloat(data.voice_speed) : 1.0,
      languageStyle: data.language_style
    };
  },

  async updateAgent(id: string, updates: Partial<AgentConfig>): Promise<void> {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.tone !== undefined) dbUpdates.tone = updates.tone;
    if (updates.script !== undefined) dbUpdates.script = updates.script;
    if (updates.voiceId !== undefined) dbUpdates.voice_id = updates.voiceId;
    if (updates.voiceSpeed !== undefined) dbUpdates.voice_speed = updates.voiceSpeed;
    if (updates.languageStyle !== undefined) dbUpdates.language_style = updates.languageStyle;

    const { error } = await supabase
      .from('agents')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating agent:', error);
      throw error;
    }
  },

  async deleteAgent(id: string): Promise<void> {
    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('agents')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Error deleting agent:', error);
      throw error;
    }
  }
};
