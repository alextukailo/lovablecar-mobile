import { StyleSheet } from 'react-native';

export const C = {
  navy: '#102C4B',
  blue: '#1689DC',
  muted: '#7892AA',
  sky: '#EAF6FF',
  background: '#F6FAFD',
  white: '#FFFFFF',
  yellow: '#FFD23F',
  border: '#E2ECF5',
  green: '#218C83',
  red: '#D64B4B',
};

export const styles = StyleSheet.create({
  flex: { flex: 1 },

  screen: {
    flex: 1,
    backgroundColor: C.background,
  },

  scrollContent: {
    paddingHorizontal: 20,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: C.navy,
  },

  intro: {
    marginTop: 26,
    marginBottom: 18,
  },

  introIcon: {
    width: 54,
    height: 54,
    borderRadius: 17,
    backgroundColor: C.sky,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },

  title: {
    fontSize: 27,
    lineHeight: 32,
    fontWeight: '800',
    color: C.navy,
    letterSpacing: -0.6,
  },

  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: C.muted,
  },

  carLabel: {
    alignSelf: 'flex-start',
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: C.sky,
    color: C.navy,
    fontWeight: '700',
    fontSize: 12,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: C.navy,
    marginTop: 22,
    marginBottom: 12,
  },

  card: {
    backgroundColor: C.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    padding: 18,
  },

  cardDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: C.muted,
    marginBottom: 18,
  },

  typeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  typeIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: C.sky,
    alignItems: 'center',
    justifyContent: 'center',
  },

  typeName: {
    fontSize: 15,
    fontWeight: '800',
    color: C.navy,
  },

  typeHint: {
    fontSize: 12,
    color: C.muted,
    marginTop: 5,
  },

  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: C.border,
    marginTop: 14,
    gap: 10,
  },

  optionName: {
    fontSize: 14,
    fontWeight: '700',
    color: C.navy,
  },

  optionHint: {
    fontSize: 12,
    color: C.muted,
    marginTop: 4,
    lineHeight: 17,
  },

  fieldRow: {
    flexDirection: 'row',
    gap: 12,
  },

  halfField: {
    flex: 1,
  },

  field: {
    marginBottom: 15,
  },

  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.muted,
    marginBottom: 8,
  },

  input: {
    height: 52,
    paddingHorizontal: 14,
    borderRadius: 13,
    backgroundColor: '#F6FAFD',
    borderWidth: 1,
    borderColor: C.border,
    color: C.navy,
    fontSize: 15,
    fontWeight: '700',
  },

  fieldHelp: {
    color: C.muted,
    fontSize: 12,
    marginTop: -5,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 2,
  },

  infoText: {
    flex: 1,
    color: C.muted,
    fontSize: 12,
    lineHeight: 18,
  },

  nextCard: {
    marginTop: 16,
    padding: 17,
    borderRadius: 19,
    backgroundColor: '#EAF6FF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  nextIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  nextLabel: {
    fontSize: 12,
    color: C.muted,
  },

  nextValue: {
    fontSize: 21,
    fontWeight: '800',
    color: C.navy,
    marginTop: 4,
  },

  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  reminderIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: C.sky,
    alignItems: 'center',
    justifyContent: 'center',
  },

  reminderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: C.navy,
  },

  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 18,
  },

  notesInput: {
    minHeight: 95,
    color: C.navy,
    fontSize: 14,
    lineHeight: 21,
  },

  saveButton: {
    height: 56,
    borderRadius: 17,
    backgroundColor: C.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 28,
  },

  saveText: {
    fontSize: 16,
    fontWeight: '800',
    color: C.navy,
  },

  disabledButton: {
    opacity: 0.6,
  },

  errorText: {
    color: C.red,
    marginTop: 20,
    fontSize: 13,
  },
});
