import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function SectionHeading({ title, action }: { title: string; action?: ReactNode }) {
  return <View style={styles.row}><Text style={styles.title}>{title}</Text>{action}</View>;
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, title: { fontSize: 20, fontWeight: '800', color: '#102647' } });
