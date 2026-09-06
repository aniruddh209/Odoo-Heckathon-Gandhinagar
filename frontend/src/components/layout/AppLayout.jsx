import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';

export const AppLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Desktop Persistent Sidebar */}
      <aside className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 z-30 shadow-xl transition-all duration-300 ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}>
        <Sidebar onCloseMobile={() => setMobileOpen(false)} isMobile={false} isCollapsed={isCollapsed} />
      </aside>

      {/* Mobile Sidebar Overlay / Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-xs h-full z-10 shadow-2xl">
            <Sidebar onCloseMobile={() => setMobileOpen(false)} isMobile={true} isCollapsed={false} />
          </div>
        </div>
      )}

      {/* Main Content Workspace */}
      <div className={`${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'} flex flex-col flex-1 min-w-0 transition-all duration-300`}>
        <TopHeader onOpenMobile={() => setMobileOpen(true)} onToggleCollapse={() => setIsCollapsed(!isCollapsed)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
