
import { router } from 'expo-router';

import { useCreateReminderAction } from '../../../features/create-reminder';
import { ReminderForm } from '../../../features/reminder-form';

import type { ReminderInput } from '../../../entities/reminder';

export default function CreateReminderPage() {
  const { create, isSaving } = useCreateReminderAction();

  async function handleSubmit(
    input: ReminderInput,
  ): Promise<void> {
    await create(input);

    router.back();
  }

  return (
    <ReminderForm
      mode="create"
      saving={isSaving}
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
    />
  );
}
