import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { PwaInstallButton } from '@/components/PwaInstallButton';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateOnlineStatus } from '@/hooks/useOnlineStatus';

interface AppLayoutProps {
  children: ReactNode;
  hideNavbar?: boolean;
}

export function AppLayout({ children, hideNavbar }: AppLayoutProps) {
  const { user } = useAuth();
  useUpdateOnlineStatus();
  console.log('[AppLayout] render — user:', !!user);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        {!hideNavbar && <Navbar />}
        {children}
        <BottomNav />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile: keep top navbar */}
          <div className="md:hidden">
            <Navbar />
          </div>

          {/* Desktop: slim header with sidebar trigger */}
          <header className="hidden md:flex h-12 items-center border-b border-border px-4">
            <SidebarTrigger className="mr-4" />
          </header>

          <main className="flex-1 pb-16 md:pb-0">
            {children}
          </main>

          <BottomNav />
          <PwaInstallButton />
        </div>
      </div>
    </SidebarProvider>
  );
}
