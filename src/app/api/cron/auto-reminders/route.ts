import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

import { EventAutoReminderModel } from 'features/events/models';
import { stringToBool } from 'utils/stringUtils';

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  await mongoose.connect(process.env.MONGODB_URL || '');

  const now = new Date().toISOString();
  const dueReminders = await EventAutoReminderModel.find({
    sendAt: { $lte: now },
    sent: false,
  });

  const ssl = stringToBool(process.env.ZETKIN_USE_TLS);
  const protocol = ssl ? 'https' : 'http';
  const host = process.env.ZETKIN_API_HOST || 'api.zetkin.org';
  const port = process.env.ZETKIN_API_PORT;
  const hostAndPort = host + (port ? `:${port}` : '');
  const apiBase = `${protocol}://${hostAndPort}/v1`;

  const results = await Promise.allSettled(
    dueReminders.map(async (reminder) => {
      const res = await fetch(
        `${apiBase}/orgs/${reminder.orgId}/actions/${reminder.eventId}/reminders`,
        {
          headers: {
            Authorization: `Bearer ${reminder.tokenData.access_token}`,
            'Content-Type': 'application/json',
          },
          method: 'POST',
        }
      );

      if (!res.ok) {
        throw new Error(`Failed for event ${reminder.eventId}: ${res.status}`);
      }

      await EventAutoReminderModel.findByIdAndUpdate(reminder._id, {
        sent: true,
      });

      return reminder.eventId;
    })
  );

  const succeeded = results
    .filter((r) => r.status === 'fulfilled')
    .map((r) => (r as PromiseFulfilledResult<number>).value);
  const failed = results
    .filter((r) => r.status === 'rejected')
    .map((r) => (r as PromiseRejectedResult).reason?.message);

  return NextResponse.json({ data: { failed, succeeded } }, { status: 200 });
}
