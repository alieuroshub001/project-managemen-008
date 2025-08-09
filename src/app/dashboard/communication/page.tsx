// app/dashboard/communication/page.tsx
import { UserRole } from '@/types';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CommunicationClientWrapper from '@/components/Communication/CommunicationClientWrapper';
import ChannelList from '@/components/Communication/ChannelList';
import { MessageSquare, Users, Shield, Upload, Search, Plus } from 'lucide-react';
import Link from 'next/link';

export default async function CommunicationPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/login');
  }

  const userRole = session.user.role as UserRole;
  const canCreateChannel = ['superadmin', 'admin', 'hr'].includes(userRole);

  return (
    <CommunicationClientWrapper>
      <div className="flex h-screen bg-white">
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-80 border-r border-gray-200 bg-gray-50">
          <div className="p-4 h-full overflow-hidden">
            <ChannelList role={userRole} />
          </div>
        </div>

        {/* Main Welcome Area */}
        <div className="flex-1 flex flex-col">
          {/* Mobile Header */}
          <div className="md:hidden bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold text-gray-900">Channels</h1>
              {canCreateChannel && (
                <Link
                  href="/dashboard/communication/new"
                  className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Plus className="w-5 h-5" />
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Channel List */}
          <div className="md:hidden flex-1 overflow-hidden">
            <div className="p-4 h-full">
              <ChannelList role={userRole} />
            </div>
          </div>

          {/* Desktop Welcome Content */}
          <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
            <div className="max-w-md text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-indigo-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to Team Communication
              </h2>
              
              <p className="text-gray-600 mb-6">
                Select a channel to start messaging with your team, or create a new one to begin collaborating.
              </p>

              {/* Quick Actions */}
              <div className="space-y-4">
                {canCreateChannel && (
                  <Link
                    href="/dashboard/communication/new"
                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create New Channel</span>
                  </Link>
                )}
                
                <div className="text-left">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    What you can do:
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center space-x-2">
                      <MessageSquare className="w-4 h-4 text-gray-400" />
                      <span>Send messages and communicate in real-time</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Upload className="w-4 h-4 text-gray-400" />
                      <span>Share files, images, and documents</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>Collaborate with team members</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Search className="w-4 h-4 text-gray-400" />
                      <span>Search and filter shared media</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-gray-400" />
                      <span>Secure private channels</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Stats or Tips */}
              <div className="mt-8 p-4 bg-white rounded-lg border border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  💡 Pro Tips
                </h4>
                <ul className="text-xs text-gray-500 space-y-1 text-left">
                  <li>• Use drag & drop to upload multiple files at once</li>
                  <li>• Press Enter to send messages quickly</li>
                  <li>• Click the media button to view all shared files</li>
                  <li>• Private channels are only visible to invited members</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CommunicationClientWrapper>
  );
}

// Generate metadata for the page
export const metadata = {
  title: 'Team Communication - HR Dashboard',
  description: 'Communicate with your team, share files, and collaborate effectively',
};