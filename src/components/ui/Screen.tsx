import { colors } from '@/theme/colors';
import { PropsWithChildren } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
} from 'react-native';

interface ScreenProps {
  scroll?: boolean;
}

export function Screen({
  children,
  scroll = false,
}: PropsWithChildren<ScreenProps>) {
  if (scroll) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    padding: 16,
    paddingBottom: 40,
  },
});
