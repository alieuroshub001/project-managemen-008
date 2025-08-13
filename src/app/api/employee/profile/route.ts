// app/api/employee/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import EmployeeProfile from '@/models/EmployeeProfile';
import { IApiResponse } from '@/types';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<IApiResponse>(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const user = await User.findById(session.user.id).select('-password');
    const profile = await EmployeeProfile.findOne({ userId: session.user.id });

    if (!user || !profile) {
      return NextResponse.json<IApiResponse>(
        { success: false, message: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<IApiResponse>({
        success: true,
        data: { user, ...profile.toObject() },
        message: ''
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json<IApiResponse>(
      { success: false, message: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<IApiResponse>(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, department, position, hireDate, employmentType } = await request.json();

    await connectToDatabase();

    // Update user name
    await User.findByIdAndUpdate(session.user.id, { name });

    // Update employee profile
    const updatedProfile = await EmployeeProfile.findOneAndUpdate(
      { userId: session.user.id },
      { department, position, hireDate, employmentType },
      { new: true }
    );

    return NextResponse.json<IApiResponse>({
      success: true,
      data: updatedProfile,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json<IApiResponse>(
      { success: false, message: 'Failed to update profile' },
      { status: 500 }
    );
  }
}