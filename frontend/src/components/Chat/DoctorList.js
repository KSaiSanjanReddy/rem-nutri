import React from 'react';
import { motion } from 'framer-motion';
import { FiStar, FiMessageCircle, FiMapPin, FiClock } from 'react-icons/fi';
import LoadingSpinner from '../UI/LoadingSpinner';

const DoctorList = ({ doctors, isLoading, onDoctorSelect, onFindUserByPhone }) => {
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (doctors.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <FiMessageCircle className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors available</h3>
        <p className="text-gray-500 max-w-sm">
          There are currently no doctors available. Please check back later or try searching for a specific specialty.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Find Users by Phone Option */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 cursor-pointer hover:from-green-100 hover:to-emerald-100 transition-all"
          onClick={onFindUserByPhone}
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">📱</span>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">Find User by Phone</h3>
              <p className="text-xs text-gray-600">Search for any user by their mobile number</p>
            </div>
            <div className="text-green-600">
              <FiMessageCircle className="w-5 h-5" />
            </div>
          </div>
        </motion.div>

        {doctors.map((doctor, index) => (
          <motion.div
            key={doctor._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onDoctorSelect(doctor)}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="flex items-start space-x-4">
              {/* Doctor Avatar */}
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-health-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {doctor.full_name?.charAt(0)?.toUpperCase() || 'D'}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
              </div>

              {/* Doctor Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                      Dr. {doctor.full_name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {doctor.specialization}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary-600">
                      ₹{doctor.consultation_fee}
                    </p>
                    <p className="text-xs text-gray-500">per consultation</p>
                  </div>
                </div>

                {/* Experience and Rating */}
                <div className="flex items-center space-x-4 mt-3">
                  <div className="flex items-center space-x-1">
                    <FiClock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {doctor.experience} years experience
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <FiStar className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600">4.8</span>
                    <span className="text-xs text-gray-500">(127 reviews)</span>
                  </div>
                </div>

                {/* Availability */}
                <div className="flex items-center space-x-2 mt-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600 font-medium">Available now</span>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center space-x-3 mt-4">
                  <button className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
                    <FiMessageCircle className="w-4 h-4 inline mr-2" />
                    Start Chat
                  </button>
                  
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                    View Profile
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default DoctorList;
