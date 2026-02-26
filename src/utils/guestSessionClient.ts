let guestUserIdPromise: Promise<string | null> | null = null;

export const getGuestUserId = async (): Promise<string | null> => {
  if (!guestUserIdPromise) {
    guestUserIdPromise = fetch('/api/auth/guest-session', {
      method: 'GET',
      cache: 'no-store',
    })
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }

        const payload = await response.json();
        return payload?.userId || null;
      })
      .catch(() => null);
  }

  return guestUserIdPromise;
};

export const getEffectiveUserId = async (
  authenticatedUserId?: string | null
): Promise<string | null> => {
  if (authenticatedUserId) {
    return authenticatedUserId;
  }

  return getGuestUserId();
};
