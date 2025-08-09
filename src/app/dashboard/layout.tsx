import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/auth/LogoutButton';
import DeleteAccountButton from '@/components/auth/DeleteAccountButton';
import DashboardNav from '@/components/dashboard/DashboardNav';
import { UserRole } from '@/types';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/login');
  }

  // Type assertion to ensure role matches UserRole
  const userRole = session.user.role as UserRole;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar Navigation */}
        <DashboardNav role={userRole} />
        
        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-2xl font-bold">
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)} Dashboard
            </h1>
            <div className="flex gap-2">
              <LogoutButton />
              <DeleteAccountButton userId={session.user.id} />
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}