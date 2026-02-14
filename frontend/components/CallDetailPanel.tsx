import React, { useEffect, useState, useRef } from 'react';
import { X, Play, Pause, MessageSquare, AlertCircle, Clock, Calendar, User, Globe } from 'lucide-react';
import { CallHistoryItem } from '../types';

interface CallDetailPanelProps {
  call: CallHistoryItem;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp?: string;
}

const CallDetailPanel: React.FC<CallDetailPanelProps> = ({ call, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState<string>("0:00");
  const [error, setError] = useState<string | null>(null);
  
  // Audio Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchCallDetails();
    
    // Reset audio state when call changes
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [call.id]);

  const fetchCallDetails = async () => {
    setLoading(true);
    setError(null);
    
    // Only attempt to fetch if we have an external Ultravox ID
    if (!call.ultravox_call_id) {
        setLoading(false);
        // We can still show what we have (summary from DB), but no transcript/recording
        return;
    }

    try {
      const callId = call.ultravox_call_id;
      const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5050';

      // Fetch Transcript
      const msgRes = await fetch(`${baseUrl}/calls/${callId}/messages`);
      if (msgRes.ok) {
        const msgData = await msgRes.json();
        if (msgData.results) {
            setMessages(msgData.results);
        } else if (Array.isArray(msgData)) {
            setMessages(msgData);
        }
      }

      // Fetch Recording
      const recRes = await fetch(`${baseUrl}/calls/${callId}/recording`);
      if (recRes.ok) {
        const recData = await recRes.json();
        
        if (recData.success && recData.recordingUrl) {
            setRecordingUrl(recData.recordingUrl);
        }
        
        if(recData.duration) {
            // Format duration to MM:SS if available from API
            const mins = Math.floor(recData.duration / 60);
            const secs = Math.floor(recData.duration % 60);
            setCallDuration(`${mins}:${secs.toString().padStart(2, '0')}`);
        }
      }

    } catch (err) {
      console.error("Failed to fetch call details", err);
      // Don't show critical error for missing details, just log it
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      if(!callDuration || callDuration === "0:00") {
          const mins = Math.floor(audioRef.current.duration / 60);
          const secs = Math.floor(audioRef.current.duration % 60);
          setCallDuration(`${mins}:${secs.toString().padStart(2, '0')}`);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add toast here
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/20 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-6 border-b border-slate-100 flex items-start justify-between bg-white">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-slate-900">
                {call.lead_business || call.lead_name || 'Unknown Lead'}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                call.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                call.status === 'ongoing' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                'bg-red-50 text-red-700 border-red-200'
              }`}>
                {call.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500 font-mono">
              <div className="flex items-center gap-1.5 group cursor-pointer" onClick={() => copyToClipboard(call.ultravox_call_id || call.id)}>
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <span className="group-hover:text-slate-700 transition-colors">ID: {call.ultravox_call_id || call.id}</span>
              </div>
              <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {new Date(call.started_at).toLocaleString()}
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
                <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                <p>Loading conversation details...</p>
             </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Summary Block */}
              {call.summary && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    Call Summary
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {call.summary}
                  </p>
                </div>
              )}

              {/* Audio Player */}
              {recordingUrl ? (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                   <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-sm font-semibold text-slate-900">Call Recording</h3>
                   </div>
                   
                   <audio 
                      ref={audioRef} 
                      src={recordingUrl} 
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onEnded={() => setIsPlaying(false)}
                   />

                   <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <button 
                        onClick={togglePlay}
                        className="w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-sm transition-all active:scale-95"
                      >
                        {isPlaying ? <Pause className="w-4 h-4" fill="currentColor" /> : <Play className="w-4 h-4 ml-0.5" fill="currentColor" />}
                      </button>
                      
                      <div className="flex-1 flex flex-col gap-1">
                         <div className="relative h-1.5 bg-slate-200 rounded-full w-full">
                           <div 
                              className="absolute top-0 left-0 h-full bg-blue-500 rounded-full pointer-events-none" 
                              style={{ width: `${(currentTime / duration) * 100}%` }}
                           />
                           <input 
                              type="range" 
                              min="0" 
                              max={duration || 100} 
                              value={currentTime} 
                              onChange={handleSeek}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                           />
                         </div>
                         <div className="flex justify-between items-center text-xs font-mono text-slate-500">
                             <span>{formatTime(currentTime)}</span>
                             <span>{callDuration || formatTime(duration)}</span>
                         </div>
                      </div>
                   </div>
                </div>
              ) : (
                <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 text-center text-slate-500 text-sm italic">
                  Recording not available for this call.
                </div>
              )}

              {/* Transcript */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="text-sm font-semibold text-slate-900">Transcript</h3>
                </div>
                <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                    {messages.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm">No transcript available.</div>
                    ) : (
                        messages
                        .filter(msg => msg.role !== 'system')
                        .map((msg, idx) => (
                           <div key={idx} className={`p-4 flex gap-4 ${msg.role === 'assistant' ? 'bg-blue-50/30' : ''}`}>
                              <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
                                msg.role === 'assistant' 
                                  ? 'bg-blue-100 text-blue-700' 
                                  : 'bg-slate-200 text-slate-600'
                              }`}>
                                {msg.role === 'assistant' ? 'AI' : 'U'}
                              </div>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold uppercase text-slate-500">
                                    {msg.role === 'assistant' ? 'Voca Agent' : 'Customer'}
                                  </span>
                                  {msg.timestamp && (
                                    <span className="text-xs text-slate-300 font-mono">
                                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                                  {msg.text}
                                </p>
                              </div>
                           </div>
                        ))
                    )}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallDetailPanel;
