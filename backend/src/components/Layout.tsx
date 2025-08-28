'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  CalendarIcon, 
  UserGroupIcon,
  DocumentTextIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { useAuth, withAuth } from '@/lib/context/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: HomeIcon },
  { name: 'Events', href: '/admin/events', icon: CalendarIcon },
  { name: 'Invitees', href: '/admin/invitees', icon: UserGroupIcon },
  { name: 'Reports', href: '/admin/reports', icon: DocumentTextIcon },
  { name: 'Users', href: '/admin/users', icon: UsersIcon },
];

function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex h-16 items-center justify-center border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Bedayia School</h1>
        </div>
        
        <nav className="mt-8 px-4 space-y-2">
          {navigation.filter(item => {
            // Show Users link only to admin users
            if (item.href === '/admin/users') {
              return user?.role === 'admin';
            }
            return true;
          }).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                  ${isActive 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
              >
                <item.icon
                  className={`
                    mr-3 h-5 w-5 transition-colors
                    ${isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'}
                  `}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-gray-100 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.username?.charAt(0).toUpperCase() || 'A'}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{user?.username || 'Admin'}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role || 'Administrator'}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
                title="Logout"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 ml-64">
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default withAuth(Layout);