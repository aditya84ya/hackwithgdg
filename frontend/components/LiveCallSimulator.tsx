import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, PhoneOff, Activity, Phone, User, Building, MapPin, MoreVertical, Loader, Bot } from 'lucide-react';
// import { GoogleGenAI, Modality, Type as SchemaType } from "@google/genai"; // Removed for backend integration
import { Lead, AgentConfig, CallLog } from '../types';
import { SupabaseService } from '../services/SupabaseService';

interface LiveClientState {
  connected: boolean;
  speaking: boolean;
  connecting: boolean;
}

interface CallCenterProps {
  leads?: Lead[];
  agents?: AgentConfig[];
  onUpdateStatus?: (id: string, status: Lead['status']) => void;
}

const LiveCallSimulator: React.FC<CallCenterProps> = ({ leads = [], agents = [], onUpdateStatus }) => {
  const [state, setState] = useState<LiveClientState>({ connected: false, speaking: false, connecting: false });
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(agents[0]?.id || '');
  const [logs, setLogs] = useState<string[]>([]);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  
  // Manual Call State
  const [showManualCallModal, setShowManualCallModal] = useState(false);
  const [manualLead, setManualLead] = useState({ name: '', phone: '', businessName: '' });

  const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  useEffect(() => {
    if (agents.length > 0 && !agents.find(a => a.id === selectedAgentId)) {
      setSelectedAgentId(agents[0].id);
    }
  }, [agents, selectedAgentId]);

  const startCall = async (lead: Lead) => {
    setActiveLead(lead);
    setState(s => ({ ...s, connecting: true }));
    addLog(`Initiating outbound call to ${lead.phone || 'Unknown'} via Twilio...`);
    
    // Log call start to Supabase
    try {
        const newCall = await SupabaseService.logCall({
            lead_id: lead.id,
            started_at: new Date().toISOString(),
            status: 'ongoing',
            summary: 'Call initiated'
        });
        setCurrentCallId(newCall.id || null);
    } catch (err) {
        console.error("Failed to log call start:", err);
    }
    
    // Call Backend
    try {
        // Get selected agent config
        const selectedAgent = agents.find(a => a.id === selectedAgentId);
        
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5050'}/outbound-call`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phoneNumber: lead.phone, 
                leadId: lead.id,
                agentId: selectedAgentId,
                // Pass agent configuration
                voice: selectedAgent?.voiceId || 'terrence',
                systemPrompt: selectedAgent?.script?.replace('{customer_name}', lead.name).replace('{business_name}', lead.businessName) || undefined,
                languageHint: selectedAgent?.languageStyle === 'Formal Tamil' ? 'ta-IN' : 'en-US'
            })
        });

        const data = await response.json();
        
        if (data.success) {
            addLog(`Call Initiated! SID: ${data.callSid}`);
            setState(s => ({ ...s, connecting: false, connected: true })); 
        } else {
            addLog(`Error: ${data.error}`);
            setState(s => ({ ...s, connecting: false }));
            alert("Failed to place call: " + data.error);
        }

    } catch (e) {
        addLog(`Backend Connection Failed: ${e}`);
        setState(s => ({ ...s, connecting: false }));
    }
  };

  const finalizeCall = async () => {
    setState({ connected: false, speaking: false, connecting: false });
    setActiveLead(null);
    if (currentCallId) {
        try {
            await SupabaseService.updateCall(currentCallId, {
                ended_at: new Date().toISOString(),
                status: 'completed',
                summary: logs.join('\n')
            });
        } catch (err) {
            console.error("Failed to finalize call log:", err);
        }
    }
  };

  const endCall = async () => {
    addLog("Ending call session...");
    
    // Call backend to terminate call via Twilio
    if (activeLead?.phone) {
        try {
            await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5050'}/end-call`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber: activeLead.phone })
            });
            addLog("Call termination validation sent.");
        } catch (e) {
            console.error("Failed to terminate call remotely:", e);
        }
    }
    
    finalizeCall();
  };

  const handleManualCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualLead.name || !manualLead.phone) {
      alert("Name and Phone Number are required.");
      return;
    }

    try {
      addLog(`Creating manual lead for ${manualLead.name}...`);
      const newLead = await SupabaseService.addLead({

        name: manualLead.name,
        businessName: manualLead.businessName || 'Manual Call',
        phone: manualLead.phone,
        status: 'New',
        source: 'Manual',
        address: '',
        email: '',
        notes: 'Manual call entry'
      });
      
      setShowManualCallModal(false);
      setManualLead({ name: '', phone: '', businessName: '' });
      await startCall(newLead);
      
    } catch (error) {
      console.error("Failed to create manual lead:", error);
      alert("Failed to create manual lead. See console for details.");
    }
  };

  // --- Render ---

  if (activeLead) {
    const activeAgent = agents.find(a => a.id === selectedAgentId);
    return (
      <div className="h-full flex flex-col bg-slate-900 text-white relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-10">
            <div>
               <h2 className="text-2xl font-bold">{activeLead.businessName}</h2>
               <p className="text-slate-400 text-lg">{activeLead.name}</p>
               <div className="flex items-center gap-2 mt-2 text-green-400 bg-green-900/30 px-3 py-1 rounded-full w-fit">
                  <Activity className="w-4 h-4 animate-pulse" />
                  <span className="text-xs font-bold tracking-wider">SIP TRUNK ACTIVE</span>
               </div>
            </div>
            <div className="text-right">
               <div className="text-3xl font-mono">{state.connected ? "ON CALL" : "DIALING..."}</div>
               <p className="text-slate-500 text-sm">Twilio Voice Gateway</p>
               <div className="text-xs text-slate-600 mt-1">Agent: {activeAgent?.name}</div>
            </div>
         </div>

         <div className="flex-1 flex items-center justify-center relative">
            {state.connecting && (
               <div className="flex flex-col items-center gap-4">
                  <Loader className="w-16 h-16 animate-spin text-blue-500" />
                  <p className="text-blue-400 font-mono animate-pulse">Establishing Secure Connection...</p>
               </div>
            )}
            
            {!state.connecting && (
              <div className={`relative flex items-center justify-center transition-all duration-300 ${state.speaking ? 'scale-125' : 'scale-100'}`}>
                 <div className={`absolute w-80 h-80 bg-blue-500/20 rounded-full blur-3xl ${state.speaking ? 'animate-pulse' : ''}`} />
                 <div className="w-48 h-48 rounded-full border-4 border-slate-700 bg-slate-800 flex items-center justify-center shadow-2xl relative z-10">
                    <User className="w-20 h-20 text-slate-500" />
                    {state.speaking && <div className="absolute inset-0 border-4 border-blue-500 rounded-full animate-ping opacity-20" />}
                 </div>
                 <div className="absolute -bottom-12 text-slate-400 font-mono text-sm animate-pulse">
                    Thinking...
                 </div>
              </div>
            )}
         </div>

         <div className="p-8 pb-12 flex justify-center gap-6 bg-slate-950/50 backdrop-blur-md">
            <button className="p-5 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700">
               <MicOff className="w-6 h-6" />
            </button>
            <button 
              onClick={endCall}
              className="px-10 py-5 bg-red-600 hover:bg-red-500 text-white rounded-full font-bold text-lg shadow-lg shadow-red-900/50 flex items-center gap-3"
            >
               <PhoneOff className="w-6 h-6" />
               End Call
            </button>
         </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col relative">
      <div className="mb-8 flex justify-between items-end">
        <div>
           <h1 className="text-3xl font-bold text-slate-900 mb-2">Call Center</h1>
           <p className="text-slate-500">Manage active leads and initiate AI voice calls.</p>
        </div>
        <div className="flex flex-col items-end gap-3">
           <div className="flex items-center gap-3">
             <button 
               onClick={() => setShowManualCallModal(true)}
               className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm transition-colors text-sm font-medium"
             >
               <Phone className="w-4 h-4" />
               Manual Call
             </button>

             {agents.length > 0 && (
               <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                 <Bot className="w-4 h-4 text-blue-600 ml-2" />
                 <select 
                   value={selectedAgentId} 
                   onChange={(e) => setSelectedAgentId(e.target.value)}
                   className="text-sm font-medium text-slate-700 bg-transparent border-none focus:ring-0 cursor-pointer py-1 pr-2"
                 >
                   {agents.map(a => (
                     <option key={a.id} value={a.id}>{a.name} ({a.tone})</option>
                   ))}
                 </select>
               </div>
             )}
           </div>
           <div className="flex gap-2 text-sm text-slate-500">
             <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Twilio Gateway Online</span>
           </div>
        </div>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Lead Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Business</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.length === 0 ? (
                <tr>
                   <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No leads found. Use the <strong>Lead Finder</strong> to add prospects.
                   </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                          {lead.name.charAt(0)}
                        </div>
                        <span className="font-medium text-slate-900">{lead.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2 text-slate-600">
                          <Building className="w-4 h-4 text-slate-400" />
                          {lead.businessName}
                       </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                        lead.status === 'New' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        lead.status === 'Contacted' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        'bg-green-50 text-green-600 border-green-100'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-sm">
                      {lead.phone || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => startCall(lead)}
                          className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-500 shadow-sm shadow-green-200 transition-all active:scale-95"
                          title="Call via Twilio"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="mt-auto border-t border-slate-100 bg-slate-50 px-6 py-3 text-xs text-slate-400 flex justify-between">
           <span>Showing {leads.length} leads</span>
           {logs.length > 0 && <span className="font-mono text-blue-500">{logs[logs.length-1]}</span>}
        </div>
      </div>

      {/* Manual Call Modal */}
      {showManualCallModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-96 transform transition-all animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Manual Call Entry</h3>
            <form onSubmit={handleManualCall} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  value={manualLead.name}
                  onChange={e => setManualLead(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Doe"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={manualLead.phone}
                  onChange={e => setManualLead(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Business Name (Optional)</label>
                <input
                  type="text"
                  value={manualLead.businessName}
                  onChange={e => setManualLead(prev => ({ ...prev, businessName: e.target.value }))}
                  placeholder="Acme Corp"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualCallModal(false)}
                  className="flex-1 py-2 px-4 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-md transition-all active:scale-95 flex justify-center items-center gap-2"
                >
                   <Phone className="w-4 h-4" />
                   Call Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveCallSimulator;
