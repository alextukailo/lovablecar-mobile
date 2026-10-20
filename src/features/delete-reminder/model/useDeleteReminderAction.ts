import { useDeleteReminder } from '../../../entities/reminder';

export function useDeleteReminderAction() {
  const mutation = useDeleteReminder();

  return {
    remove: mutation.mutateAsync,
    isDeleting: mutation.isPending,
  };
}
