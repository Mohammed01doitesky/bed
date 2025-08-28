'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  QrCodeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import toast, { Toaster } from 'react-hot-toast';

interface Invitee {
  id: number;
  invitees_name: string;
  invitees_qrcode_text: string;
  invitees_attendance: boolean;
  invitees_attendance_time?: string;
  main_invitee: boolean;
  mail_send: boolean;
  event_name: string;
  event_id: number;
  student_name: string;
  student_item_id: number;
}

export default function InviteesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = searchParams.get('student');
  
  const [invitees, setInvitees] = useState<Invitee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [combinedFilter, setCombinedFilter] = useState('all'); // all, attended_sent, attended_not_sent, not_attended_sent, not_attended_not_sent
  const [selectedEvent, setSelectedEvent] = useState('all');
  const [events, setEvents] = useState<Array<{id: number; name: string}>>([]);
  const [selectedInvitee, setSelectedInvitee] = useState<Invitee | null>(null);

  useEffect(() => {
    fetchInvitees();
    fetchEvents();
  }, [studentId]);

  const fetchInvitees = async () => {
    try {
      const url = studentId 
        ? `/api/admin/invitees?student=${studentId}`
        : '/api/admin/invitees';
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setInvitees(data.invitees);
      }
    } catch (error) {
      toast.error('Failed to fetch invitees');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/admin/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events);
      }
    } catch (error) {
      console.error('Failed to fetch events');
    }
  };

  const handleAttendanceToggle = async (inviteeId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/invitees/${inviteeId}/attendance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendance: !currentStatus }),
      });

      if (response.ok) {
        toast.success('Attendance updated successfully');
        fetchInvitees();
      } else {
        toast.error('Failed to update attendance');
      }
    } catch (error) {
      toast.error('Failed to update attendance');
    }
  };

  const filteredInvitees = invitees.filter(invitee => {
    // Search filter
    const matchesSearch = 
      invitee.invitees_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invitee.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invitee.event_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invitee.invitees_qrcode_text.toLowerCase().includes(searchTerm.toLowerCase());

    // Event filter
    const matchesEvent = 
      selectedEvent === 'all' ||
      invitee.event_id.toString() === selectedEvent;

    // Combined status and email filter
    const matchesCombined = 
      combinedFilter === 'all' ||
      (combinedFilter === 'attended' && invitee.invitees_attendance) ||
      (combinedFilter === 'not_attended' && !invitee.invitees_attendance) ||
      (combinedFilter === 'email_not_sent' && !invitee.mail_send);

    return matchesSearch && matchesEvent && matchesCombined;
  });

  const attendanceStats = {
    total: invitees.length,
    attended: invitees.filter(i => i.invitees_attendance).length,
    pending: invitees.filter(i => !i.invitees_attendance).length,
    rate: invitees.length > 0 ? Math.round((invitees.filter(i => i.invitees_attendance).length / invitees.length) * 100) : 0
  };

  const emailStats = {
    emailsSent: invitees.filter(i => i.mail_send).length,
    emailsPending: invitees.filter(i => !i.mail_send).length,
    emailRate: invitees.length > 0 ? Math.round((invitees.filter(i => i.mail_send).length / invitees.length) * 100) : 0
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
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {studentId ? 'Student Invitees' : 'All Invitees'}
          </h1>
          <p className="text-gray-600">
            Manage event invitees and track attendance
          </p>
        </div>
        
        {studentId && (
          <button
            onClick={() => router.push('/admin/invitees')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            View All Invitees
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">👥</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Invitees
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {attendanceStats.total}
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
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <CheckCircleIcon className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Attended
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {attendanceStats.attended}
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
                <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                  <ClockIcon className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pending
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {attendanceStats.pending}
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
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">%</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Attendance Rate
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {attendanceStats.rate}%
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
                <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">✉️</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Emails Sent
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {emailStats.emailsSent}
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
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">📧</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Emails Pending
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {emailStats.emailsPending}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search invitees, students, or events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-4 w-4 text-gray-400" />
            <select
              value={combinedFilter}
              onChange={(e) => setCombinedFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="attended">Attended</option>
              <option value="not_attended">Not Attended</option>
              <option value="email_not_sent">Email Not Sent</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Event:</span>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Events</option>
              {events.map(event => (
                <option key={event.id} value={event.id.toString()}>
                  {event.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Invitees Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {filteredInvitees.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg">
              {searchTerm || combinedFilter !== 'all' || selectedEvent !== 'all'
                ? 'No invitees found matching your filters' 
                : 'No invitees found'
              }
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredInvitees.map((invitee) => (
              <li key={invitee.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <div className={`flex-shrink-0 w-3 h-3 rounded-full ${
                        invitee.main_invitee ? 'bg-blue-500' : 'bg-gray-300'
                      }`} title={invitee.main_invitee ? 'Main Invitee' : 'Additional Invitee'} />
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            {invitee.invitees_name}
                          </h3>
                          {invitee.main_invitee && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Main
                            </span>
                          )}
                          {invitee.mail_send && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Email Sent
                            </span>
                          )}
                        </div>
                        
                        <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <span>🎓 {invitee.student_name}</span>
                          <span>🎉 {invitee.event_name}</span>
                          {invitee.invitees_attendance_time && (
                            <span>🕒 {new Date(invitee.invitees_attendance_time).toLocaleString()}</span>
                          )}
                        </div>
                        
                        <div className="mt-1 text-xs text-gray-400 font-mono">
                          QR: {invitee.invitees_qrcode_text}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {/* Attendance Status */}
                    <div className="flex items-center space-x-2">
                      {invitee.invitees_attendance ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Present
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                          <XCircleIcon className="h-4 w-4 mr-1" />
                          Absent
                        </span>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedInvitee(invitee)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View QR Code"
                      >
                        <QrCodeIcon className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleAttendanceToggle(invitee.id, invitee.invitees_attendance)}
                        className={`p-2 rounded-lg transition-colors ${
                          invitee.invitees_attendance
                            ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                            : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                        }`}
                        title={invitee.invitees_attendance ? 'Mark as Absent' : 'Mark as Present'}
                      >
                        {invitee.invitees_attendance ? (
                          <XCircleIcon className="h-4 w-4" />
                        ) : (
                          <CheckCircleIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* QR Code Modal */}
      {selectedInvitee && (
        <QRCodeModal
          invitee={selectedInvitee}
          onClose={() => setSelectedInvitee(null)}
        />
      )}
    </div>
  );
}

// QR Code Modal Component
function QRCodeModal({ 
  invitee, 
  onClose 
}: { 
  invitee: Invitee; 
  onClose: () => void; 
}) {
  const [qrCodeData, setQRCodeData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQRCode();
  }, [invitee.id]);

  const fetchQRCode = async () => {
    try {
      const response = await fetch(`/api/admin/invitees/${invitee.id}/qrcode`);
      if (response.ok) {
        const data = await response.json();
        setQRCodeData(data.qrcode);
      }
    } catch (error) {
      toast.error('Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-6 border w-96 shadow-lg rounded-md bg-white">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            QR Code for {invitee.invitees_name}
          </h3>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : qrCodeData ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img 
                  src={`data:image/png;base64,${qrCodeData}`}
                  alt="QR Code"
                  className="border rounded-lg"
                />
              </div>
              <div className="text-sm text-gray-600 font-mono bg-gray-50 p-3 rounded">
                {invitee.invitees_qrcode_text}
              </div>
              <div className="text-sm text-gray-500">
                Event: {invitee.event_name}<br />
                Student: {invitee.student_name}
              </div>
            </div>
          ) : (
            <div className="text-red-500 py-8">
              Failed to generate QR code
            </div>
          )}
          
          <div className="mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}