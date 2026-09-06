import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';

export const AppLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex bg-slate-50 overflow-x-hidden">
      {/* Desktop Persistent Sidebar */}
      <aside className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 z-30 shadow-xl transition-all duration-300 ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}>
        <Sidebar onCloseMobile={() => setMobileOpen(false)} isMobile={false} isCollapsed={isCollapsed} />
      </aside>

      {/* Mobile Sidebar Overlay / Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-80 max-w-[85vw] h-full z-10 shadow-2xl animate-in slide-in-from-left duration-250">
            <Sidebar onCloseMobile={() => setMobileOpen(false)} isMobile={true} isCollapsed={false} />
          </div>
        </div>
      )}

      {/* Main Content Workspace */}
      <div className={`${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'} flex flex-col flex-1 min-w-0 transition-all duration-300`}>
        <TopHeader onOpenMobile={() => setMobileOpen(true)} onToggleCollapse={() => setIsCollapsed(!isCollapsed)} />

        <main className="flex-1 px-3 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
