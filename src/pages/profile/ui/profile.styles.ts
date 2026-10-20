import { StyleSheet } from 'react-native';

export const COLORS = {
  navy: '#102C4B',
  text: '#17365A',
  muted: '#7691AA',
  blue: '#1789E8',
  sky: '#DDF2FF',
  yellow: '#FFD23F',
  white: '#FFFFFF',
  background: '#F7FBFF',
  border: '#E7EFF7',
  red: '#D84B4B',
  green: '#218C83',
};

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  hero: {
    height: 300,
    backgroundColor: COLORS.sky,
    overflow: 'hidden',
  },

  topbar: {
    height: 48,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    width: 48,
    height: 44,
    justifyContent: 'center',
  },

  headerSpacer: {
    width: 48,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.navy,
  },

  heroContent: {
    marginTop: 28,
    marginHorizontal: 24,
    alignSelf: 'flex-start',
    padding: 15,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.86)',
  },

  heroEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: COLORS.blue,
    marginBottom: 9,
  },

  heroTitle: {
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: COLORS.navy,
  },

  content: {
    marginTop: -22,
    paddingTop: 1,
    paddingHorizontal: 20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: COLORS.background,
  },

  profileCard: {
    marginTop: -41,
    marginHorizontal: 4,
    paddingTop: 18,
    paddingBottom: 22,
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },

  avatarOuter: {
    width: 98,
    height: 98,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#DDF2FF',
    borderWidth: 3,
    borderColor: COLORS.white,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarImage: {
    width: '100%',
    height: '100%',
  },

  avatarInitials: {
    fontSize: 31,
    fontWeight: '800',
    color: COLORS.navy,
  },

  avatarCheck: {
    position: 'absolute',
    right: 0,
    bottom: 5,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },

  profileName: {
    marginTop: 10,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: COLORS.navy,
    textAlign: 'center',
  },

  profileUsername: {
    marginTop: 5,
    fontSize: 14,
    color: COLORS.muted,
  },

  accountBadge: {
    marginTop: 16,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#E9F7F2',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  accountBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.green,
  },

  section: {
    marginTop: 26,
  },

  sectionTitle: {
    marginBottom: 12,
    marginLeft: 3,
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.navy,
  },

  detailsCard: {
    paddingHorizontal: 17,
    borderRadius: 21,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  detailRow: {
    minHeight: 65,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 12,
  },

  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF7FD',
    alignItems: 'center',
    justifyContent: 'center',
  },

  detailText: {
    flex: 1,
    gap: 5,
  },

  detailLabel: {
    fontSize: 12,
    color: COLORS.muted,
  },

  detailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
  },

  telegramCard: {
    padding: 16,
    borderRadius: 21,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },

  telegramIcon: {
    width: 49,
    height: 49,
    borderRadius: 15,
    backgroundColor: '#249BDF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  telegramContent: {
    flex: 1,
    gap: 5,
  },

  telegramTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.navy,
  },

  telegramSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.muted,
  },

  connectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  sectionHint: {
    marginTop: 10,
    marginHorizontal: 4,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.muted,
  },

  signOutCard: {
    minHeight: 66,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },

  signOutIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: '#FFF0ED',
    alignItems: 'center',
    justifyContent: 'center',
  },

  signOutText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.red,
  },

  footer: {
    marginTop: 35,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.7,
    color: '#B3C7D8',
    textAlign: 'center',
  },
});
