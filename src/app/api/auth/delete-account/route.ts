import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Case from '@/models/Case';
import { IApiResponse } from '@/types';

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json<IApiResponse>(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { userId } = await request.json();
    
    // Verify the authenticated user is deleting their own account
    if (session.user.id !== userId) {
      return NextResponse.json<IApiResponse>(
        { success: false, message: 'Unauthorized operation' },
        { status: 403 }
      );
    }

    await connectToDatabase();

    // Delete user's cases first (if needed)
    await Case.deleteMany({ createdBy: userId });

    // Then delete the user
    await User.findByIdAndDelete(userId);

    return NextResponse.json<IApiResponse>(
      { success: true, message: 'Account deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json<IApiResponse>(
      { 
        success: false, 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}