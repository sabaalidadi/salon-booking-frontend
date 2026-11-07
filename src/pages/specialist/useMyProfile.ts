import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../../api/client';
import { specialistsApi } from '../../api/endpoints';
import type { SpecialistProfile } from '../../api/types';

/** Loads the logged-in specialist's profile; `missing` is true on 404. */
export function useMyProfile() {
  const [profile, setProfile] = useState<SpecialistProfile | null>(null);
  const [missing, setMissing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProfile(await specialistsApi.mine());
      setMissing(false);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) setMissing(true);
      else setError(e instanceof Error ? e.message : 'خطا');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { profile, setProfile, missing, setMissing, loading, error, reload };
}
