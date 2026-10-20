
import { api } from '../../../../lib/api';

export type CustomReminder = {
  id: string;
  text: string;
  scheduledAt: string;
  timeZone: string;
  status: 'PENDING' | 'SENDING' | 'SENT' | 'FAILED';
  createdAt: string;
  sentAt: string | null;
};

export type ReminderInput = {
  text: string;
  scheduledAt: string;
  timeZone: string;
};

const ENDPOINT = '/custom-notifications';

export async function getReminders(): Promise<CustomReminder[]> {
  const response = await api.get<CustomReminder[]>(ENDPOINT);
  return response.data;
}

export async function createReminder(
  input: ReminderInput,
): Promise<CustomReminder> {
  const response = await api.post<CustomReminder>(
    ENDPOINT,
    input,
  );
  return response.data;
}

export async function updateReminder(
  id: string,
  input: ReminderInput,
): Promise<CustomReminder> {
  const response = await api.patch<CustomReminder>(
    `${ENDPOINT}/${encodeURIComponent(id)}`,
    input,
  );
  return response.data;
}

export async function deleteReminder(id: string): Promise<void> {
  await api.delete(
    `${ENDPOINT}/${encodeURIComponent(id)}`,
  );
}
