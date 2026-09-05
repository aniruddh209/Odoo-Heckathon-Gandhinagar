import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { portalApi } from '../api';
import { CustomerProposalView } from '../components/portal/CustomerProposalView';
import { LoadingSpinner, ErrorAlert, Button } from '../components/ui';
import { ShieldCheck, Zap, ArrowLeft, Headphones } from 'lucide-react';

export const CustomerPortalDetailPage = () => {
  const { token } = useParams();
  const [quote, setQuote] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCustomerQuote();
  }, [token]);

  const loadCustomerQuote = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await portalApi.getQuoteByToken(token);
      setQuote(data);
    } catch (err) {
      setError(
        err.message ||
          'This commercial quotation link is invalid, expired, or access has been restricted.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <LoadingSpinner
          message="Verifying secure cryptographic access link..."
          size="lg"
        />
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-4">
          <ErrorAlert
            title="Quotation Unavailable"
            message={
              error ||
              'This secure quotation link has expired or reached the maximum authentication attempts.'
            }
          />
          <div className="text-center pt-2">
            <Link to="/login">
              <Button variant="outline" size="sm" icon={ArrowLeft}>
                Return to Customer Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/75 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Executive Customer Portal Navigation Bar */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-sm">
              <Zap className="w-5 h-5 fill-white text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-lg">
                  DealFlow<span className="text-blue-600">360</span>
                </span>
                <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                  Client Proposal Portal
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Cryptographically secured client workspace
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-600 font-medium bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verified Client Token Session</span>
            </div>

            <a
              href="mailto:support@dealflow360.io"
              className="text-xs font-semibold text-slate-600 hover:text-blue-600 flex items-center gap-1.5 transition-colors"
            >
              <Headphones className="w-3.5 h-3.5" />
              Support
            </a>
          </div>
        </header>

        {/* Primary Customer Proposal View */}
        <main>
          <CustomerProposalView
            quote={quote}
            token={token}
            onRefresh={loadCustomerQuote}
          />
        </main>

        {/* Client Footer */}
        <footer className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} DealFlow360 Technologies, Inc. All rights reserved.</p>
          <p>Confidential proposal prepared exclusively for {quote.customerName}.</p>
        </footer>
      </div>
    </div>
  );
};

export default CustomerPortalDetailPage;
