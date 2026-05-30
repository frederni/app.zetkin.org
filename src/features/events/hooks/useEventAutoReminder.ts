import { useCallback, useEffect, useState } from 'react';

export type EventAutoReminderData = {
  hoursBeforeEvent: number;
  sendAt: string;
  sent: boolean;
} | null;

export default function useEventAutoReminder(orgId: number, eventId: number) {
  const [data, setData] = useState<EventAutoReminderData>(null);
  const [loading, setLoading] = useState(true);

  const fetchReminder = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/beta/orgs/${orgId}/events/${eventId}/auto-reminder`
      );
      if (res.ok) {
        const body = await res.json();
        setData(body.data);
      }
    } finally {
      setLoading(false);
    }
  }, [orgId, eventId]);

  useEffect(() => {
    fetchReminder();
  }, [fetchReminder]);

  const setAutoReminder = async (
    hoursBeforeEvent: number,
    startTime: string
  ) => {
    const res = await fetch(
      `/beta/orgs/${orgId}/events/${eventId}/auto-reminder`,
      {
        body: JSON.stringify({ hoursBeforeEvent, startTime }),
        headers: { 'Content-Type': 'application/json' },
        method: 'PUT',
      }
    );
    if (res.ok) {
      const body = await res.json();
      setData(body.data);
    }
  };

  const deleteAutoReminder = async () => {
    const res = await fetch(
      `/beta/orgs/${orgId}/events/${eventId}/auto-reminder`,
      { method: 'DELETE' }
    );
    if (res.ok) {
      setData(null);
    }
  };

  return { data, deleteAutoReminder, loading, setAutoReminder };
}
