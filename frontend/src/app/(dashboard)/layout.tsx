import DashboardLayout from '@/components/DashboardLayout';
import { PersonaProvider } from '@/contexts/PersonaContext';

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PersonaProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </PersonaProvider>
  );
}