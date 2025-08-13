// app/dashboard/communication/new/page.tsx
import { UserRole } from '@/types';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CreateChannelForm from '@/components/Communication/CreateChannelForm';
import CommunicationClientWrapper from '@/components/Communication/CommunicationClientWrapper';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function NewChannelPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/login');
  }

  // Check if user has permission to create channels
  const allowedRoles: UserRole[] = ['superadmin', 'admin', 'hr'];
  if (!allowedRoles.includes(session.user.role as UserRole)) {
    redirect('/dashboard/communication');
  }

  return (
    <CommunicationClientWrapper>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Link
                  href="/dashboard/communication"
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back to Channels</span>
                </Link>
                <div className="h-6 w-px bg-gray-300"></div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Create New Channel
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              {/* Info Card */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-sm font-medium">ℹ</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-900">
                      Channel Creation
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Private channels are only visible to invited members</li>
                        <li>You can add team members after creating the channel</li>
                        <li>As the creator, you&apos;ll have full management permissions</li>
                        <li>Members can share files, images, and documents</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Create Channel Form */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <CreateChannelForm />
              </div>

              {/* Additional Help */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  Need help setting up your team communication?{' '}
                  <Link 
                    href="/dashboard/help" 
                    className="text-indigo-600 hover:text-indigo-500"
                  >
                    View documentation
                  </Link>
                </p>
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
  title: 'Create New Channel - HR Communication',
  description: 'Create a new communication channel for your team',
};