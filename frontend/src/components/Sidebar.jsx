import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, FolderKanban, User } from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/teams', label: 'Teams & Collaboration', icon: Users },
    { to: '/profile', label: 'My Profile', icon: User }
  ];

  return (
    <aside className="w-full md:w-64 bg-white border-r border-slate-200/80 md:min-h-[calc(100vh-4rem)] p-4 flex md:flex-col justify-between shrink-0">
      <div className="w-full">
        <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 hidden md:block">
          Menu
        </div>
        <nav className="flex md:flex-col gap-1.5 w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Helpful tip box */}
      <div className="hidden md:block mt-8 p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-2xl">
        <div className="text-xs font-bold text-indigo-900 mb-1">💡 Team Tip</div>
        <p className="text-xs text-indigo-700/80 leading-relaxed">
          Share your team's 6-character Invite Code to instantly onboard team members!
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
