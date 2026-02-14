import React, { useState, useMemo } from 'react';
import { Filter, Search, Copy, Check, Phone, Clock } from 'lucide-react';
import { CallHistoryItem } from '../types';

import CallDetailPanel from './CallDetailPanel';

interface CallHistoryProps {
  calls: CallHistoryItem[];
  loading: boolean;
}

const CallHistory: React.FC<CallHistoryProps> = ({ calls, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(100);
  const [selectedCall, setSelectedCall] = useState<CallHistoryItem | null>(null);

  // Format duration as HH:MM:SS
  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format time as h:mm:ss am/pm
  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  // Get date label (Today, Yesterday, or actual date)
  const getDateLabel = (dateStr: string): string => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  // Group calls by date
  const groupedCalls = useMemo(() => {
    const filtered = calls.filter(call => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        call.summary?.toLowerCase().includes(search) ||
        call.ultravox_call_id?.toLowerCase().includes(search) ||
        call.lead_name?.toLowerCase().includes(search) ||
        call.lead_business?.toLowerCase().includes(search)
      );
    });

    const groups: { [key: string]: CallHistoryItem[] } = {};
    filtered.forEach(call => {
      const label = getDateLabel(call.started_at);
      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(call);
    });

    return groups;
  }, [calls, searchTerm]);

  // Pagination
  const totalCalls = Object.values(groupedCalls).flat().length;
  const totalPages = Math.ceil(totalCalls / perPage);

  // Copy to clipboard
  const handleCopy = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Truncate call ID for display
  const truncateId = (id: string): string => {
    return id.length > 8 ? `${id.slice(0, 8)}...` : id;
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
          <span>Loading call history...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Call History</h1>
        
        <div className="flex items-center gap-3">
          {/* Filter Button */}
          <button className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <Filter className="w-4 h-4" />
            <span className="text-sm">Filter</span>
          </button>
          
          {/* Search */}
          <div className="relative">
            {showSearch ? (
              <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden">
                <input
                  type="text"
                  placeholder="Search calls..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 text-sm outline-none w-64"
                  autoFocus
                />
                <button 
                  onClick={() => {
                    setShowSearch(false);
                    setSearchTerm('');
                  }}
                  className="px-3 py-2 text-slate-400 hover:text-slate-600"
                >
                  ×
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowSearch(true)}
                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <div className="col-span-2 flex items-center gap-1">
            Start Time
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
              <path d="M6 9L2 5h8L6 9z" />
            </svg>
          </div>
          <div className="col-span-2 flex items-center gap-1">
            Duration (Billed)
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
              <path d="M3 4h6v1H3V4zm0 3h6v1H3V7z" />
            </svg>
          </div>
          <div className="col-span-2">Agent</div>
          <div className="col-span-2">Call ID</div>
          <div className="col-span-4">Summary</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-slate-50">
          {Object.keys(groupedCalls).length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400">
              <Phone className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No calls found</p>
              <p className="text-sm mt-1">Call history will appear here once you make calls</p>
            </div>
          ) : (
            Object.entries(groupedCalls).map(([dateLabel, dateCalls]) => (
              <div key={dateLabel}>
                {/* Date Group Header */}
                <div className="px-6 py-3 bg-slate-50/50">
                  <span className="text-sm font-semibold text-slate-700">{dateLabel}</span>
                </div>
                
                {/* Calls for this date */}
                {dateCalls.map((call) => (
                  <div 
                    key={call.id}
                    onClick={() => setSelectedCall(call)}
                    className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors items-center cursor-pointer group"
                  >
                    {/* Start Time */}
                    <div className="col-span-2 text-sm text-slate-600">
                      {formatTime(call.started_at)}
                    </div>
                    
                    {/* Duration */}
                    <div className="col-span-2 text-sm text-slate-600 font-mono">
                      {formatDuration(call.duration_seconds)}
                    </div>
                    
                    {/* Agent */}
                    <div className="col-span-2 text-sm text-slate-600">
                      {call.lead_business || call.lead_name || '—'}
                    </div>
                    
                    {/* Call ID */}
                    <div className="col-span-2 flex items-center gap-2">
                      <span className="text-sm text-slate-600 font-mono">
                        {truncateId(call.ultravox_call_id || call.id)}
                      </span>
                      <button
                        onClick={(e) => handleCopy(e, call.ultravox_call_id || call.id)}
                        className="p-1 text-slate-400 hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100"
                        title="Copy Call ID"
                      >
                        {copiedId === (call.ultravox_call_id || call.id) ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    
                    {/* Summary */}
                    <div className="col-span-4 text-sm text-slate-600 truncate">
                      {call.summary || '—'}
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalCalls > 0 && (
        <div className="flex items-center justify-between mt-6 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <span>Showing</span>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="px-2 py-1 border border-slate-200 rounded-lg bg-white"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>per page</span>
          </div>
          
          <div className="flex items-center gap-1">
            <span>
              {Math.min((currentPage - 1) * perPage + 1, totalCalls)} – {Math.min(currentPage * perPage, totalCalls)} of {totalCalls}
            </span>
          </div>
        </div>
      )}

      {/* Call Detail Panel */}
      {selectedCall && (
        <CallDetailPanel 
          call={selectedCall} 
          onClose={() => setSelectedCall(null)} 
        />
      )}
    </div>
  );
};

export default CallHistory;
