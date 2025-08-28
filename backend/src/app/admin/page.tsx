'use client';

import { useEffect, useState } from 'react';
import { 
  CalendarIcon, 
  UserGroupIcon, 
  CheckCircleIcon,
  DocumentTextIcon 
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalEvents: number;
  totalInvitees: number;
  attendanceRate: number;
  recentEvents: Array<{
    id: number;
    name: string;
    location: string;
    created_at: string;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    totalInvitees: 0,
    attendanceRate: 0,
    recentEvents: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      name: 'Total Events',
      value: stats.totalEvents,
      icon: CalendarIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Total Invitees',
      value: stats.totalInvitees,
      icon: UserGroupIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Attendance Rate',
      value: `${stats.attendanceRate}%`,
      icon: CheckCircleIcon,
      color: 'bg-purple-500',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to Bedayia School Ticketing Management System</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {statsCards.map((card) => (
          <div
            key={card.name}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`${card.color} rounded-md p-3`}>
                    <card.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {card.name}
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {card.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Events */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Events</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {stats.recentEvents.length > 0 ? (
            stats.recentEvents.map((event) => (
              <div key={event.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {event.name}
                    </h3>
                    <p className="text-sm text-gray-500">{event.location}</p>
                  </div>
                  <div className="text-sm text-gray-400">
                    {new Date(event.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              No events found. Create your first event to get started.
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <a
              href="/admin/events"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-600 ring-4 ring-white">
                  <CalendarIcon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" />
                  Manage Events
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Create and manage school events, upload student data, and send invitations.
                </p>
              </div>
            </a>

            <a
              href="/admin/invitees"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-600 ring-4 ring-white">
                  <UserGroupIcon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" />
                  Track Attendance
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  View and manage invitee attendance, scan QR codes, and track participation.
                </p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}