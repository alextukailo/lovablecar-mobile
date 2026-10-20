
import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';

import {
    createReminder,
    deleteReminder,
    getReminders,
    updateReminder,
} from '../api/reminder.api';

import type {
    CustomReminder,
    ReminderInput,
} from './types';

export const reminderKeys = {
  all: ['custom-notifications'] as const,
};

export function useReminders() {
  return useQuery<CustomReminder[]>({
    queryKey: reminderKeys.all,
    queryFn: getReminders,
  });
}

export function useCreateReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ReminderInput) =>
      createReminder(input),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: reminderKeys.all,
      });
    },
  });
}

export function useUpdateReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: ReminderInput;
    }) => updateReminder(id, input),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: reminderKeys.all,
      });
    },
  });
}

export function useDeleteReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      deleteReminder(id),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: reminderKeys.all,
      });
    },
  });
}
