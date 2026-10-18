import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users2, LogOut, Briefcase, GraduationCap, UserCheck } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isStudent = user?.role === 'Student';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
                <Users2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xl font-black bg-gradient-to-r from-indigo-700 to-indigo-500 bg-clip-text text-transparent tracking-tight">
                  TeamMaker
                </span>
                <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                  Collaborate
                </span>
              </div>
            </Link>
          </div>

          {/* User Details & Actions */}
          {user && (
            <div className="flex items-center gap-4">
              {/* Account Type Badge */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-sm">
                {isStudent ? (
                  <>
                    <GraduationCap className="w-4 h-4 text-indigo-600" />
                    <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">Student</span>
                  </>
                ) : (
                  <>
                    <Briefcase className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Company Employee</span>
                  </>
                )}
                {user.organization && (
                  <span className="text-slate-400 font-normal">| {user.organization}</span>
                )}
              </div>

              {/* User Avatar & Name Link */}
              <Link
                to="/profile"
                className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                title="View Profile"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-800 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-bold text-slate-800 leading-tight">{user.name}</div>
                  <div className="text-xs text-slate-500 truncate max-w-[140px]">{user.email}</div>
                </div>
              </Link>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all border border-rose-200/60"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
