import LoginForm from '@/components/auth/Login';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { UserRole } from '@/types';

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  // If user is already logged in, redirect to their role-specific dashboard
  if (session) {
    const role = session.user?.role as UserRole || 'employee';
    redirect(`/dashboard/${role}`);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-md px-6 py-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Welcome Back</h1>
        <LoginForm />
        <div className="mt-4 text-center text-sm">
          <a 
            href="/auth/forgot-password" 
            className="text-indigo-600 hover:text-indigo-500"
          >
            Forgot your password?
          </a>
        </div>
        <div className="mt-2 text-center text-sm">
          <span className="text-gray-600">Don't have an account? </span>
          <a 
            href="/auth/signup" 
            className="text-indigo-600 hover:text-indigo-500"
          >
            Sign up
          </a>
        </div>
      </div>
    </div>
  );
}