export let userProfile = {
  fullName: "Kelvin Manalad",
  unitLocation: "Unit 402, Tower 1",
  email: "kelvin.manalad@gridwatch.com",
  avatarUrl: null,
  initial: "KM",
};

export const updateUserProfile = (updates) => {
  userProfile = { ...userProfile, ...updates };
  if (updates.fullName) {
    userProfile.initial = updates.fullName.substring(0, 2).toUpperCase();
  }
};
