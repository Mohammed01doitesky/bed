'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeftIcon,
  DocumentArrowUpIcon,
  EnvelopeIcon,
  DocumentArrowDownIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '@/lib/context/AuthContext';

interface Event {
  id: number;
  name: string;
  location: string;
  email_subject: string;
  invitee_count: number;
  student_count: number;
  attendance_rate: number;
  created_at: string;
}

interface Student {
  id: number;
  student_id: string;
  student_name: string;
  student_email: string;
  student_email_parent_1: string;
  student_email_parent_2?: string;
  invitees: string;
  invitee_count: number;
  attendance_rate: number;
}

export default function EventDetailPage() {
  const { apiCall } = useAuth();
  const params = useParams();
  const router = useRouter();
  const eventId = parseInt(params.id as string);
  
  const [event, setEvent] = useState<Event | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
      fetchStudents();
    }
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const response = await apiCall(`/api/admin/events/${eventId}`);
      if (response.ok) {
        const data = await response.json();
        setEvent(data.event);
      } else {
        toast.error('Event not found');
        router.push('/admin/events');
      }
    } catch (error) {
      toast.error('Failed to fetch event details');
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await apiCall(`/api/admin/events/${eventId}/students`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students);
      }
    } catch (error) {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmails = async () => {
    try {
      const response = await apiCall(`/api/admin/events/${eventId}/send-emails`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Emails sent successfully');
        fetchStudents();
      } else {
        toast.error('Failed to send emails');
      }
    } catch (error) {
      toast.error('Failed to send emails');
    }
  };

  const handleExportExcel = async () => {
    try {
      toast.loading('Generating attendance report...', { id: 'export' });
      
      const response = await apiCall(`/api/admin/reports/export?type=attendance&eventId=${eventId}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        
        // Get filename from response headers or use default with event name
        const contentDisposition = response.headers.get('Content-Disposition');
        const filename = contentDisposition 
          ? contentDisposition.split('filename=')[1].replace(/"/g, '')
          : `${event?.name?.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}_attendance_report.xlsx`;
          
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success('Attendance report exported successfully!', { id: 'export' });
      } else {
        toast.error('Failed to export report', { id: 'export' });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report', { id: 'export' });
    }
  };

  const handleDeleteStudent = async (studentId: number) => {
    if (!confirm('Are you sure you want to delete this student?')) return;

    try {
      const response = await apiCall(`/api/admin/events/${eventId}/students/${studentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Student deleted successfully');
        fetchStudents();
        fetchEventDetails(); // Refresh counts
      } else {
        toast.error('Failed to delete student');
      }
    } catch (error) {
      toast.error('Failed to delete student');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg">Event not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/admin/events')}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
            <p className="text-gray-600">📍 {event.location}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push(`/admin/events/${eventId}/upload`)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
            Upload Students
          </button>
          
          <button
            onClick={handleSendEmails}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <EnvelopeIcon className="h-4 w-4 mr-2" />
            Send Emails
          </button>
          
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            Export Report
          </button>
          
          <button
            onClick={() => setShowAddStudentModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Student
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
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
                    Total Students
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {event.student_count || 0}
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
                  <span className="text-white text-sm font-medium">🎟️</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Invitees
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {event.invitee_count || 0}
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
                  <span className="text-white text-sm font-medium">✅</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Attendance Rate
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {event.attendance_rate || 0}%
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
                  <span className="text-white text-sm font-medium">📧</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Email Subject
                  </dt>
                  <dd className="text-sm font-medium text-gray-900 truncate">
                    {event.email_subject}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Students & Invitees</h2>
        </div>
        
        {students.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">No students found</div>
            <button
              onClick={() => setShowAddStudentModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add First Student
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {students.map((student) => (
              <li key={student.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => router.push(`/admin/invitees?student=${student.id}`)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          {student.student_name}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <span>🆔 {student.student_id}</span>
                          <span>📧 {student.student_email}</span>
                          <span>👨‍👩‍👧‍👦 {student.student_email_parent_1}</span>
                          {student.student_email_parent_2 && (
                            <span>👨‍👩‍👧‍👦 {student.student_email_parent_2}</span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                          <span>👥 {student.invitee_count} invitees</span>
                          <span>✅ {student.attendance_rate}% attendance</span>
                        </div>
                        {student.invitees && (
                          <div className="mt-1 text-sm text-gray-600">
                            <span className="font-medium">Invitees:</span> {student.invitees}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => router.push(`/admin/invitees?student=${student.id}`)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Invitees"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => setEditingStudent(student)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                      title="Edit Student"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteStudent(student.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Student"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <AddStudentModal
          eventId={eventId}
          onClose={() => setShowAddStudentModal(false)}
          onSuccess={() => {
            setShowAddStudentModal(false);
            fetchStudents();
            fetchEventDetails();
          }}
        />
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <EditStudentModal
          eventId={eventId}
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
          onSuccess={() => {
            setEditingStudent(null);
            fetchStudents();
            fetchEventDetails();
          }}
        />
      )}

    </div>
  );
}

// Edit Student Modal Component
function EditStudentModal({ 
  eventId, 
  student,
  onClose, 
  onSuccess 
}: { 
  eventId: number;
  student: Student;
  onClose: () => void; 
  onSuccess: () => void; 
}) {
  const { apiCall } = useAuth();
  const [formData, setFormData] = useState({
    student_id: student.student_id,
    student_name: student.student_name,
    student_email: student.student_email,
    student_email_parent_1: student.student_email_parent_1,
    student_email_parent_2: student.student_email_parent_2 || '',
    invitees: student.invitees
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiCall(`/api/admin/events/${eventId}/students/${student.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Student updated successfully');
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update student');
      }
    } catch (error) {
      toast.error('Failed to update student');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Student</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Student ID</label>
                <input
                  type="text"
                  required
                  value={formData.student_id}
                  onChange={(e) => setFormData({...formData, student_id: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Student Name</label>
                <input
                  type="text"
                  required
                  value={formData.student_name}
                  onChange={(e) => setFormData({...formData, student_name: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Student Email</label>
              <input
                type="email"
                required
                value={formData.student_email}
                onChange={(e) => setFormData({...formData, student_email: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Parent 1 Email</label>
                <input
                  type="email"
                  required
                  value={formData.student_email_parent_1}
                  onChange={(e) => setFormData({...formData, student_email_parent_1: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Parent 2 Email (Optional)</label>
                <input
                  type="email"
                  value={formData.student_email_parent_2}
                  onChange={(e) => setFormData({...formData, student_email_parent_2: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                />
              </div>
            </div>
            
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Invitees (comma-separated)</label>
              <textarea
                rows={3}
                value={formData.invitees}
                onChange={(e) => setFormData({...formData, invitees: e.target.value})}
                placeholder="Parent 1, Parent 2, Sibling, etc."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Update Student
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Add Student Modal Component
function AddStudentModal({ 
  eventId, 
  onClose, 
  onSuccess 
}: { 
  eventId: number;
  onClose: () => void; 
  onSuccess: () => void; 
}) {
  const { apiCall } = useAuth();
  const [formData, setFormData] = useState({
    student_id: '',
    student_name: '',
    student_email: '',
    student_email_parent_1: '',
    student_email_parent_2: '',
    invitees: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiCall(`/api/admin/events/${eventId}/students`, {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Student added successfully');
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add student');
      }
    } catch (error) {
      toast.error('Failed to add student');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Student</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Student ID</label>
                <input
                  type="text"
                  required
                  value={formData.student_id}
                  onChange={(e) => setFormData({...formData, student_id: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Student Name</label>
                <input
                  type="text"
                  required
                  value={formData.student_name}
                  onChange={(e) => setFormData({...formData, student_name: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Student Email</label>
              <input
                type="email"
                required
                value={formData.student_email}
                onChange={(e) => setFormData({...formData, student_email: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Parent 1 Email</label>
                <input
                  type="email"
                  required
                  value={formData.student_email_parent_1}
                  onChange={(e) => setFormData({...formData, student_email_parent_1: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Parent 2 Email (Optional)</label>
                <input
                  type="email"
                  value={formData.student_email_parent_2}
                  onChange={(e) => setFormData({...formData, student_email_parent_2: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                />
              </div>
            </div>
            
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Invitees (comma-separated)</label>
              <textarea
                rows={3}
                value={formData.invitees}
                onChange={(e) => setFormData({...formData, invitees: e.target.value})}
                placeholder="Parent 1, Parent 2, Sibling, etc."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Add Student
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}