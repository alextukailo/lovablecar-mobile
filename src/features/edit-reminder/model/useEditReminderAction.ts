
import {
    useUpdateReminder,
    type ReminderInput,
} from '../../../entities/reminder';

export function useEditReminderAction() {
  const mutation = useUpdateReminder();

  async function update(
    id: string,
    input: ReminderInput,
  ): Promise<void> {
    await mutation.mutateAsync({ id, input });
  }

  return {
    update,
    isSaving: mutation.isPending,
    error: mutation.error,
  };
}
