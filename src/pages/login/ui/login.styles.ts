import { StyleSheet } from 'react-native';

export const COLORS = {
  navy: '#102647',
  blue: '#41668B',
  sky: '#EAF6FF',
  white: '#FFFFFF',
  yellow: '#FFD33F',
  muted: '#8295A8',
  green: '#22A06B',
};

export const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(234, 246, 255, 0.18)',
  },

  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  keyboardView: {
    flex: 1,
  },

  scroll: {
    flex: 1,
  },

  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 35,
    paddingBottom: 35,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },

  brandSection: {
    alignItems: 'center',
    marginBottom: 34,
  },

  logo: {
    width: 72,
    height: 72,
    borderRadius: 23,
    backgroundColor: COLORS.yellow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 17,
    shadowColor: COLORS.navy,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },

  brand: {
    fontSize: 33,
    fontWeight: '900',
    color: COLORS.navy,
    textAlign: 'center',
    letterSpacing: -1.1,
  },

  tagline: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.blue,
    textAlign: 'center',
    marginTop: 8,
  },

  card: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 26,
    padding: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: COLORS.navy,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.08,
    shadowRadius: 22,
    elevation: 4,
  },

  title: {
    fontSize: 25,
    fontWeight: '800',
    color: COLORS.navy,
    textAlign: 'center',
    letterSpacing: -0.6,
  },

  description: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.blue,
    textAlign: 'center',
    marginTop: 12,
  },

  button: {
    marginTop: 28,
    minHeight: 56,
    backgroundColor: COLORS.yellow,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 12,
  },

  buttonPressed: {
    opacity: 0.75,
  },

  buttonText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.navy,
    textAlign: 'center',
    flexShrink: 1,
  },

  codeCard: {
    marginTop: 24,
    backgroundColor: COLORS.sky,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D7EAF8',
  },

  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  codeLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.blue,
    letterSpacing: 1,
  },

  code: {
    fontSize: 37,
    fontWeight: '900',
    letterSpacing: 5,
    color: COLORS.navy,
    marginTop: 14,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },

  copiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },

  codeHelp: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.blue,
  },

  codeWarning: {
    marginTop: 15,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    color: COLORS.muted,
  },

  spinner: {
    marginTop: 25,
  },

  waitingRow: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  waitingText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.blue,
    flexShrink: 1,
  },

  secondaryButton: {
    marginTop: 20,
    alignItems: 'center',
    padding: 12,
  },

  secondaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.blue,
  },

  successIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: COLORS.green,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 18,
  },

  userName: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.blue,
  },

  footer: {
    marginTop: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  footerText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.navy,
  },
});
