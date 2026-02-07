'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import DemoModeToggle from './DemoModeToggle';

/**
 * Navigation component provides header with links and demo mode toggle
 * 
 * Requirements: 11.8, 12.7
 */
export default function Navigation() {
  const pathname = usePathname();
  const [demoMode, setDemoMode] = useState(false);

  // Load demo mode from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('demoMode');
    if (stored) {
      setDemoMode(stored === 'true');
    }
  }, []);

  // Save demo mode to localStorage when it changes
  const handleDemoModeChange = (enabled: boolean) => {
    setDemoMode(enabled);
    localStorage.setItem('demoMode', enabled.toString());
    
    // Dispatch custom event so other components can react to demo mode changes
    window.dispatchEvent(new CustomEvent('demoModeChange', { detail: { enabled } }));
  };

  const isActive = (path: string) => pathname === path;

  return (
    <header className="bg-white border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and main navigation */}
          <div className="flex items-center gap-8">
            <Link 
              href="/" 
              className="text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors"
            >
              Onboarding Intelligence
            </Link>
            
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/builder"
                className={`text-sm font-medium transition-colors ${
                  isActive('/builder')
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Build Context Pack
              </Link>
              
              <Link
                href="/onboard"
                className={`text-sm font-medium transition-colors ${
                  isActive('/onboard')
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Engineer Chat
              </Link>
            </div>
          </div>

          {/* Demo mode toggle */}
          <div className="flex items-center">
            <DemoModeToggle 
              enabled={demoMode} 
              onChange={handleDemoModeChange}
            />
          </div>
        </div>

        {/* Mobile navigation */}
        <div className="md:hidden pb-4 flex gap-4">
          <Link
            href="/builder"
            className={`text-sm font-medium transition-colors ${
              isActive('/builder')
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Build Context Pack
          </Link>
          
          <Link
            href="/onboard"
            className={`text-sm font-medium transition-colors ${
              isActive('/onboard')
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Engineer Chat
          </Link>
        </div>
      </nav>
    </header>
  );
}
