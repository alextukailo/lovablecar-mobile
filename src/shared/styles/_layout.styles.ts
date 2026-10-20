import { StyleSheet } from 'react-native';

export const COLORS = {
  navy: '#092747',
  blue: '#1476C8',
  muted: '#7893AA',
  yellow: '#FFCC32',
  white: '#FFFFFF',
  border: '#E0EDF6',
  red: '#C62828',
  green: '#16845B',
};

export const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F6F9',
  },

  tabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    height: 78,
    paddingTop: 6,
    paddingBottom: 12,
    paddingHorizontal: 8,
    shadowColor: COLORS.navy,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: -3,
    },
    elevation: 6,
  },

  tabBarItem: {
    paddingTop: 0,
  },

  tabBarIconStyle: {
    marginBottom: 0,
  },

  tabBarLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },

  tabIconContainer: {
    width: 48,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabIconActive: {},

  headerAvatarButton: {
    marginRight: 16,
    padding: 4,
  },

  avatar: {
    backgroundColor: '#DDF1FB',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D2E9F7',
  },

  avatarInitials: {
    color: COLORS.blue,
    fontWeight: '800',
  },

  modalRoot: {
    flex: 1,
    justifyContent: 'flex-start',
  },

  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(9, 39, 71, 0.42)',
  },

  popup: {
    position: 'absolute',
    top: 65,
    right: 16,
    width: 320,
    maxWidth: '90%',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 18,
    shadowColor: COLORS.navy,
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 10,
  },

  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  profileInfo: {
    flex: 1,
    marginLeft: 12,
  },

  profileName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.navy,
  },

  profileUsername: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.muted,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  sectionTitle: {
    color: COLORS.navy,
    fontWeight: '800',
    fontSize: 14,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  statusMuted: {
    color: COLORS.muted,
    fontSize: 13,
  },

  connectedBox: {
    backgroundColor: '#EDF9F2',
    borderRadius: 12,
    padding: 12,
  },

  connectedText: {
    color: COLORS.green,
    fontSize: 14,
    fontWeight: '800',
  },

  statusDescription: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    marginBottom: 8,
  },

  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    gap: 10,
  },

  notificationInfo: {
    flex: 1,
  },

  notificationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  notificationTitle: {
    color: COLORS.navy,
    fontSize: 13,
    fontWeight: '700',
  },

  notificationDescription: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 5,
    marginLeft: 24,
  },

  connectButton: {
    marginTop: 8,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: COLORS.blue,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 9,
  },

  connectText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },

  disconnectButton: {
    borderWidth: 1,
    borderColor: '#F4D6D6',
    backgroundColor: '#FFF6F6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
  },

  disconnectText: {
    color: COLORS.red,
    fontSize: 13,
    fontWeight: '700',
  },

  errorText: {
    color: COLORS.red,
    fontSize: 12,
    marginTop: 10,
  },

  disabledButton: {
    opacity: 0.6,
  },

  logoutButton: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#FFF0F0',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
  },

  logoutText: {
    color: COLORS.red,
    fontSize: 15,
    fontWeight: '800',
  },

  confirmOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(9, 39, 71, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  confirmCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },

  confirmIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  confirmTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.navy,
    textAlign: 'center',
  },

  confirmDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 22,
  },

  confirmDisconnectButton: {
    width: '100%',
    backgroundColor: COLORS.red,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },

  confirmDisconnectText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },

  cancelButton: {
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
    marginTop: 4,
  },

  cancelText: {
    color: COLORS.navy,
    fontSize: 14,
    fontWeight: '700',
  },
});
