import React from 'react';
import { Outlet } from 'react-router-dom';
import { TopNav } from './TopNav.jsx';
import { Sidebar } from './Sidebar.jsx';

export const AppLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <TopNav />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
