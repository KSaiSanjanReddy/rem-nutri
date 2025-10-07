import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  FiHome,
  FiMessageCircle,
  FiUsers,
  FiUser,
  FiX,
} from 'react-icons/fi';

const Sidebar = ({ mobileMenuOpen }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { onlineUsers } = useSelector((state) => state.chat);
  
  // Check if current user is online
  const isCurrentUserOnline = user && onlineUsers.includes(user.id);


  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: FiHome,
      current: location.pathname === '/dashboard',
    },
    {
      name: 'Chat',
      href: '/chat',
      icon: FiMessageCircle,
      current: location.pathname.startsWith('/chat'),
    },
    {
      name: 'Doctors',
      href: '/doctors',
      icon: FiUsers,
      current: location.pathname === '/doctors',
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: FiUser,
      current: location.pathname === '/profile',
    },
  ];

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-white via-blue-50/30 to-indigo-50/50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-20 -left-20 w-32 h-32 bg-gradient-to-br from-green-400/10 to-blue-400/10 rounded-full blur-2xl"></div>
      </div>

      {/* Logo */}
      <div className="relative flex items-center justify-between h-20 px-6 border-b border-gradient-to-r from-transparent via-gray-200/50 to-transparent bg-white/60 backdrop-blur-sm">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-600 via-purple-600 to-health-600 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <span className="text-white font-bold text-lg">RN</span>
          </div>
          <div className="ml-4">
            <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">Rem Nutri</span>
            <p className="text-xs text-gray-500 font-medium">Health Platform</p>
          </div>
        </div>
        
        {/* Mobile close button */}
        <button
          onClick={() => dispatch({ type: 'ui/setMobileMenuOpen', payload: false })}
          className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        >
          <FiX className="h-5 w-5" />
        </button>
      </div>

      {/* User info */}
      <div className="relative px-6 py-6 border-b border-gray-200/50 bg-white/40 backdrop-blur-sm">
        <div className="flex items-center space-x-4">
        <div className="w-14 h-14 bg-gradient-to-br from-primary-500 via-purple-500 to-health-500 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <span className="text-white font-bold text-lg">
            {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
          </span>
        </div>
          <div className="flex-1">
            <p className="text-base font-semibold text-gray-900 mb-1">{user?.fullName || 'User'}</p>
            <p className="text-sm text-gray-600 capitalize">{user?.userType === 'user' ? 'User' : (user?.userType || 'User')}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 px-4 py-6 space-y-2">
        {navigation.map((item, index) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `group relative flex items-center px-4 py-4 text-sm font-medium rounded-2xl transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-500/10 to-purple-500/10 text-primary-700 border border-primary-200/50 shadow-lg backdrop-blur-sm'
                    : 'text-gray-600 hover:bg-white/60 hover:text-gray-900 hover:shadow-md hover:scale-[1.02] backdrop-blur-sm'
                }`
              }
              onClick={() => {
                if (mobileMenuOpen) {
                  dispatch({ type: 'ui/setMobileMenuOpen', payload: false });
                }
              }}
            >
              {/* Active indicator */}
              {item.current && (
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-primary-500 to-purple-500 rounded-r-full shadow-lg"></div>
              )}
              
              <div className={`p-2 rounded-xl transition-all duration-300 ${
                item.current 
                  ? 'bg-gradient-to-r from-primary-500 to-purple-500 shadow-lg' 
                  : 'bg-gray-100 group-hover:bg-gradient-to-r group-hover:from-primary-500/20 group-hover:to-purple-500/20'
              }`}>
                <Icon
                  className={`h-5 w-5 transition-colors duration-300 ${
                    item.current ? 'text-white' : 'text-gray-500 group-hover:text-primary-600'
                  }`}
                />
              </div>
              
              <span className={`ml-4 font-semibold transition-colors duration-300 ${
                item.current ? 'text-primary-700' : 'text-gray-700 group-hover:text-gray-900'
              }`}>
                {item.name}
              </span>
              
              {/* Hover effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </NavLink>
          );
        })}
      </nav>

    </div>
  );
};

export default Sidebar;
