import { redirect } from '@/i18n/navigation';

export default function SettingsPage() {
  redirect('/profile?tab=account-settings');
}
