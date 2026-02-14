import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import LeadFinder from './components/LeadFinder';
import LeadList from './components/LeadList';
import LiveCallSimulator from './components/LiveCallSimulator';
import AgentEditor from './components/AgentEditor';
import CallHistory from './components/CallHistory';
import { NavSection, Lead, AgentConfig, CallHistoryItem } from './types';
import { SupabaseService } from './services/SupabaseService';

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<NavSection>(NavSection.DASHBOARD);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [calls, setCalls] = useState<CallHistoryItem[]>([]);
  const [loadingCalls, setLoadingCalls] = useState(false);

  useEffect(() => {
    fetchLeads();
    fetchAgents();
    fetchCalls();
  }, []);

  const fetchLeads = async () => {
    setLoadingLeads(true);
    try {
      const data = await SupabaseService.getLeads();
      setLeads(data);
    } catch (error) {
      console.error("Failed to fetch leads", error);
    } finally {
      setLoadingLeads(false);
    }
  };

  const fetchAgents = async () => {
    setLoadingAgents(true);
    try {
      const data = await SupabaseService.getAgents();
      setAgents(data);
    } catch (error) {
      console.error("Failed to fetch agents", error);
    } finally {
      setLoadingAgents(false);
    }
  };

  const fetchCalls = async () => {
    setLoadingCalls(true);
    try {
      const data = await SupabaseService.getCalls();
      setCalls(data);
    } catch (error) {
      console.error("Failed to fetch calls", error);
    } finally {
      setLoadingCalls(false);
    }
  };

  const handleAddLead = async (lead: Lead) => {
    try {
      const newLead = await SupabaseService.addLead(lead);
      setLeads(prev => [newLead, ...prev]);
    } catch (error) {
      console.error("Failed to add lead", error);
      alert("Failed to save lead to database.");
    }
  };

  const handleUpdateLeadStatus = async (id: string, status: Lead['status']) => {
    try {
      await SupabaseService.updateLeadStatus(id, status);
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    } catch (error) {
       console.error("Failed to update lead status", error);
    }
  };

  // Agent handlers
  const handleAddAgent = async (agent: AgentConfig): Promise<AgentConfig | null> => {
    try {
      const newAgent = await SupabaseService.addAgent(agent);
      setAgents(prev => [newAgent, ...prev]);
      return newAgent;
    } catch (error) {
      console.error("Failed to add agent", error);
      alert("Failed to save agent to database.");
      return null;
    }
  };

  const handleUpdateAgent = async (agent: AgentConfig) => {
    try {
      await SupabaseService.updateAgent(agent.id, agent);
      setAgents(prev => prev.map(a => a.id === agent.id ? agent : a));
    } catch (error) {
      console.error("Failed to update agent", error);
      alert("Failed to update agent.");
    }
  };

  const handleDeleteAgent = async (id: string) => {
    try {
      await SupabaseService.deleteAgent(id);
      setAgents(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      console.error("Failed to delete agent", error);
      alert("Failed to delete agent.");
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case NavSection.DASHBOARD:
        return <Dashboard />;
      case NavSection.LEADS:
        return (
          <div className="pb-12">
            <LeadFinder onAddLead={handleAddLead} />
            <div className="max-w-7xl mx-auto px-8">
              <LeadList leads={leads} loading={loadingLeads} />
            </div>
          </div>
        );
      case NavSection.CALL_CENTER:
        return <LiveCallSimulator leads={leads} agents={agents} onUpdateStatus={handleUpdateLeadStatus} />;
      case NavSection.CALL_HISTORY:
        return <CallHistory calls={calls} loading={loadingCalls} />;
      case NavSection.AGENTS:
        return (
          <AgentEditor 
            agents={agents} 
            loading={loadingAgents}
            onAddAgent={handleAddAgent}
            onUpdateAgent={handleUpdateAgent}
            onDeleteAgent={handleDeleteAgent}
          />
        );
      default:
        return (
          <div className="p-8 text-center text-slate-500">
             <h2 className="text-2xl font-bold mb-4">Coming Soon</h2>
             <p>The {activeSection} module is currently under development.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeSection={activeSection} onNavigate={setActiveSection} />
      <main className="flex-1 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;