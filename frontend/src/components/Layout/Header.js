import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiMenu, FiBell, FiSearch, FiLogOut, FiChevronDown } from 'react-icons/fi';
import { logoutUser } from '../../store/slices/authSlice';
import { getChatList } from '../../store/slices/chatSlice';

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { unreadCount } = useSelector((state) => state.chat);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleMobileMenu = () => {
    dispatch({ type: 'ui/setMobileMenuOpen', payload: true });
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    setShowUserMenu(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('🔍 Header search:', searchQuery.trim());
      
      // Check current route and navigate accordingly
      if (location.pathname === '/doctors') {
        // If on doctors page, trigger search on doctors page
        // We'll use a custom event to communicate with the doctors page
        window.dispatchEvent(new CustomEvent('headerSearch', { 
          detail: { query: searchQuery.trim() } 
        }));
      } else {
        // Otherwise navigate to chat page with search query
        navigate(`/chat?search=${encodeURIComponent(searchQuery.trim())}`);
      }
      
      // Clear search after navigation
      setSearchQuery('');
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 h-14">
      <div className="flex items-center justify-between h-full px-6">
        {/* Left side */}
        <div className="flex items-center">
          {/* Mobile menu button */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <FiMenu className="h-5 w-5" />
          </button>

          {/* Search */}
          <div className="hidden md:block ml-4">
            <form onSubmit={handleSearch} className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={location.pathname === '/doctors' ? "Search doctors by name or specialty..." : "Search doctors, messages..."}
                className="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </form>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">

          {/* User profile */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg p-2 transition-colors"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-medium text-gray-900">{user?.full_name || 'User'}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.user_type === 'user' ? 'User' : (user?.user_type || 'User')}</p>
              </div>
              <div className="w-7 h-7 bg-gradient-to-r from-primary-500 to-health-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-xs">
                  {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <FiChevronDown className="h-4 w-4 text-gray-400" />
            </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <FiLogOut className="h-4 w-4 mr-3" />
                    Logout
                  </button>
                </div>
              )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
