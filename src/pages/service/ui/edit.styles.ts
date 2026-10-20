import { StyleSheet } from 'react-native';

export const COLORS = {
  navy: '#102647',
  blue: '#41668B',
  sky: '#EAF6FF',
  white: '#FFFFFF',
  yellow: '#FFD33F',
};

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.sky,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.navy,
  },
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
  },
  introIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#FFF0B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  introText: {
    flex: 1,
  },
  introTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.navy,
  },
  introSubtitle: {
    marginTop: 5,
    color: COLORS.blue,
    fontSize: 13,
    lineHeight: 19,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: '#E2EDF6',
  },
  footer: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.blue,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.sky,
    padding: 24,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 14,
    color: COLORS.blue,
  },
  errorTitle: {
    color: COLORS.navy,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 16,
  },
  errorDescription: {
    color: COLORS.blue,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  errorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    backgroundColor: COLORS.yellow,
    paddingHorizontal: 25,
    paddingVertical: 14,
    borderRadius: 15,
    minWidth: 160,
  },
  errorButtonText: {
    color: COLORS.navy,
    fontSize: 15,
    fontWeight: '800',
  },
  goBackButton: {
    marginTop: 20,
    padding: 10,
  },
  goBackText: {
    color: COLORS.blue,
    fontSize: 14,
    fontWeight: '700',
  },
});
