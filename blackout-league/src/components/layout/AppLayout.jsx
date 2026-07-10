import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { gasClient as base44 } from '@/api/gasClient';
import {
  LayoutDashboard, Trophy, Users, Calendar, Timer, Shield,
  ChevronLeft, ChevronRight, LogOut, User, Menu, X,
  BookOpen, MapPin, HelpCircle, Package, Zap, Layers, ClipboardList } from
'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
{ label: 'Dashboard', path: '/', icon: LayoutDashboard },
{ label: 'Live Games', path: '/live', icon: Timer },
{ label: 'Scorekeeper', path: '/scorekeeper', icon: Timer },
{ label: 'Schedule', path: '/schedule', icon: Calendar },
{ label: 'Standings', path: '/standings', icon: Trophy },
{ label: 'Teams', path: '/teams', icon: Shield },
{ label: 'Players', path: '/players', icon: Users }];


const adminItems = [
  { label: 'Admin Panel', path: '/admin', icon: LayoutDashboard },
];

const extraItems = [
  { label: 'League Records', path: '/league-records', icon: Trophy },
  { label: 'Gamification Hall', path: '/gamification-hall', icon: Zap },
  { label: 'Season Overview', path: '/season-overview', icon: ClipboardList },
  { label: 'Season Calendar', path: '/season-calendar', icon: Calendar },
  { label: 'Lineup Builder', path: '/lineup-builder', icon: Layers },
  { label: 'Division Rules', path: '/division-rules', icon: BookOpen },
  { label: 'Venues', path: '/venues', icon: MapPin },
  { label: 'Inventory', path: '/inventory', icon: Package },
  { label: 'Help Center', path: '/help-center', icon: HelpCircle },
];


export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const handleLogout = () => {
    base44.auth.logout('/login');
  };

  const NavLink = ({ item }) => {
    const active = location.pathname === item.path;
    return (
      <Link
        to={item.path}
        onClick={() => setMobileOpen(false)}
        className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all text-xs font-medium tracking-wide
          ${active ?
        'bg-white/5 text-white' :
        'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03]'}`
        }>
        <item.icon className={`w-4 h-4 shrink-0 ${active ? 'text-primary' : ''}`} />
        {!collapsed && <span>{item.label}</span>}
      </Link>);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {mobileOpen &&
      <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      }

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative z-50 h-full bg-zinc-950 border-r border-white/5 flex flex-col transition-all duration-300
        ${collapsed ? 'w-16' : 'w-60'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-white/5 shrink-0">
          <div className="w-7 h-7 rounded bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-black text-xs">B</span>
          </div>
          {!collapsed &&
          <div className="overflow-hidden">
              <h1 className="font-bold text-xs tracking-[0.2em] leading-tight text-white">BLACKOUT</h1>
              <p className="text-[9px] text-zinc-600 tracking-[0.25em]">LEAGUE MANAGER</p>
            </div>
          }
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {navItems.map((item) => <NavLink key={item.path} item={item} />)}
          <div className="border-t border-white/5 my-2" />
          {adminItems.map((item) => <NavLink key={item.path} item={item} />)}
          <div className="border-t border-white/5 my-2" />
          {extraItems.map((item) => <NavLink key={item.path} item={item} />)}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-white/5 space-y-0.5">
          <Link
            to="/profile"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-xs text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03] transition-all">
            <User className="w-4 h-4 shrink-0" />
            {!collapsed && <span>My Profile</span>}
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-xs text-zinc-500 hover:text-red-400 hover:bg-red-400/5 transition-all w-full">
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-full py-2 text-zinc-700 hover:text-zinc-400 transition-all">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-border bg-card shrink-0">
          <button onClick={() => setMobileOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-black text-xs">B</span>
            </div>
            <span className="font-bold text-sm">BLACKOUT
</span>
          </div>
          <div className="w-6" />
        </header>

        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>);
}
