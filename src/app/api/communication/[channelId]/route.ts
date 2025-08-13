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

  if (isValidObjectId(session.user.id)) {
    return { userId: session.user.id };
  }

  if (session.user.email) {
    const user = await User.findOne({ email: session.user.email }).select('_id');
    if (user) {
      return { userId: user._id.toString() };
    }
  }

  throw new Error('User not found in database');
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
        message: 'Unauthorized',
      }, { status: 401 });
    }

    if (!isValidObjectId(params.channelId)) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Invalid channel ID',
      }, { status: 400 });
    }

    const { userId } = await getUserFromSession(session as SessionData);

    const userChannel = await UserChannel.findOne({
      channelId: params.channelId,
      userId,
    });

    if (!userChannel) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'You do not have access to this channel',
      }, { status: 403 });
    }

    const channel = await Channel.findById(params.channelId)
      .populate('createdBy', 'name email')
      .populate('members', 'name email');

    if (!channel) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Channel not found',
      }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const messages = await Message.find({ channelId: params.channelId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name email');

    userChannel.lastRead = new Date();
    await userChannel.save();

    return NextResponse.json<IApiResponse>({
      success: true,
      data: {
        channel,
        messages: messages.reverse(),
        page,
        limit,
        total: await Message.countDocuments({ channelId: params.channelId }),
      },
      message: 'Channel data fetched successfully',
    });

  } catch (error) {
    console.error('GET channel details error:', error);
    return NextResponse.json<IApiResponse>({
      success: false,
      message: 'Failed to fetch channel details',
      error: error instanceof Error ? error.message : 'Unknown error',
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
        message: 'Unauthorized',
      }, { status: 401 });
    }

    const { content, attachments } = await request.json() as {
      content?: string;
      attachments?: string[];
    };

    if (!content && (!attachments || attachments.length === 0)) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Message content or attachments are required',
      }, { status: 400 });
    }

    if (!isValidObjectId(params.channelId)) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Invalid channel ID',
      }, { status: 400 });
    }

    const { userId } = await getUserFromSession(session as SessionData);

    const userChannel = await UserChannel.findOne({
      channelId: params.channelId,
      userId,
    });

    if (!userChannel) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'You do not have access to this channel',
      }, { status: 403 });
    }

    const message = await Message.create({
      content,
      sender: userId,
      channelId: params.channelId,
      attachments,
    });

    await Channel.findByIdAndUpdate(params.channelId, { updatedAt: new Date() });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email');

    return NextResponse.json<IApiResponse>({
      success: true,
      data: populatedMessage,
      message: 'Message sent successfully',
    });

  } catch (error) {
    console.error('POST message error:', error);
    return NextResponse.json<IApiResponse>({
      success: false,
      message: 'Failed to send message',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
