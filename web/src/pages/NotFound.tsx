import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-earth-300 mb-4">Error</p>
        <h1 className="text-[10rem] leading-none font-black text-earth-100 mb-0 select-none">
          404
        </h1>
        <h2 className="text-2xl font-black text-earth-900 uppercase tracking-tight mb-3 -mt-2">
          Page Not Found
        </h2>
        <p className="text-sm text-earth-500 mb-10 max-w-sm mx-auto leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/"
            className="px-6 py-3 bg-earth-900 text-white text-xs font-bold uppercase tracking-[0.15em] hover:bg-earth-700 transition-colors flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 border border-earth-300 text-xs font-bold uppercase tracking-[0.15em] text-earth-700 hover:border-earth-900 hover:text-earth-900 transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
