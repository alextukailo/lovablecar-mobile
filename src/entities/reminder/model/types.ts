
export type ReminderStatus =
  | 'PENDING'
  | 'SENDING'
  | 'SENT'
  | 'FAILED';

export type CustomReminder = {
  id: string;
  text: string;
  scheduledAt: string;
  timeZone: string;
  status: ReminderStatus;
  createdAt: string;
  sentAt: string | null;
};

export type ReminderInput = {
  text: string;
  scheduledAt: string;
  timeZone: string;
};
