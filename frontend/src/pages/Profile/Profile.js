import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiCalendar, FiMapPin, FiEdit3, FiSave, FiX } from 'react-icons/fi';
import { updateUser } from '../../store/slices/authSlice';

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    mobile: user?.mobile || '',
    date_of_birth: user?.date_of_birth ? new Date(user.date_of_birth).toISOString().split('T')[0] : '',
    gender: user?.gender || '',
    specialization: user?.specialization || '',
    experience: user?.experience || '',
    consultation_fee: user?.consultation_fee || '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    dispatch(updateUser(formData));
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      full_name: user?.full_name || '',
      email: user?.email || '',
      mobile: user?.mobile || '',
      date_of_birth: user?.date_of_birth ? new Date(user.date_of_birth).toISOString().split('T')[0] : '',
      gender: user?.gender || '',
      specialization: user?.specialization || '',
      experience: user?.experience || '',
      consultation_fee: user?.consultation_fee || '',
    });
    setIsEditing(false);
  };

  const profileFields = [
    {
      name: 'full_name',
      label: 'Full Name',
      icon: FiUser,
      type: 'text',
      editable: true
    },
    {
      name: 'email',
      label: 'Email Address',
      icon: FiMail,
      type: 'email',
      editable: false
    },
    {
      name: 'mobile',
      label: 'Mobile Number',
      icon: FiPhone,
      type: 'tel',
      editable: false
    },
    {
      name: 'date_of_birth',
      label: 'Date of Birth',
      icon: FiCalendar,
      type: 'date',
      editable: true
    },
    {
      name: 'gender',
      label: 'Gender',
      icon: FiUser,
      type: 'select',
      options: [
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
        { value: 'other', label: 'Other' }
      ],
      editable: true
    }
  ];

  const doctorFields = [
    {
      name: 'specialization',
      label: 'Specialization',
      icon: FiMapPin,
      type: 'text',
      editable: true
    },
    {
      name: 'experience',
      label: 'Years of Experience',
      icon: FiCalendar,
      type: 'number',
      editable: true
    },
    {
      name: 'consultation_fee',
      label: 'Consultation Fee (₹)',
      icon: FiUser,
      type: 'number',
      editable: true
    }
  ];

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary-600 to-health-600 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-3xl font-bold">
                {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {user?.full_name || 'User'}
              </h1>
              <p className="text-primary-100 capitalize">
                {user?.user_type || 'User'} • {user?.specialization || 'Health Professional'}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-3 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
          >
            {isEditing ? <FiX className="w-6 h-6" /> : <FiEdit3 className="w-6 h-6" />}
          </button>
        </div>
      </motion.div>

      {/* Profile Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {profileFields.map((field) => {
            const Icon = field.icon;
            return (
              <div key={field.name} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {field.label}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon className="h-5 w-5 text-gray-400" />
                  </div>
                  {field.type === 'select' ? (
                    <select
                      name={field.name}
                      value={formData[field.name]}
                      onChange={handleInputChange}
                      disabled={!isEditing || !field.editable}
                      className={`w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        !isEditing || !field.editable ? 'bg-gray-50 text-gray-500' : 'bg-white'
                      }`}
                    >
                      <option value="">Select {field.label}</option>
                      {field.options?.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      name={field.name}
                      value={formData[field.name]}
                      onChange={handleInputChange}
                      disabled={!isEditing || !field.editable}
                      className={`w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        !isEditing || !field.editable ? 'bg-gray-50 text-gray-500' : 'bg-white'
                      }`}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Doctor Information */}
      {user?.user_type === 'doctor' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Professional Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {doctorFields.map((field) => {
              const Icon = field.icon;
              return (
                <div key={field.name} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {field.label}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Icon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={field.type}
                      name={field.name}
                      value={formData[field.name]}
                      onChange={handleInputChange}
                      disabled={!isEditing || !field.editable}
                      className={`w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        !isEditing || !field.editable ? 'bg-gray-50 text-gray-500' : 'bg-white'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Account Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Account Status</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${user?.is_email_verified ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <div>
              <p className="text-sm font-medium text-gray-900">Email Verification</p>
              <p className="text-xs text-gray-500">
                {user?.is_email_verified ? 'Verified' : 'Not verified'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${user?.is_mobile_verified ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <div>
              <p className="text-sm font-medium text-gray-900">Mobile Verification</p>
              <p className="text-xs text-gray-500">
                {user?.is_mobile_verified ? 'Verified' : 'Not verified'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${user?.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <div>
              <p className="text-sm font-medium text-gray-900">Account Status</p>
              <p className="text-xs text-gray-500">
                {user?.is_active ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      {isEditing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end space-x-3"
        >
          <button
            onClick={handleCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
          >
            <FiSave className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default Profile;