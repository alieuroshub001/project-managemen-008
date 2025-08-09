import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Channel from '@/models/Channel';
import Message from '@/models/Message';
import User from '@/models/User';
import UserChannel from '@/models/UserChannel';
import { IApiResponse } from '@/types';
import mongoose from 'mongoose';

// Helper function to validate ObjectId
function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id) && /^[a-fA-F0-9]{24}$/.test(id);
}

// Helper function to get user by session
async function getUserFromSession(session: any) {
  await connectToDatabase();
  
  // If session.user.id is already a valid ObjectId, use it
  if (isValidObjectId(session.user.id)) {
    return { userId: session.user.id };
  }
  
  // If not, try to find user by email or other identifier
  let user;
  if (session.user.email) {
    user = await User.findOne({ email: session.user.email }).select('_id');
  }
  
  if (!user) {
    throw new Error('User not found in database');
  }
  
  return { userId: user._id.toString() };
}

// Get channel details and messages
export async function GET(
  request: Request,
  { params }: { params: { channelId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    // Validate channelId
    if (!isValidObjectId(params.channelId)) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Invalid channel ID'
      }, { status: 400 });
    }

    // Get the actual user ID from the database
    const { userId } = await getUserFromSession(session);

    // Check if user has access to the channel
    const userChannel = await UserChannel.findOne({
      channelId: params.channelId,
      userId: userId
    });
    
    if (!userChannel) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'You do not have access to this channel'
      }, { status: 403 });
    }

    // Get channel details
    const channel = await Channel.findById(params.channelId)
      .populate('createdBy', 'name email')
      .populate('members', 'name email');

    if (!channel) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Channel not found'
      }, { status: 404 });
    }

    // Get messages (paginated)
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const messages = await Message.find({ channelId: params.channelId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name email');

    // Update last read time
    userChannel.lastRead = new Date();
    await userChannel.save();

    return NextResponse.json<IApiResponse>({
        success: true,
        data: {
            channel,
            messages: messages.reverse(), // Reverse to show oldest first in the UI
            page,
            limit,
            total: await Message.countDocuments({ channelId: params.channelId })
        },
        message: 'Channel data fetched successfully'
    });

  } catch (error) {
    console.error('GET channel details error:', error);
    return NextResponse.json<IApiResponse>({
      success: false,
      message: 'Failed to fetch channel details',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Post a new message to the channel
export async function POST(
  request: Request,
  { params }: { params: { channelId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    const { content, attachments } = await request.json();
    
    if (!content && (!attachments || attachments.length === 0)) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Message content or attachments are required'
      }, { status: 400 });
    }

    // Validate channelId
    if (!isValidObjectId(params.channelId)) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Invalid channel ID'
      }, { status: 400 });
    }

    // Get the actual user ID from the database
    const { userId } = await getUserFromSession(session);

    // Check if user has access to the channel
    const userChannel = await UserChannel.findOne({
      channelId: params.channelId,
      userId: userId
    });
    
    if (!userChannel) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'You do not have access to this channel'
      }, { status: 403 });
    }

    const message = await Message.create({
      content,
      sender: userId,
      channelId: params.channelId,
      attachments
    });

    // Update channel's updatedAt to show it's active
    await Channel.findByIdAndUpdate(params.channelId, { updatedAt: new Date() });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email');

    return NextResponse.json<IApiResponse>({
      success: true,
      data: populatedMessage,
      message: 'Message sent successfully'
    });

  } catch (error) {
    console.error('POST message error:', error);
    return NextResponse.json<IApiResponse>({
      success: false,
      message: 'Failed to send message',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}