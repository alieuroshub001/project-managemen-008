import { UserRole } from '@/types';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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
    return <div>Unauthorized</div>;
  }

  return (
    <CommunicationClientWrapper>
      <div className="flex h-full">
        <div className="hidden md:block w-80 border-r border-gray-200 p-4">
          <ChannelList role={session.user.role as UserRole} />
        </div>
        <div className="flex-1">
          <ChannelView 
            channelId={params.channelId} 
            role={session.user.role as UserRole} 
          />
        </div>
      </div>
    </CommunicationClientWrapper>
  );
}