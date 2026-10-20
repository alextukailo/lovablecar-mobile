
import { StyleSheet, Text } from 'react-native';

interface FormErrorProps {
  message?: string;
}

export default function FormError({
  message,
}: FormErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <Text accessibilityRole="alert" style={styles.error}>
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  error: {
    fontSize: 13,
    color: '#EF4444',
  },
});
