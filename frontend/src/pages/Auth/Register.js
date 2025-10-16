import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { FiEye, FiEyeOff, FiMail, FiLock, FiPhone, FiUser, FiCalendar, FiUserCheck } from 'react-icons/fi';
import { registerUser, sendOTP, verifyOTP, clearError, setRegistrationStep } from '../../store/slices/authSlice';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated, registrationStep } = useSelector((state) => state.auth);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userType, setUserType] = useState('user');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const password = watch('password');

  const onSubmit = (data) => {
    console.log("Raw form data:", data);
    
    // Direct registration without OTP - data is already in snake_case
    const userData = {
      full_name: data.full_name,
      email: data.email,
      mobile: data.mobile,
      password: data.password,
      date_of_birth: new Date(data.date_of_birth).toISOString(),
      gender: data.gender,
      user_type: userType.toLowerCase(),
    };
    
    console.log("Transformed userData for API:", userData);
    
    // Add doctor-specific fields if user is a doctor
    if (userType === 'doctor') {
      userData.specialization = data.specialization;
      userData.license_number = data.license_number;
      userData.experience = parseInt(data.experience) || 0;
      userData.consultation_fee = parseInt(data.consultation_fee) || 0;
    }
    
    dispatch(registerUser(userData));
  };


  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto h-16 w-16 bg-gradient-to-r from-primary-600 to-health-600 rounded-full flex items-center justify-center"
          >
            <span className="text-2xl font-bold text-white">RN</span>
          </motion.div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {registrationStep === 1 ? 'Create your account' : 'Verify your account'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {registrationStep === 1 
              ? 'Join Rem Nutri and connect with healthcare professionals'
              : 'We sent verification codes to your email and mobile'
            }
          </p>
        </div>

        {/* Registration Form */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white py-8 px-6 shadow-xl rounded-2xl"
        >
          {/* Progress Indicator - Single Step */}
          <div className="mb-6">
            <div className="flex items-center justify-center">
              <div className="flex items-center text-primary-600">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-primary-600 text-white">
                  1
                </div>
                <span className="ml-2 text-sm font-medium">Create Account</span>
              </div>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* User Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                I am a
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUserType('user')}
                  className={`p-3 rounded-lg border-2 text-center transition-colors ${
                    userType === 'user'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <FiUser className="mx-auto h-6 w-6 mb-1" />
                  <div className="text-sm font-medium">User</div>
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('doctor')}
                  className={`p-3 rounded-lg border-2 text-center transition-colors ${
                    userType === 'doctor'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <FiUserCheck className="mx-auto h-6 w-6 mb-1" />
                  <div className="text-sm font-medium">Doctor</div>
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('full_name', {
                    required: 'Full name is required',
                    minLength: {
                      value: 2,
                      message: 'Name must be at least 2 characters'
                    }
                  })}
                  type="text"
                  className={`input-field pl-10 ${errors.full_name ? 'input-error' : ''}`}
                  placeholder="Enter your full name"
                />
              </div>
              {errors.full_name && (
                <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  type="email"
                  className={`input-field pl-10 ${errors.email ? 'input-error' : ''}`}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Mobile */}
            <div>
              <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiPhone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('mobile', {
                    required: 'Mobile number is required',
                    pattern: {
                      value: /^[+]?[1-9][\d]{0,15}$/,
                      message: 'Invalid mobile number'
                    }
                  })}
                  type="tel"
                  className={`input-field pl-10 ${errors.mobile ? 'input-error' : ''}`}
                  placeholder="Enter your mobile number"
                />
              </div>
              {errors.mobile && (
                <p className="mt-1 text-sm text-red-600">{errors.mobile.message}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiCalendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('date_of_birth', {
                    required: 'Date of birth is required'
                  })}
                  type="date"
                  className={`input-field pl-10 ${errors.date_of_birth ? 'input-error' : ''}`}
                />
              </div>
              {errors.date_of_birth && (
                <p className="mt-1 text-sm text-red-600">{errors.date_of_birth.message}</p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <select
                {...register('gender', {
                  required: 'Gender is required'
                })}
                className={`input-field ${errors.gender ? 'input-error' : ''}`}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
              )}
            </div>

            {/* Doctor-specific fields */}
            {userType === 'doctor' && (
              <>
                <div>
                  <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-2">
                    Specialization
                  </label>
                  <input
                    {...register('specialization', {
                      required: userType === 'doctor' ? 'Specialization is required' : false
                    })}
                    type="text"
                    className={`input-field ${errors.specialization ? 'input-error' : ''}`}
                    placeholder="e.g., Cardiology, Dermatology"
                  />
                  {errors.specialization && (
                    <p className="mt-1 text-sm text-red-600">{errors.specialization.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="license_number" className="block text-sm font-medium text-gray-700 mb-2">
                    License Number
                  </label>
                  <input
                    {...register('license_number', {
                      required: userType === 'doctor' ? 'License number is required' : false
                    })}
                    type="text"
                    className={`input-field ${errors.license_number ? 'input-error' : ''}`}
                    placeholder="Enter your medical license number"
                  />
                  {errors.license_number && (
                    <p className="mt-1 text-sm text-red-600">{errors.license_number.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
                    Years of Experience
                  </label>
                  <input
                    {...register('experience', {
                      required: userType === 'doctor' ? 'Experience is required' : false,
                      min: { value: 0, message: 'Experience must be 0 or more' },
                      max: { value: 50, message: 'Experience must be 50 or less' }
                    })}
                    type="number"
                    min="0"
                    max="50"
                    className={`input-field ${errors.experience ? 'input-error' : ''}`}
                    placeholder="0"
                  />
                  {errors.experience && (
                    <p className="mt-1 text-sm text-red-600">{errors.experience.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="consultation_fee" className="block text-sm font-medium text-gray-700 mb-2">
                    Consultation Fee (₹)
                  </label>
                  <input
                    {...register('consultation_fee', {
                      required: userType === 'doctor' ? 'Consultation fee is required' : false,
                      min: { value: 0, message: 'Fee must be 0 or more' }
                    })}
                    type="number"
                    min="0"
                    className={`input-field ${errors.consultation_fee ? 'input-error' : ''}`}
                    placeholder="500"
                  />
                  {errors.consultation_fee && (
                    <p className="mt-1 text-sm text-red-600">{errors.consultation_fee.message}</p>
                  )}
                </div>
              </>
            )}

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className={`input-field pl-10 pr-10 ${errors.password ? 'input-error' : ''}`}
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('confirm_password', {
                    required: 'Please confirm your password',
                    validate: value => value === password || 'Passwords do not match'
                  })}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`input-field pl-10 pr-10 ${errors.confirm_password ? 'input-error' : ''}`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.confirm_password && (
                <p className="mt-1 text-sm text-red-600">{errors.confirm_password.message}</p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-lg p-3"
              >
                <p className="text-sm text-red-600">{error}</p>
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary flex items-center justify-center py-3 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <LoadingSpinner size="small" />
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>© 2024 Rem Nutri. All rights reserved.</p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;