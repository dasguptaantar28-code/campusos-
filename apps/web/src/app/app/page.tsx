import { redirect } from 'next/navigation';

export default function AppRootRedirectPage() {
  redirect('/select-tenant');
}
