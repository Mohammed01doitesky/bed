'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  DocumentArrowUpIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import toast, { Toaster } from 'react-hot-toast';

interface Event {
  id: number;
  name: string;
  location: string;
  email_subject: string;
  active: boolean;
  created_at: string;
  invitee_count?: number;
  attendance_rate?: number;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/admin/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events);
      }
    } catch (error) {
      toast.error('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (eventData: {
    name: string;
    location: string;
    email_subject: string;
  }) => {
    try {
      const response = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        toast.success('Event created successfully');
        setShowCreateModal(false);
        fetchEvents();
      } else {
        toast.error('Failed to create event');
      }
    } catch (error) {
      toast.error('Failed to create event');
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Event deleted successfully');
        fetchEvents();
      } else {
        toast.error('Failed to delete event');
      }
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };

  const handleSendEmails = async (eventId: number) => {
    try {
      const response = await fetch(`/api/admin/events/${eventId}/send-emails`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Emails sent successfully');
        fetchEvents();
      } else {
        toast.error('Failed to send emails');
      }
    } catch (error) {
      toast.error('Failed to send emails');
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
          <h1 className="text-2xl font-bold text-gray-900">Events Management</h1>
          <p className="text-gray-600">Create and manage school events</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Event
        </button>
      </div>

      {/* Events Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {events.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">No events found</div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Your First Event
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {events.map((event) => (
              <li key={event.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => router.push(`/admin/events/${event.id}`)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 truncate hover:text-blue-600 transition-colors">
                          {event.name}
                        </h3>
                        <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                          <span>📍 {event.location}</span>
                          <span>📧 {event.email_subject}</span>
                          <span>👥 {event.invitee_count || 0} invitees</span>
                          {event.attendance_rate && (
                            <span>✅ {event.attendance_rate}% attendance</span>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-gray-400">
                          Created: {new Date(event.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => router.push(`/admin/events/${event.id}`)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => router.push(`/admin/events/${event.id}/upload`)}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Upload Students"
                    >
                      <DocumentArrowUpIcon className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => handleSendEmails(event.id)}
                      className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Send Emails"
                    >
                      <EnvelopeIcon className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => setSelectedEvent(event)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
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

      {/* Create Event Modal */}
      {showCreateModal && (
        <CreateEventModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateEvent}
        />
      )}

      {/* Edit Event Modal */}
      {selectedEvent && (
        <EditEventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onUpdate={() => {
            fetchEvents();
            setSelectedEvent(null);
          }}
        />
      )}
    </div>
  );
}

// Create Event Modal Component
function CreateEventModal({ 
  onClose, 
  onCreate 
}: { 
  onClose: () => void; 
  onCreate: (data: any) => void; 
}) {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    email_subject: 'BIS Tickets'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Event</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Event Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Subject</label>
              <input
                type="text"
                value={formData.email_subject}
                onChange={(e) => setFormData({...formData, email_subject: e.target.value})}
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
                Create Event
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Edit Event Modal Component (similar to create but with existing data)
function EditEventModal({ 
  event, 
  onClose, 
  onUpdate 
}: { 
  event: Event; 
  onClose: () => void; 
  onUpdate: () => void; 
}) {
  const [formData, setFormData] = useState({
    name: event.name,
    location: event.location,
    email_subject: event.email_subject
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/admin/events/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Event updated successfully');
        onUpdate();
      } else {
        toast.error('Failed to update event');
      }
    } catch (error) {
      toast.error('Failed to update event');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Event</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Event Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Subject</label>
              <input
                type="text"
                value={formData.email_subject}
                onChange={(e) => setFormData({...formData, email_subject: e.target.value})}
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
                Update Event
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}