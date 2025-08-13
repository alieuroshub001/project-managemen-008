// app/api/employee/profile/picture/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { IApiResponse } from '@/types';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<IApiResponse>(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { imageUrl } = await request.json();

    await connectToDatabase();

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { image: imageUrl },
      { new: true }
    ).select('-password');

    return NextResponse.json<IApiResponse>({
      success: true,
      data: updatedUser,
      message: 'Profile picture updated successfully',
    });
  } catch (error) {
    console.error('Error updating profile picture:', error);
    return NextResponse.json<IApiResponse>(
      { success: false, message: 'Failed to update profile picture' },
      { status: 500 }
    );
  }
}