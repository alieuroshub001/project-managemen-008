import { UserRole } from '@/types';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import CreateChannelForm from '@/components/Communication/CreateChannelForm';

export default async function NewChannelPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return <div>Unauthorized</div>;
  }

  return (
    <div className="flex h-full items-center justify-center bg-gray-50 p-4">
      <CreateChannelForm />
    </div>
  );
}