import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const PROFILE_IMAGE_KEY = 'mp_profile_image';

interface ProfileContextType {
  profileImage: string | null;
  setProfileImage: (img: string | null) => void;
}

const ProfileContext = createContext<ProfileContextType>({
  profileImage: null,
  setProfileImage: () => {},
});

export const useProfile = () => useContext(ProfileContext);

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    const savedImage = localStorage.getItem(PROFILE_IMAGE_KEY);
    if (savedImage) setProfileImage(savedImage);
  }, []);

  const handleSetProfileImage = (img: string | null) => {
    setProfileImage(img);
    if (img) localStorage.setItem(PROFILE_IMAGE_KEY, img);
    else localStorage.removeItem(PROFILE_IMAGE_KEY); // مسح الصورة
  };

  return (
    <ProfileContext.Provider value={{ profileImage, setProfileImage: handleSetProfileImage }}>
      {children}
    </ProfileContext.Provider>
  );
};
