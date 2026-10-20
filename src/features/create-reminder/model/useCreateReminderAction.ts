
import {
    useCreateReminder,
    type ReminderInput,
} from '../../../entities/reminder';

export function useCreateReminderAction() {
  const mutation = useCreateReminder();

  async function create(input: ReminderInput): Promise<void> {
    await mutation.mutateAsync(input);
  }

  return {
    create,
    isSaving: mutation.isPending,
    error: mutation.error,
  };
}
