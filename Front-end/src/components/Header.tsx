// src/components/Header.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { useProfile } from '@/contexts/ProfileContext';
import { Menu, Search } from 'lucide-react';
import { User } from 'lucide-react';

const Header: React.FC = () => {
  const { translation, language, toggleTheme, theme, isLoggedIn } = useApp();
  const location = useLocation();
  const { profileImage } = useProfile();
  const userRaw = sessionStorage.getItem('mp_user');
  const user = userRaw ? JSON.parse(userRaw) : null;

  const isActive = (path: string) => location.pathname === path;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
        setShowSearch(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-card shadow-lg border-b manga-transition">
      <div className="w-full px-4 md:px-6">
        <div className="flex justify-between items-center w-full flex-wrap gap-4">
          {/* Left: Logo */}
          <div className="flex-1 flex justify-start px-2">
            <Link to="/" className="flex items-center gap-3">
              <img
                src="/images/icon.jpg"
                alt={translation.siteName}
                className="w-24 h-24 object-contain"
                loading="lazy"
              />
            </Link>
          </div>

          {/* Center: Navigation Links */}
          <nav className="hidden md:flex flex-1 justify-center items-center gap-6 px-2">
            <Link to="/" className={isActive('/') ? 'text-primary font-medium' : 'text-foreground/80 hover:text-primary'}>
              {translation.home}
            </Link>
            <Link to="/browse" className={isActive('/browse') ? 'text-primary font-medium' : 'text-foreground/80 hover:text-primary'}>
              {translation.browse}
            </Link>
            <Link to="/popular" className={isActive('/popular') ? 'text-primary font-medium' : 'text-foreground/80 hover:text-primary'}>
              {translation.popular}
            </Link>
            <Link to="/latest" className={isActive('/latest') ? 'text-primary font-medium' : 'text-foreground/80 hover:text-primary'}>
              {translation.latest}
            </Link>
          </nav>

          {/* Right: Search + Profile + Theme + Language + Hamburger */}
          <div className="flex-1 flex justify-end items-center gap-2 relative px-2" ref={menuRef}>

            {/* Search Button */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSearch(!showSearch)}
                className="rounded-full"
              >
                <Search size={18} />
              </Button>
              {showSearch && (
                <input
                  type="text"
                  placeholder={translation.searchBtn || "Search..."}
                  className="absolute top-full left-1/2 -translate-x-1/2 translate-x-[-108px] mt-7 w-48 p-2 rounded border border-gray-300 dark:border-gray-700 bg-background text-foreground shadow-md focus:outline-none z-50"
                  autoFocus
                />
              )}
            </div>
            {/* Theme */}
            <Button variant="outline" size="sm" onClick={toggleTheme} className="rounded-full">
              <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`} />
            </Button>

            {/* Profile */}
            {isLoggedIn && user ? (
              <Link to="/profile">
                <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center hover:opacity-80 transition">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                      {user.name.split(' ').map((s: string) => s[0].toUpperCase()).slice(0, 2).join('')}
                    </div>
                  )}
                </div>
              </Link>
            ) : (
              <Link to="/login">
                <Button
                  variant="outline"
                  size="icon"
                  className="w-9 h-9 rounded-full"
                >
                  <User
                    className={` rounded-full ${theme === 'light' ? 'bg-white text-black' : 'bg-[#171A1C] text-white'
                      }`}
                  />
                </Button>
              </Link>

            )}

            {/* Hamburger icon for mobile */}
            <button
              className="md:hidden p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu size={24} />
            </button>

            {/* Mobile Dropdown */}
            {mobileMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-card rounded shadow-lg flex flex-col gap-2 p-3 z-50">
                <Link to="/" className={isActive('/') ? 'text-primary font-medium' : 'text-foreground/80 hover:text-primary'} onClick={() => setMobileMenuOpen(false)}>
                  {translation.home}
                </Link>
                <Link to="/browse" className={isActive('/browse') ? 'text-primary font-medium' : 'text-foreground/80 hover:text-primary'} onClick={() => setMobileMenuOpen(false)}>
                  {translation.browse}
                </Link>
                <Link to="/popular" className={isActive('/popular') ? 'text-primary font-medium' : 'text-foreground/80 hover:text-primary'} onClick={() => setMobileMenuOpen(false)}>
                  {translation.popular}
                </Link>
                <Link to="/latest" className={isActive('/latest') ? 'text-primary font-medium' : 'text-foreground/80 hover:text-primary'} onClick={() => setMobileMenuOpen(false)}>
                  {translation.latest}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>

  );
};

export default Header;
