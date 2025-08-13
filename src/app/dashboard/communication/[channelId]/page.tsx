// app/dashboard/communication/[channelId]/page.tsx
import { UserRole } from '@/types';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CommunicationClientWrapper from '@/components/Communication/CommunicationClientWrapper';
import ChannelList from '@/components/Communication/ChannelList';
import ChannelView from '@/components/Communication/ChannelView';

export default async function ChannelPage({
  params,
}: {
  params: { channelId: string };
}) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/login');
  }

  // Validate channelId format (basic MongoDB ObjectId validation)
  const isValidChannelId = /^[a-fA-F0-9]{24}$/.test(params.channelId);
  if (!isValidChannelId) {
    redirect('/dashboard/communication');
  }

  return (
    <CommunicationClientWrapper>
      <div className="flex h-screen bg-white">
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-80 border-r border-gray-200 bg-gray-50">
          <div className="p-4 h-full overflow-hidden">
            <ChannelList role={session.user.role as UserRole} />
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <ChannelView 
            channelId={params.channelId} 
            role={session.user.role as UserRole} 
          />
        </div>
      </div>
    </CommunicationClientWrapper>
  );
}

// Generate metadata for the page
export async function generateMetadata({

}: {
  params: { channelId: string };
}) {
  // You could fetch channel name here for dynamic titles
  return {
    title: 'Channel Chat - HR Communication',
    description: 'Team communication and file sharing',
  };
}