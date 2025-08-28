'use client';

import { useEffect, useState } from 'react';
import { 
  DocumentTextIcon,
  CalendarIcon,
  UserGroupIcon,
  ChartBarIcon,
  DocumentArrowDownIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '@/lib/context/AuthContext';

interface ReportData {
  totalEvents: number;
  totalInvitees: number;
  averageAttendance: number;
  monthlyStats: Array<{
    month: string;
    events: number;
    attendance: number;
  }>;
}

export default function ReportsPage() {
  const { apiCall } = useAuth();
  const [reportData, setReportData] = useState<ReportData>({
    totalEvents: 0,
    totalInvitees: 0,
    averageAttendance: 0,
    monthlyStats: []
  });
  const [loading, setLoading] = useState(true);
  const [showEventSelector, setShowEventSelector] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState('');
  const [events, setEvents] = useState<Array<{id: number; name: string; location: string}>>([]);

  useEffect(() => {
    fetchReportData();
    fetchEvents();
  }, []);

  const fetchReportData = async () => {
    try {
      const response = await apiCall('/api/admin/reports');
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      }
    } catch (error) {
      console.error('Failed to fetch report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await apiCall('/api/admin/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  };

  const handleExportClick = (type: string) => {
    if (type === 'attendance' || type === 'events') {
      setSelectedReportType(type);
      setShowEventSelector(true);
    } else {
      exportReport(type, null);
    }
  };

  const exportReport = async (type: string, eventId: number | null) => {
    try {
      toast.loading('Generating Excel report...', { id: 'export' });
      
      const url = eventId 
        ? `/api/admin/reports/export?type=${type}&eventId=${eventId}`
        : `/api/admin/reports/export?type=${type}`;
      const response = await apiCall(url);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        
        // Get filename from response headers or use default
        const contentDisposition = response.headers.get('Content-Disposition');
        const filename = contentDisposition 
          ? contentDisposition.split('filename=')[1].replace(/"/g, '')
          : `${type}_report.xlsx`;
          
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success('Report exported successfully!', { id: 'export' });
      } else {
        toast.error('Failed to export report', { id: 'export' });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report', { id: 'export' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Analytics and insights for school events</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => handleExportClick('summary')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            Export Summary
          </button>
          <button
            onClick={() => handleExportClick('events')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Export Events
          </button>
          <button
            onClick={() => handleExportClick('attendance')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <UserGroupIcon className="h-4 w-4 mr-2" />
            Export Attendance
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-blue-500 rounded-md p-3">
                  <CalendarIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Events
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {reportData.totalEvents}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-green-500 rounded-md p-3">
                  <UserGroupIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Invitees
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {reportData.totalInvitees}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-purple-500 rounded-md p-3">
                  <ChartBarIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Avg Attendance
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {reportData.averageAttendance}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-orange-500 rounded-md p-3">
                  <DocumentTextIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    This Month
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {reportData.monthlyStats.length > 0 ? reportData.monthlyStats[0]?.events || 0 : 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Statistics Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Monthly Statistics</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Month
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Events
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attendance Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.monthlyStats.length > 0 ? (
                reportData.monthlyStats.map((stat, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {stat.month}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stat.events}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stat.attendance}%
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    No data available. Events data will appear here once you have created events.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Options */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Report Options</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <button
              onClick={() => handleExportClick('events')}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Event Summary</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Overview of all events with attendance statistics
                  </p>
                </div>
                <DocumentArrowDownIcon className="h-5 w-5 text-gray-400" />
              </div>
            </button>
            
            <button
              onClick={() => handleExportClick('attendance')}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Attendance Details</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Detailed breakdown of individual attendee participation
                  </p>
                </div>
                <DocumentArrowDownIcon className="h-5 w-5 text-gray-400" />
              </div>
            </button>
            
            <button
              onClick={() => handleExportClick('summary')}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Summary Report</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Overall system statistics and key metrics
                  </p>
                </div>
                <DocumentArrowDownIcon className="h-5 w-5 text-gray-400" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Event Selector Modal */}
      {showEventSelector && (
        <EventSelectorModal
          reportType={selectedReportType}
          events={events}
          onClose={() => setShowEventSelector(false)}
          onExport={(eventId) => {
            exportReport(selectedReportType, eventId);
            setShowEventSelector(false);
          }}
        />
      )}
    </div>
  );
}

// Event Selector Modal Component
function EventSelectorModal({ 
  reportType, 
  events,
  onClose, 
  onExport 
}: { 
  reportType: string;
  events: Array<{id: number; name: string; location: string}>;
  onClose: () => void; 
  onExport: (eventId: number | null) => void; 
}) {
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  const handleExport = () => {
    onExport(selectedEventId);
  };

  const getReportTitle = () => {
    switch (reportType) {
      case 'attendance':
        return 'Attendance Report';
      case 'events':
        return 'Event Summary Report';
      default:
        return 'Report';
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Select Event for {getReportTitle()}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* All Events Option */}
            <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="event"
                value=""
                checked={selectedEventId === null}
                onChange={() => setSelectedEventId(null)}
                className="mr-3 text-blue-600"
              />
              <div>
                <div className="font-medium text-gray-900">All Events</div>
                <div className="text-sm text-gray-500">Include data from all events</div>
              </div>
            </label>

            {/* Individual Events */}
            {events.length > 0 ? (
              events.map((event) => (
                <label key={event.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="event"
                    value={event.id}
                    checked={selectedEventId === event.id}
                    onChange={() => setSelectedEventId(event.id)}
                    className="mr-3 text-blue-600"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{event.name}</div>
                    <div className="text-sm text-gray-500">{event.location}</div>
                  </div>
                </label>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No events found</p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              Export Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}