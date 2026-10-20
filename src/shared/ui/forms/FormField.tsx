
import type { LucideIcon } from 'lucide-react-native';
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import {
    StyleSheet, Text, TextInput, View,
    type TextInputProps,
} from 'react-native';

import FormError from '@/shared/ui/forms/FormError';

interface FormFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  placeholder?: string;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  maxLength?: number;
  autoCorrect?: boolean;
  icon?: LucideIcon;
  multiline?: boolean;
  numberOfLines?: number;
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
  icon: Icon,
  multiline = false,
  numberOfLines,
}: FormFieldProps<T>) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <Controller
        control={control}
        name={name}
        render={({ field, fieldState }) => (
          <>
            <View style={[
              styles.inputContainer,
              multiline && styles.multilineContainer,
              fieldState.error && styles.inputError,
            ]}>
              {Icon && (
                <Icon
                  size={20}
                  color="#17365A"
                  strokeWidth={2}
                  style={multiline ? styles.multilineIcon : undefined}
                />
              )}
              <TextInput
                value={String(field.value ?? '')}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder={placeholder}
                placeholderTextColor="#A4B7C9"
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
                autoCorrect={autoCorrect}
                maxLength={maxLength}
                multiline={multiline}
                numberOfLines={numberOfLines}
                textAlignVertical={multiline ? 'top' : 'center'}
                accessibilityLabel={label}
                style={[styles.input, multiline && styles.multilineInput]}
              />
            </View>
            <FormError message={fieldState.error?.message} />
          </>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#607C9B',
    marginLeft: 3,
  },
  inputContainer: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#DCEAF5',
    borderRadius: 12,
    backgroundColor: '#F8FBFF',
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '500',
    color: '#17365A',
  },
  multilineContainer: {
    minHeight: 94,
    alignItems: 'flex-start',
    paddingTop: 12,
  },
  multilineIcon: { marginTop: 3 },
  multilineInput: {
    minHeight: 80,
    paddingTop: 0,
    lineHeight: 22,
  },
  inputError: { borderColor: '#D84B4B' },
});
