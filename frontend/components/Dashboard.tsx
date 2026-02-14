import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  Phone, 
  Users, 
  TrendingUp, 
  ChevronDown, 
  ChevronRight, 
  Plus,
  MapPin,
  Clock,
  Sparkles,
  Calendar
} from 'lucide-react';

// Mock data for call tracker chart
const callData = [
  { day: 'S', calls: 12, active: false },
  { day: 'M', calls: 28, active: false },
  { day: 'T', calls: 45, active: true },
  { day: 'W', calls: 32, active: false },
  { day: 'T', calls: 58, active: false },
  { day: 'F', calls: 40, active: false },
  { day: 'S', calls: 25, active: false },
];

// Mock recent leads data
const recentLeads = [
  {
    id: 1,
    name: 'Web Development Lead',
    status: 'Interested',
    rate: '$10/hour',
    location: 'Chennai',
    time: '2h ago',
    tags: ['Solar', 'Commercial'],
    description: 'This lead involves implementing both frontend and backend consultation for solar panels.',
    color: 'bg-rose-500'
  },
  {
    id: 2,
    name: 'Restaurant Marketing',
    status: 'New',
    rate: '$10/hour',
    location: 'Bangalore',
    time: '4h ago',
    tags: ['Marketing'],
    color: 'bg-emerald-500'
  },
  {
    id: 3,
    name: 'Rooftop Solar Project',
    status: 'Scheduled',
    rate: '$10/hour',
    location: 'Mumbai',
    time: '1d ago',
    tags: ['Solar', 'Residential'],
    color: 'bg-blue-500'
  }
];

// Mock team members
const teamMembers = [
  { id: 1, name: 'Ravi Kumar', role: 'Sales Agent', level: 'Senior', avatar: 'RK', color: 'bg-amber-100 text-amber-600' },
  { id: 2, name: 'Priya Sharma', role: 'Lead Specialist', level: 'Middle', avatar: 'PS', color: 'bg-blue-100 text-blue-600' },
];

const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          {/* Left - Page Title */}
          <div>
            <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-sm text-slate-500">Welcome back! Here's your call overview.</p>
          </div>
          
          {/* Right - Actions */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search leads, calls..."
                className="w-64 pl-10 pr-4 py-2.5 bg-slate-100 rounded-xl border-0 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            {/* Notifications */}
            <button className="relative w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            
            {/* Settings */}
            <button className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            
            {/* User Avatar */}
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                U
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6">
        {/* Main Grid Layout - full width with proper alignment */}
        <div className="grid grid-cols-12 gap-6">
        
        {/* Left Column - Call Tracker (spans 7 columns) */}
        <div className="col-span-12 lg:col-span-7 space-y-6">
          
          {/* Call Tracker Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <Phone className="w-5 h-5 text-slate-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Call Tracker</h2>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors">
                Week
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            <p className="text-slate-500 text-sm mb-8">Track changes in call volume over time and access detailed data on each lead and conversations</p>
            
            {/* Chart Area */}
            <div className="relative h-56 mb-6" style={{ minHeight: '224px' }}>
              {/* Value Label */}
              <div className="absolute left-1/2 top-0 transform -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-full text-sm font-semibold">
                284 calls
              </div>
              
              {/* Bar Chart */}
              <ResponsiveContainer width="100%" height={224}>
                <BarChart data={callData} barCategoryGap="30%">
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false}
                    tick={false}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => [`${value} calls`, 'Calls']}
                  />
                  <Bar dataKey="calls" radius={[20, 20, 0, 0]} maxBarSize={40}>
                    {callData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.active ? '#1e293b' : '#e2e8f0'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Day Selector */}
            <div className="flex justify-center gap-6">
              {callData.map((item, index) => (
                <button
                  key={index}
                  className={`w-10 h-10 rounded-full font-semibold text-sm transition-all ${
                    item.active 
                      ? 'bg-slate-800 text-white' 
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {item.day}
                </button>
              ))}
            </div>
            
            {/* Bottom Stats */}
            <div className="mt-8 flex items-end justify-between">
              <div>
                <p className="text-5xl font-bold text-slate-900 mb-2">+20%</p>
                <p className="text-slate-500 text-sm">This week's calls are<br />higher than last week's</p>
              </div>
            </div>
          </div>
          
          {/* Bottom Row - Let's Connect & Premium */}
          <div className="grid grid-cols-2 gap-6">
            {/* Let's Connect */}
            <div className="bg-white rounded-3xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Your Team</h3>
                <button className="text-sm text-slate-500 hover:text-slate-700">See all</button>
              </div>
              <div className="space-y-3">
                {teamMembers.map(member => (
                  <div key={member.id} className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${member.color} flex items-center justify-center font-semibold text-sm`}>
                      {member.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{member.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          member.level === 'Senior' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {member.level}
                        </span>
                      </div>
                      <span className="text-sm text-slate-500">{member.role}</span>
                    </div>
                    <button className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                      <Plus className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Premium Features */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl p-5 relative overflow-hidden">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Unlock Premium Features</h3>
              <p className="text-sm text-slate-500 mb-6">Get access to exclusive benefits and expand your calling capabilities</p>
              <button className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors shadow-sm">
                Upgrade now
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Right Column - Leads & Stats (spans 5 columns) */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          
          {/* Recent Leads */}
          <div className="bg-white rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Recent Leads</h3>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">See all Leads</button>
            </div>
            
            <div className="space-y-4">
              {recentLeads.map((lead, index) => (
                <div key={lead.id} className={`${index === 0 ? 'pb-4 border-b border-slate-100' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl ${lead.color} flex items-center justify-center text-white font-bold text-sm`}>
                      {lead.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-slate-900">{lead.name}</h4>
                        <span className={`text-xs px-2 py-0.5 uppercase rounded-full ${
                          lead.status === 'Interested' ? 'bg-green-600 text-white' :
                          lead.status === 'Scheduled' ? 'bg-blue-600 text-white' :
                          'bg-slate-600 text-white'
                        }`}>
                          {lead.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">{lead.rate}</p>
                      {index === 0 && (
                        <>
                          <div className="flex gap-2 mt-2">
                            {lead.tags.map(tag => (
                              <span key={tag} className="text-xs px-3 py-1 bg-slate-100 rounded-full text-slate-600">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <p className="text-sm text-slate-500 mt-3">{lead.description}</p>
                          <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {lead.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {lead.time}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    <button className="text-slate-400 hover:text-slate-600">
                      <ChevronDown className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Call Progress Stats */}
          <div className="bg-white rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Call Progress</h3>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-sm text-slate-600 hover:bg-slate-200 transition-colors">
                <Calendar className="w-4 h-4" />
                April 11, 2024
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <p className="text-slate-500 text-sm mb-1">Calls made</p>
                <p className="text-3xl font-bold text-slate-900">64</p>
              </div>
              <div>
                <p className="text-slate-500 text-sm mb-1">Interested</p>
                <p className="text-3xl font-bold text-slate-900">12</p>
              </div>
              <div>
                <p className="text-slate-500 text-sm mb-1">Scheduled</p>
                <p className="text-3xl font-bold text-slate-900">10</p>
              </div>
            </div>
            
            {/* Progress Bars */}
            <div className="flex gap-0.5">
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-8 rounded-sm ${
                    i < 20 ? 'bg-slate-800' : 'bg-orange-400'
                  }`}
                  style={{ opacity: i < 20 ? 1 - (i * 0.03) : 1 }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-400">
              <span>Completed</span>
              <span>Follow-up needed</span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Dashboard;
