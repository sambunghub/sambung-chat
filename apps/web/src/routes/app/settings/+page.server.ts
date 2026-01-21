import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  // Redirect to account settings as default
  return redirect(302, '/app/settings/account');
};
