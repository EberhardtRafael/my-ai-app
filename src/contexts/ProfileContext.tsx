'use client';

import { useSession } from 'next-auth/react';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';

type ProfileData = {
  fullName: string;
  phone: string;
  location: string;
  about: string;
};

type ProfileContextValue = {
  profileData: ProfileData;
  displayName: string;
  setProfileData: (value: ProfileData) => void;
  isProfileReady: boolean;
};

const EMPTY_PROFILE: ProfileData = {
  fullName: '',
  phone: '',
  location: '',
  about: '',
};

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

const getProfileStorageKey = (userId: string) => `profile-info-${userId}`;

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [profileData, setProfileDataState] = useState<ProfileData>(EMPTY_PROFILE);
  const [isProfileReady, setIsProfileReady] = useState<boolean>(false);

  useEffect(() => {
    const userId = session?.user?.id;

    if (!userId) {
      setProfileDataState(EMPTY_PROFILE);
      setIsProfileReady(true);
      return;
    }

    const storageKey = getProfileStorageKey(userId);
    const raw = localStorage.getItem(storageKey);

    if (!raw) {
      setProfileDataState({
        ...EMPTY_PROFILE,
        fullName: session.user?.name || '',
      });
      setIsProfileReady(true);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<ProfileData>;
      setProfileDataState({
        fullName: parsed.fullName || session.user?.name || '',
        phone: parsed.phone || '',
        location: parsed.location || '',
        about: parsed.about || '',
      });
    } catch {
      setProfileDataState({
        ...EMPTY_PROFILE,
        fullName: session.user?.name || '',
      });
    } finally {
      setIsProfileReady(true);
    }
  }, [session?.user?.id, session?.user?.name]);

  const setProfileData = (value: ProfileData) => {
    setProfileDataState(value);

    const userId = session?.user?.id;
    if (!userId) {
      return;
    }

    const storageKey = getProfileStorageKey(userId);
    localStorage.setItem(storageKey, JSON.stringify(value));
  };

  const displayName = useMemo(() => {
    if (profileData.fullName.trim()) {
      return profileData.fullName.trim();
    }

    return session?.user?.name || session?.user?.email || '';
  }, [profileData.fullName, session?.user?.email, session?.user?.name]);

  const value = useMemo(
    () => ({ profileData, displayName, setProfileData, isProfileReady }),
    [profileData, displayName, isProfileReady]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }

  return context;
}
