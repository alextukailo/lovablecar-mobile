import {
    createContext,
    useContext,
    type ReactNode,
} from 'react';

type ProfileMenuContextValue = {
  openProfile: () => void;
};

const ProfileMenuContext =
  createContext<ProfileMenuContextValue | null>(null);

export function ProfileMenuProvider({
  openProfile,
  children,
}: {
  openProfile: () => void;
  children: ReactNode;
}) {
  return (
    <ProfileMenuContext.Provider value={{ openProfile }}>
      {children}
    </ProfileMenuContext.Provider>
  );
}

export function useProfileMenu() {
  const context = useContext(ProfileMenuContext);

  if (!context) {
    throw new Error(
      'useProfileMenu must be used inside ProfileMenuProvider',
    );
  }

  return context;
}
