import { UserRole } from '@/types';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import CommunicationClientWrapper from '@/components/Communication/CommunicationClientWrapper';
import ChannelList from '@/components/Communication/ChannelList';

export default async function CommunicationPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return <div>Unauthorized</div>;
  }

  return (
    <CommunicationClientWrapper>
      <div className="flex h-full">
        <div className="hidden md:block w-80 border-r border-gray-200 p-4">
          <ChannelList role={session.user.role as UserRole} />
        </div>
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center text-gray-500">
            <div className="text-lg mb-2">Select a channel</div>
            <p className="text-sm">or create a new one to start messaging</p>
          </div>
        </div>
      </div>
    </CommunicationClientWrapper>
  );
}