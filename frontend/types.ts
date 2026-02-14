export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN'
}

export enum NavSection {
  AGENTS = 'Agent Editor',
  LEADS = 'Lead Management',
  DASHBOARD = 'Dashboard',
  CALL_CENTER = 'Call Center',
  CALL_HISTORY = 'Call History',
  SETTINGS = 'Settings'
}

export interface Lead {
  id: string;
  name: string; // Contact Person
  businessName: string;
  address?: string;
  phone: string;
  email: string;
  status: 'New' | 'Contacted' | 'Interested' | 'Not Interested' | 'Scheduled';
  notes?: string;
  source?: 'Maps' | 'Manual' | 'Upload';
}

export interface VoiceProfile {
  id: string;
  name: string;
  gender: 'Male' | 'Female';
  accent: string;
  language: string;
  tags: string[];
  previewUrl?: string; // Placeholder for actual audio file
  avatarColor: string;
}

export interface AgentConfig {
  id: string;
  name: string;
  tone: 'Friendly' | 'Professional' | 'Assertive';
  script: string;
  voiceId: string;
  voiceSpeed?: number;
  languageStyle?: 'Tanglish' | 'Formal Tamil' | 'Casual Chennai';
}

export interface CallLog {
  id?: string;
  lead_id: string;
  started_at: string;
  ended_at?: string;
  duration_seconds?: number;
  summary?: string;
  status: 'completed' | 'missed' | 'failed' | 'ongoing';
}

export interface CallHistoryItem {
  id: string;
  ultravox_call_id?: string;
  started_at: string;
  duration_seconds: number;
  summary?: string;
  status: 'completed' | 'missed' | 'failed' | 'ongoing';
  agent_name?: string;
  lead_name?: string;
  lead_business?: string;
}