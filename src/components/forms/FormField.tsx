
import {
    Controller,
    type Control,
    type FieldPath,
    type FieldValues,
} from 'react-hook-form';
import {
    StyleSheet,
    Text,
    TextInput,
    View,
    type TextInputProps,
} from 'react-native';

import FormError from './FormError';

interface FormFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  placeholder?: string;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  maxLength?: number;
  autoCorrect?: boolean;
}

export default function FormField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  maxLength,
  autoCorrect,
}: FormFieldProps<T>) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <Controller
        control={control}
        name={name}
        render={({ field, fieldState }) => (
          <>
            <TextInput
              value={String(field.value ?? '')}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder={placeholder}
              placeholderTextColor="#A3A3A3"
              keyboardType={keyboardType}
              autoCapitalize={autoCapitalize}
              autoCorrect={autoCorrect}
              maxLength={maxLength}
              accessibilityLabel={label}
              accessibilityHint={fieldState.error?.message}
              style={[
                styles.input,
                fieldState.error && styles.inputError,
              ]}
            />

            <FormError message={fieldState.error?.message} />
          </>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#404040',
  },
  input: {
    minHeight: 52,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#171717',
  },
  inputError: {
    borderColor: '#EF4444',
  },
});
