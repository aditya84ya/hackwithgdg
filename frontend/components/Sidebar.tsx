import React, { useState } from 'react';
import { 
  Search,
  LayoutGrid,
  FileText,
  Bot,
  Phone,
  History,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { NavSection } from '../types';

interface SidebarProps {
  activeSection: NavSection;
  onNavigate: (section: NavSection) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection, onNavigate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const NavIcon = ({ 
    section, 
    icon: Icon, 
    label, 
    submenu 
  }: { 
    section: NavSection; 
    icon: any; 
    label: string;
    submenu?: { label: string; section: NavSection }[];
  }) => {
    const isActive = activeSection === section || submenu?.some(s => s.section === activeSection);
    const isSubExpanded = expandedItem === label;

    const handleClick = () => {
      if (submenu && isExpanded) {
        setExpandedItem(isSubExpanded ? null : label);
      } else if (submenu && !isExpanded) {
        // If collapsed, show submenu as tooltip-like popup
        setExpandedItem(isSubExpanded ? null : label);
      } else {
        onNavigate(section);
        setExpandedItem(null);
      }
    };

    return (
      <div className="relative">
        <button
          onClick={handleClick}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-200 group relative ${
            isActive 
              ? 'bg-slate-100 text-slate-900' 
              : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
          }`}
          title={!isExpanded ? label : undefined}
        >
          <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5" />
          </div>
          {isExpanded && (
            <span className="text-sm font-medium flex-1 text-left">{label}</span>
          )}
          {submenu && isExpanded && (
            <ChevronRight className={`w-4 h-4 transition-transform ${isSubExpanded ? 'rotate-90' : ''}`} />
          )}
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-slate-800 rounded-r-full" />
          )}
        </button>

        {/* Expandable Submenu - Inline when expanded, popup when collapsed */}
        {submenu && isSubExpanded && (
          isExpanded ? (
            // Inline submenu
            <div className="ml-9 mt-1 space-y-1">
              {submenu.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    onNavigate(item.section);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-xl transition-colors ${
                    activeSection === item.section
                      ? 'bg-slate-100 text-slate-900 font-medium'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : (
            // Popup submenu when collapsed
            <div className="absolute left-full top-0 ml-3 bg-white rounded-2xl shadow-lg border border-slate-100 py-2 px-1 min-w-[140px] z-50">
              {submenu.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    onNavigate(item.section);
                    setExpandedItem(null);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm rounded-xl transition-colors ${
                    activeSection === item.section
                      ? 'bg-slate-100 text-slate-900 font-medium'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )
        )}
      </div>
    );
  };

  return (
    <div 
      className={`h-screen bg-white border-r border-slate-100 flex flex-col py-6 sticky top-0 transition-all duration-300 ${
        isExpanded ? 'w-64 px-4' : 'w-20 px-4 items-center'
      }`}
    >
      {/* Logo & Expand Toggle */}
      <div className={`flex items-center mb-8 ${isExpanded ? 'justify-between w-full' : 'justify-center'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            V
          </div>
          {isExpanded && (
            <span className="text-xl font-bold text-slate-900">VOCA AI</span>
          )}
        </div>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors ${
            isExpanded ? '' : 'absolute left-16'
          }`}
        >
          {isExpanded ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
      </div>

      {/* Search */}
      <button className={`rounded-2xl border border-slate-200 flex items-center text-slate-400 hover:border-slate-300 hover:text-slate-600 transition-all mb-6 ${
        isExpanded ? 'w-full px-4 py-3 gap-3' : 'w-12 h-12 justify-center'
      }`}>
        <Search className="w-5 h-5 flex-shrink-0" />
        {isExpanded && <span className="text-sm">Search...</span>}
      </button>

      {/* Main Navigation */}
      <div className="flex-1 flex flex-col w-full">
        <span className={`text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3 ${isExpanded ? '' : 'text-center'}`}>
          Main
        </span>
        
        <div className="space-y-1 w-full">
          <NavIcon 
            section={NavSection.DASHBOARD} 
            icon={LayoutGrid} 
            label="Dashboard"
          />
          <NavIcon section={NavSection.LEADS} icon={FileText} label="Lead Management" />
          <NavIcon section={NavSection.CALL_CENTER} icon={Phone} label="Call Center" />
          <NavIcon section={NavSection.CALL_HISTORY} icon={History} label="Call History" />
          <NavIcon section={NavSection.AGENTS} icon={Bot} label="Agent Editor" />
        </div>
      </div>

      {/* User Profile at bottom */}
      <div className={`${isExpanded ? 'w-full' : ''}`}>
        <div className={`rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center overflow-hidden ${
          isExpanded ? 'w-full px-3 py-3 gap-3' : 'w-12 h-12 justify-center'
        }`}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            U
          </div>
          {isExpanded && (
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-slate-700">User Name</p>
              <p className="text-xs text-slate-400">Admin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

