import { getIronSession } from 'iron-session';
import mongoose from 'mongoose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { EventAutoReminderModel } from 'features/events/models';
import asOrgAuthorized from 'utils/api/asOrgAuthorized';
import requiredEnvVar from 'utils/requiredEnvVar';
import { AppSession } from 'utils/types';

type RouteMeta = {
  params: {
    eventId: string;
    orgId: string;
  };
};

type AutoReminderBody = {
  hoursBeforeEvent: number;
  startTime: string;
};

export async function GET(request: NextRequest, { params }: RouteMeta) {
  return asOrgAuthorized(
    {
      orgId: params.orgId,
      request,
      roles: ['organizer', 'admin'],
    },
    async ({ orgId }) => {
      await mongoose.connect(process.env.MONGODB_URL || '');

      const reminder = await EventAutoReminderModel.findOne({
        eventId: parseInt(params.eventId),
        orgId,
      });

      return NextResponse.json({ data: reminder }, { status: 200 });
    }
  );
}

export async function PUT(request: NextRequest, { params }: RouteMeta) {
  return asOrgAuthorized(
    {
      orgId: params.orgId,
      request,
      roles: ['organizer', 'admin'],
    },
    async ({ orgId }) => {
      const cookieStore = cookies();
      const session = await getIronSession<AppSession>(cookieStore, {
        cookieName: 'zsid',
        password: requiredEnvVar('SESSION_PASSWORD'),
      });

      if (!session.tokenData) {
        return NextResponse.json(
          { error: 'Not authenticated' },
          { status: 401 }
        );
      }

      const body: AutoReminderBody = await request.json();
      const { hoursBeforeEvent, startTime } = body;

      if (typeof hoursBeforeEvent !== 'number' || hoursBeforeEvent <= 0) {
        return NextResponse.json(
          { error: 'hoursBeforeEvent must be a positive number' },
          { status: 400 }
        );
      }

      if (!startTime) {
        return NextResponse.json(
          { error: 'startTime is required' },
          { status: 400 }
        );
      }

      await mongoose.connect(process.env.MONGODB_URL || '');

      const sendAt = new Date(
        new Date(startTime).getTime() - hoursBeforeEvent * 60 * 60 * 1000
      ).toISOString();

      const existing = await EventAutoReminderModel.findOne({
        eventId: parseInt(params.eventId),
        orgId,
      });

      const reminder = await EventAutoReminderModel.findOneAndUpdate(
        { eventId: parseInt(params.eventId), orgId },
        {
          hoursBeforeEvent,
          sendAt,
          sent: existing?.sent ?? false,
          tokenData: session.tokenData,
        },
        { new: true, upsert: true }
      );

      return NextResponse.json({ data: reminder }, { status: 200 });
    }
  );
}

export async function DELETE(request: NextRequest, { params }: RouteMeta) {
  return asOrgAuthorized(
    {
      orgId: params.orgId,
      request,
      roles: ['organizer', 'admin'],
    },
    async ({ orgId }) => {
      await mongoose.connect(process.env.MONGODB_URL || '');

      await EventAutoReminderModel.findOneAndDelete({
        eventId: parseInt(params.eventId),
        orgId,
      });

      return NextResponse.json({ data: null }, { status: 200 });
    }
  );
}
