import React from 'react';

/**
 * Universal atomic skeleton element with smooth shimmer pulse
 */
export const Skeleton = ({ className = '', ...props }) => {
  return (
    <div
      className={`animate-pulse bg-slate-200/80 rounded-md ${className}`}
      {...props}
    />
  );
};

export const SkeletonText = ({ lines = 1, className = '', gap = 'gap-2' }) => {
  return (
    <div className={`flex flex-col ${gap} ${className}`}>
      {Array.from({ length: lines }).map((_, idx) => (
        <Skeleton
          key={idx}
          className={`h-4 ${idx === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  );
};

export const SkeletonCircle = ({ size = 'w-10 h-10', className = '' }) => {
  return <Skeleton className={`rounded-full ${size} ${className}`} />;
};

/**
 * Skeleton for standard KPI Metric Card
 */
export const SkeletonMetricCard = ({ className = '' }) => {
  return (
    <div className={`p-4 rounded-xl border border-slate-200/80 bg-white shadow-xs space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="w-8 h-8 rounded-lg" />
      </div>
      <Skeleton className="h-7 w-32" />
      <div className="flex items-center gap-2 pt-1">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
};

/**
 * Skeleton for tabular data listings
 */
export const SkeletonTable = ({ rows = 5, cols = 5, className = '' }) => {
  return (
    <div className={`w-full overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs ${className}`}>
      {/* Table Header Placeholder */}
      <div className="bg-slate-50/80 border-b border-slate-200/80 py-3.5 px-4 flex items-center gap-4">
        {Array.from({ length: cols }).map((_, idx) => (
          <Skeleton key={idx} className={`h-3.5 ${idx === 0 ? 'w-28' : 'w-20'} flex-1`} />
        ))}
      </div>
      {/* Table Rows Placeholder */}
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="py-4 px-4 flex items-center gap-4">
            {Array.from({ length: cols }).map((_, cIdx) => (
              <Skeleton
                key={cIdx}
                className={`h-4 ${cIdx === 0 ? 'w-36' : cIdx === 1 ? 'w-48' : 'w-24'} flex-1`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton for Standard Page Header
 */
export const SkeletonPageHeader = ({ className = '' }) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 ${className}`}>
      <div className="space-y-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-3.5 w-80" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
    </div>
  );
};

/**
 * Skeleton for Dashboard Views (Metric Cards + Main Content + Activity Feed)
 */
export const SkeletonDashboard = () => {
  return (
    <div className="space-y-6">
      <SkeletonPageHeader />
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SkeletonMetricCard />
        <SkeletonMetricCard />
        <SkeletonMetricCard />
        <SkeletonMetricCard />
      </div>
      {/* Middle Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 p-5 rounded-xl border border-slate-200/80 bg-white shadow-xs space-y-4">
          <Skeleton className="h-5 w-48" />
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        </div>
        <div className="lg:col-span-5 p-5 rounded-xl border border-slate-200/80 bg-white shadow-xs space-y-4">
          <Skeleton className="h-5 w-40" />
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </div>
      </div>
      {/* Bottom Table */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-48" />
        <SkeletonTable rows={5} cols={6} />
      </div>
    </div>
  );
};

/**
 * Skeleton for Quotation Builder
 */
export const SkeletonQuoteBuilder = () => {
  return (
    <div className="space-y-6">
      <SkeletonPageHeader />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          <div className="p-6 rounded-xl border border-slate-200/80 bg-white shadow-xs space-y-4">
            <Skeleton className="h-5 w-36" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
          <div className="p-6 rounded-xl border border-slate-200/80 bg-white shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-8 w-28 rounded-lg" />
            </div>
            <SkeletonTable rows={3} cols={5} />
          </div>
        </div>
        <div className="lg:col-span-4 p-6 rounded-xl border border-slate-200/80 bg-white shadow-xs space-y-4 sticky top-20">
          <Skeleton className="h-6 w-36" />
          <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-8 w-full mt-4 rounded-lg" />
          </div>
          <Skeleton className="h-10 w-full rounded-lg mt-6" />
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton for Quotation Detail Page
 */
export const SkeletonQuoteDetail = () => {
  return (
    <div className="space-y-6">
      {/* Sticky Header Skeleton */}
      <div className="p-5 rounded-xl border border-slate-200/80 bg-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-4 border-b border-slate-200 pb-2">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-6 w-24" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <SkeletonTable rows={4} cols={6} />
        </div>
        <div className="lg:col-span-4 p-5 rounded-xl border border-slate-200/80 bg-white shadow-xs space-y-4">
          <Skeleton className="h-5 w-32" />
          <div className="space-y-2.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-6 w-3/4 pt-2" />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton for Customer Portal
 */
export const SkeletonPortal = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-8 py-8 px-4">
      <div className="flex items-center justify-between pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3.5 w-48" />
          </div>
        </div>
        <Skeleton className="h-8 w-36 rounded-lg" />
      </div>
      <div className="p-8 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-60" />
          </div>
          <Skeleton className="h-7 w-28 rounded-full" />
        </div>
        <SkeletonTable rows={3} cols={4} />
        <div className="flex justify-between items-center pt-4 border-t border-slate-200">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-44 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export default Skeleton;
