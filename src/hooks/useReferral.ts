import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Captures ?ref=CODE from the URL and stores it in sessionStorage.
 * After signup, call processReferral(userId) to record the referral.
 */
export function captureReferralCode() {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  if (ref) {
    sessionStorage.setItem('orbikut_ref', ref);
    // Clean URL
    const url = new URL(window.location.href);
    url.searchParams.delete('ref');
    window.history.replaceState({}, '', url.toString());
  }
}

export async function processReferral(newUserId: string) {
  const refCode = sessionStorage.getItem('orbikut_ref');
  if (!refCode) return;

  try {
    // Find referrer by code
    const { data: referrer } = await supabase
      .from('profiles')
      .select('id')
      .eq('referral_code', refCode)
      .single();

    if (referrer && referrer.id !== newUserId) {
      await supabase.from('referrals').insert({
        referrer_id: referrer.id,
        referred_id: newUserId,
      });
    }
  } catch {
    // silently fail
  } finally {
    sessionStorage.removeItem('orbikut_ref');
  }
}
