import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Channel from '@/models/Channel';
import User from '@/models/User';
import UserChannel from '@/models/UserChannel';
import { IApiResponse } from '@/types';
import mongoose from 'mongoose';

interface SessionUser {
  id: string;
  email?: string;
}

interface SessionData {
  user: SessionUser;
}

// Helper function to validate ObjectId
function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id) && /^[a-fA-F0-9]{24}$/.test(id);
}

// Helper function to get user by session
async function getUserFromSession(session: SessionData) {
  await connectToDatabase();
  
  // If session.user.id is already a valid ObjectId, use it
  if (isValidObjectId(session.user.id)) {
    return { userId: session.user.id };
  }
  
  // If not, try to find user by email
  if (session.user.email) {
    const user = await User.findOne({ email: session.user.email }).select('_id');
    if (user) {
      return { userId: user._id.toString() };
    }
  }
  
  throw new Error('User not found in database');
}

// Get all channels for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    const { userId } = await getUserFromSession(session as SessionData);

    const channels = await Channel.find({
      members: userId
    })
      .populate('createdBy', 'name email')
      .populate('members', 'name email')
      .sort({ updatedAt: -1 });

    return NextResponse.json<IApiResponse>({
      success: true,
      data: channels,
      message: 'Channels fetched successfully'
    });

  } catch (error) {
    console.error('GET channels error:', error);
    return NextResponse.json<IApiResponse>({
      success: false,
      message: 'Failed to fetch channels',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Create a new channel
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    const { name, description, isPrivate, members } = await request.json() as {
      name: string;
      description?: string;
      isPrivate?: boolean;
      members?: string[];
    };
    
    if (!name) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Channel name is required'
      }, { status: 400 });
    }

    const { userId } = await getUserFromSession(session as SessionData);

    const validMemberIds: string[] = [];
    if (Array.isArray(members)) {
      for (const memberId of members) {
        if (isValidObjectId(memberId)) {
          validMemberIds.push(memberId);
        } else {
          console.warn(`Invalid member ID: ${memberId}`);
        }
      }
    }

    const allMembers = Array.from(new Set([userId, ...validMemberIds]));

    const channel = await Channel.create({
      name,
      description,
      isPrivate: isPrivate || false,
      createdBy: userId,
      members: allMembers
    });

    await Promise.all(
      allMembers.map(memberId => 
        UserChannel.create({
          userId: memberId,
          channelId: channel._id,
          notificationsEnabled: true
        })
      )
    );

    const populatedChannel = await Channel.findById(channel._id)
      .populate('createdBy', 'name email')
      .populate('members', 'name email');

    return NextResponse.json<IApiResponse>({
      success: true,
      data: populatedChannel,
      message: 'Channel created successfully'
    });

  } catch (error) {
    console.error('POST channel error:', error);
    return NextResponse.json<IApiResponse>({
      success: false,
      message: 'Failed to create channel',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Update a channel
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    const { channelId, name, description, membersToAdd, membersToRemove } = await request.json() as {
      channelId: string;
      name?: string;
      description?: string;
      membersToAdd?: string[];
      membersToRemove?: string[];
    };
    
    if (!channelId) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Channel ID is required'
      }, { status: 400 });
    }

    const { userId } = await getUserFromSession(session as SessionData);

    await connectToDatabase();

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Channel not found'
      }, { status: 404 });
    }

    if (channel.createdBy.toString() !== userId) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Only channel creator can modify the channel'
      }, { status: 403 });
    }

    if (name) channel.name = name;
    if (description) channel.description = description;

    if (membersToAdd?.length) {
      const validNewMembers = membersToAdd.filter(
        (memberId) => isValidObjectId(memberId) && !channel.members.includes(memberId)
      );
      
      channel.members.push(...validNewMembers);
      
      await Promise.all(
        validNewMembers.map((memberId) => 
          UserChannel.create({
            userId: memberId,
            channelId: channel._id,
            notificationsEnabled: true
          })
        )
      );
    }

    if (membersToRemove?.length) {
      const validMembersToRemove = membersToRemove.filter((memberId) => isValidObjectId(memberId));
      
      channel.members = channel.members.filter(
        (memberId) => !validMembersToRemove.includes(memberId.toString())
      );
      
      await UserChannel.deleteMany({
        channelId: channel._id,
        userId: { $in: validMembersToRemove }
      });
    }

    await channel.save();

    const populatedChannel = await Channel.findById(channel._id)
      .populate('createdBy', 'name email')
      .populate('members', 'name email');

    return NextResponse.json<IApiResponse>({
      success: true,
      data: populatedChannel,
      message: 'Channel updated successfully'
    });

  } catch (error) {
    console.error('PUT channel error:', error);
    return NextResponse.json<IApiResponse>({
      success: false,
      message: 'Failed to update channel',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
