import React, { useState } from 'react';
import { FiSearch, FiUser, FiMessageCircle, FiPhone } from 'react-icons/fi';
import { userAPI } from '../../services/api';
import LoadingSpinner from '../UI/LoadingSpinner';

const UserSearch = ({ onUserSelect, onBack }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter a phone number');
      return;
    }

    // Basic phone number validation
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      setError('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    setError('');
    setSearchResult(null);

    try {
      const response = await userAPI.searchByPhone(phoneNumber);
      setSearchResult(response.data.data.user);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('No user found with this phone number');
      } else {
        setError('Failed to search user. Please try again.');
      }
      setSearchResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleStartChat = () => {
    if (searchResult && searchResult.id) {
      onUserSelect(searchResult);
    } else {
      setError('Invalid user data. Please search again.');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Find Users</h2>
            <p className="text-sm text-gray-500">Search by phone number to start a chat</p>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="p-4 border-b border-gray-200">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiPhone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="tel"
                placeholder="Enter phone number (e.g., +1234567890)"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter the phone number of the person you want to chat with
            </p>
          </div>

          <button
            onClick={handleSearch}
            disabled={isLoading || !phoneNumber.trim()}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="small" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <FiSearch className="w-4 h-4" />
                <span>Search User</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Section */}
      <div className="flex-1 p-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {searchResult && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-4">
              {/* User Avatar */}
              <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-health-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {searchResult.fullName?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>

              {/* User Info */}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {searchResult.fullName}
                </h3>
                <p className="text-sm text-gray-500 capitalize">
                  {searchResult.userType}
                </p>
                <p className="text-xs text-gray-400">
                  {searchResult.mobile}
                </p>
              </div>

              {/* Start Chat Button */}
              <button
                onClick={handleStartChat}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
              >
                <FiMessageCircle className="w-4 h-4" />
                <span>Start Chat</span>
              </button>
            </div>
          </div>
        )}

        {!searchResult && !error && !isLoading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiUser className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Find Users to Chat</h3>
            <p className="text-gray-500">
              Enter a phone number above to find and start chatting with other users
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSearch;
