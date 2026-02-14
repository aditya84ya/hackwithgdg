import React from 'react';
import { Lead } from '../types';
import { Phone, Mail, MapPin, Tag } from 'lucide-react';

interface LeadListProps {
  leads: Lead[];
  loading?: boolean;
}

const LeadList: React.FC<LeadListProps> = ({ leads, loading }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
        <p className="text-slate-500">No leads found. Start by finding some leads above!</p>
      </div>
    );
  }

  const getStatusColor = (status: Lead['status']) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800';
      case 'Contacted': return 'bg-yellow-100 text-yellow-800';
      case 'Interested': return 'bg-green-100 text-green-800';
      case 'Not Interested': return 'bg-gray-100 text-gray-800';
      case 'Scheduled': return 'bg-purple-100 text-purple-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="mt-8 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-semibold text-slate-900">Captured Leads ({leads.length})</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-medium">
            <tr>
              <th className="px-6 py-4">Business</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium text-slate-900">{lead.businessName}</div>
                    {lead.address && (
                      <div className="flex items-center text-xs text-slate-500 mt-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        <span className="truncate max-w-[200px]">{lead.address}</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-slate-900">{lead.name}</div>
                    {lead.email && (
                      <div className="flex items-center text-xs text-slate-500">
                        <Mail className="w-3 h-3 mr-1" />
                        {lead.email}
                      </div>
                    )}
                    {lead.phone && (
                      <div className="flex items-center text-xs text-slate-500">
                        <Phone className="w-3 h-3 mr-1" />
                        {lead.phone}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                    {lead.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center text-xs text-slate-500">
                    <Tag className="w-3 h-3 mr-1" />
                    {lead.source || 'Manual'}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeadList;
