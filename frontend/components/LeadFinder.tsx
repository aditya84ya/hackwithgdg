import React, { useState, useEffect } from 'react';
import { Search, MapPin, Loader2, Building2, Check, Plus, Phone, User } from 'lucide-react';
import { findLeadsWithMaps } from '../utils/gemini';
import { Lead } from '../types';

interface GroundingChunk {
  web?: { uri: string; title: string };
  maps?: {
    placeId: string;
    title: string;
    uri: string;
  };
}

interface LeadFinderProps {
  onAddLead?: (lead: Lead) => void;
}

const LeadFinder: React.FC<LeadFinderProps> = ({ onAddLead }) => {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [results, setResults] = useState<{ text: string; chunks: GroundingChunk[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [selectedChunk, setSelectedChunk] = useState<GroundingChunk | null>(null);
  const [manualPhone, setManualPhone] = useState('');
  const [manualName, setManualName] = useState('Manager');

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error(err)
      );
    }
  }, []);

  const handleSearch = async () => {
    if (!query || !location) return;
    setLoading(true);
    try {
      const data = await findLeadsWithMaps(query, location);
      setResults(data as any);
      setAddedIds(new Set()); // Reset added state on new search
    } catch (error) {
      alert("Error finding leads. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const initiateAddLead = (chunk: GroundingChunk) => {
    setSelectedChunk(chunk);
    setManualPhone(''); 
    setManualName('Manager');
  };

  const confirmAddLead = () => {
    if (!selectedChunk?.maps || !onAddLead) return;

    const newLead: Lead = {
        id: crypto.randomUUID(),
        name: manualName,
        businessName: selectedChunk.maps.title,
        address: 'Extracted from Maps',
        phone: manualPhone,
        email: '',
        status: 'New',
        source: 'Maps'
    };

    onAddLead(newLead);
    setAddedIds(prev => new Set(prev).add(selectedChunk.maps!.placeId));
    setSelectedChunk(null);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Lead Finder</h1>
        <p className="text-slate-500">Find business leads in your area using Gemini Maps Grounding.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
        <label className="block text-sm font-medium text-slate-700 mb-2">Search Criteria</label>
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., 'Pizza restaurants in San Francisco' or 'Law firms nearby'"
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !location}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
            Find Leads
          </button>
        </div>
        {!location && <p className="text-xs text-amber-600 mt-2">Waiting for location access...</p>}
      </div>

      {results && (
        <div className="space-y-6">
           <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
             <h3 className="font-semibold text-blue-900 mb-2">AI Summary</h3>
             <p className="text-blue-800 leading-relaxed">{results.text}</p>
           </div>

           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
             {/* Table Header */}
             <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
               <div className="col-span-5">Business</div>
               <div className="col-span-5">Details</div>
               <div className="col-span-2 text-right">Action</div>
             </div>

             {/* Table Rows */}
             <div className="divide-y divide-slate-50">
               {results.chunks.map((chunk, idx) => {
                 if (!chunk.maps) return null;
                 const isAdded = addedIds.has(chunk.maps.placeId);
                 
                 return (
                   <div key={idx} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-50 transition-colors items-center">
                     {/* Business Column */}
                     <div className="col-span-5">
                       <div className="flex items-start gap-3">
                         <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0 mt-0.5">
                           <Building2 className="w-5 h-5" />
                         </div>
                         <div>
                           <h4 className="font-semibold text-slate-900 text-sm">{chunk.maps.title}</h4>
                           <a 
                             href={chunk.maps.uri} 
                             target="_blank" 
                             rel="noreferrer"
                             className="text-xs text-blue-500 hover:text-blue-700 hover:underline flex items-center gap-1 mt-0.5"
                           >
                             <MapPin className="w-3 h-3" />
                             View on Maps
                           </a>
                         </div>
                       </div>
                     </div>

                     {/* Details Column */}
                     <div className="col-span-5">
                        <div className="text-sm text-slate-600">
                          {chunk.web?.title ? (
                            <span className="line-clamp-2">{chunk.web.title}</span>
                          ) : (
                             <span className="text-slate-400 italic">No additional details available</span>
                          )}
                        </div>
                     </div>

                     {/* Action Column */}
                     <div className="col-span-2 flex justify-end">
                       <button 
                          onClick={() => initiateAddLead(chunk)}
                         disabled={isAdded}
                         className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                           isAdded 
                             ? 'bg-green-50 text-green-700 border border-green-200 cursor-default' 
                             : 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm hover:shadow active:scale-95'
                         }`}
                       >
                         {isAdded ? <><Check className="w-4 h-4" /> Added</> : <><Plus className="w-4 h-4" /> Add</>}
                       </button>
                     </div>
                   </div>
                 );
               })}
             </div>
           </div>
        </div>
      )}

      {selectedChunk && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                <h3 className="text-xl font-bold mb-4">Add Lead Details</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Business</label>
                        <div className="text-slate-900 font-semibold">{selectedChunk.maps?.title}</div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Contact Name</label>
                        <div className="relative">
                            <input 
                                type="text"
                                value={manualName}
                                onChange={e => setManualName(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Manager / Owner"
                            />
                            <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                        <div className="relative">
                             <input 
                                type="text"
                                value={manualPhone}
                                onChange={e => setManualPhone(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="+91 98..."
                                autoFocus
                            />
                            <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Check the AI summary for phone numbers.</p>
                    </div>
                </div>
                <div className="flex gap-3 mt-6">
                    <button 
                        onClick={() => setSelectedChunk(null)}
                        className="flex-1 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-medium"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={confirmAddLead}
                        className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
                    >
                        Save Lead
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default LeadFinder;