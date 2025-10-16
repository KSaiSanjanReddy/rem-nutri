import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { FiEye, FiEyeOff, FiMail, FiLock, FiPhone } from 'react-icons/fi';
import { loginUser, clearError } from '../../store/slices/authSlice';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, error, isAuthenticated } = useSelector((state) => state.auth);
  
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'mobile'
  const [customPassword, setCustomPassword] = useState('');
  const [showPasswordError, setShowPasswordError] = useState(false);
  const passwordRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm();

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const onSubmit = (data) => {
    // Validate custom password
    if (!customPassword.trim()) {
      setShowPasswordError(true);
      return;
    }
    
    setShowPasswordError(false);
    const credentials = {
      identifier: data.identifier,
      password: customPassword, // Use custom password instead of form data
    };
    dispatch(loginUser(credentials));
  };

  const switchLoginMethod = () => {
    setLoginMethod(loginMethod === 'email' ? 'mobile' : 'email');
    setValue('identifier', '');
    dispatch(clearError());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-100 flex relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-gradient-to-r from-indigo-400 to-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '4s'}}></div>
        
        {/* Geometric Shapes */}
        <div className="absolute top-20 left-20 w-32 h-32 border-2 border-blue-200 rotate-45 animate-spin" style={{animationDuration: '20s'}}></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 border-2 border-purple-200 rotate-12 animate-bounce" style={{animationDuration: '3s'}}></div>
        <div className="absolute top-1/2 right-10 w-16 h-16 bg-gradient-to-r from-pink-300 to-purple-300 rounded-full animate-ping opacity-30"></div>
      </div>

      {/* Left Side - Rem Nutri Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-purple-700 relative overflow-hidden">
        {/* Enhanced Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full shadow-2xl animate-pulse"></div>
          <div className="absolute top-32 right-20 w-24 h-24 bg-white rounded-full shadow-xl animate-bounce" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-20 left-20 w-40 h-40 bg-white rounded-full shadow-2xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-32 right-10 w-28 h-28 bg-white rounded-full shadow-xl animate-bounce" style={{animationDelay: '0.5s'}}></div>
          <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-white rounded-full shadow-lg animate-ping opacity-50"></div>
        </div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center text-center px-12 text-white">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mb-8 relative"
          >
            <div className="w-28 h-28 bg-white bg-opacity-30 backdrop-blur-lg rounded-3xl flex items-center justify-center shadow-2xl border border-white/20 relative overflow-hidden">
              {/* Inner glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-3xl"></div>
              <span className="text-5xl font-bold text-white relative z-10 drop-shadow-lg">R</span>
              {/* Animated ring */}
              <div className="absolute inset-0 border-2 border-white/30 rounded-3xl animate-spin" style={{animationDuration: '8s'}}></div>
            </div>
            {/* Outer glow rings */}
            <div className="absolute inset-0 w-32 h-32 border border-white/20 rounded-3xl animate-ping"></div>
            <div className="absolute inset-0 w-36 h-36 border border-white/10 rounded-3xl animate-ping" style={{animationDelay: '1s'}}></div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="relative"
          >
            <h1 className="text-6xl font-bold mb-6 tracking-tight bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent drop-shadow-lg">
              Rem Nutri
            </h1>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed font-light">
              Your trusted health companion for seamless communication and care
            </p>
            {/* Floating text effect */}
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-white/20 rounded-full animate-pulse"></div>
            <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-white/30 rounded-full animate-bounce"></div>
          </motion.div>
          
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex space-x-6 text-blue-100"
          >
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
              <div className="text-3xl font-bold mb-1 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">1000+</div>
              <div className="text-sm font-light">Happy Users</div>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105" style={{transitionDelay: '0.1s'}}>
              <div className="text-3xl font-bold mb-1 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">24/7</div>
              <div className="text-sm font-light">Support</div>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105" style={{transitionDelay: '0.2s'}}>
              <div className="text-3xl font-bold mb-1 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">Secure</div>
              <div className="text-sm font-light">Platform</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
        {/* Background decoration for right side */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
          <div className="absolute bottom-1/3 left-1/4 w-40 h-40 bg-gradient-to-r from-purple-200 to-pink-200 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-pulse" style={{animationDelay: '3s'}}></div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
          className="max-w-md w-full space-y-8 relative z-10"
      >
          {/* Mobile Header */}
          <div className="lg:hidden text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto h-16 w-16 bg-gradient-to-r from-primary-600 to-purple-600 rounded-full flex items-center justify-center"
          >
              <span className="text-2xl font-bold text-white">R</span>
          </motion.div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Welcome to Rem Nutri
          </h2>
          <p className="mt-2 text-sm text-gray-600">
              Sign in to your account
          </p>
        </div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/90 backdrop-blur-lg py-12 px-10 shadow-2xl rounded-3xl border border-white/20 relative overflow-hidden"
        >
          {/* Card background effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-white/30 to-blue-50/30"></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500"></div>
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full opacity-20 blur-xl"></div>
          <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-r from-purple-200 to-pink-200 rounded-full opacity-20 blur-xl"></div>
          {/* Desktop Header */}
          <div className="hidden lg:block text-center mb-8 relative z-10">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
              Welcome back
            </h2>
            <p className="text-sm text-gray-600 font-medium">
              Sign in to your Rem Nutri account
            </p>
          </div>
          <form className="space-y-6 relative z-10" onSubmit={handleSubmit(onSubmit)} autoComplete="off" data-form-type="other">
            {/* Hidden fake fields to confuse password managers */}
            <div style={{ display: 'none' }}>
              <input type="text" name="username" autoComplete="username" />
              <input type="password" name="password" autoComplete="current-password" />
              <input type="text" name="email" autoComplete="email" />
              <input type="password" name="login-password" autoComplete="current-password" />
              <input type="text" name="user-email" autoComplete="email" />
              <input type="password" name="user-password" autoComplete="current-password" />
              <input type="text" name="login" autoComplete="username" />
              <input type="password" name="pass" autoComplete="current-password" />
              <input type="text" name="user" autoComplete="username" />
              <input type="password" name="pwd" autoComplete="current-password" />
              <input type="text" name="account" autoComplete="username" />
              <input type="password" name="secret" autoComplete="current-password" />
            </div>
            
            {/* Login Method Toggle */}
            <div className="flex bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-1.5 shadow-inner">
              <button
                type="button"
                onClick={() => switchLoginMethod()}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  loginMethod === 'email'
                    ? 'bg-white text-primary-600 shadow-lg transform scale-105 border border-primary-100'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50 hover:scale-102'
                }`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => switchLoginMethod()}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  loginMethod === 'mobile'
                    ? 'bg-white text-primary-600 shadow-lg transform scale-105 border border-primary-100'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50 hover:scale-102'
                }`}
              >
                Mobile
              </button>
            </div>

            {/* Identifier Input */}
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-2">
                {loginMethod === 'email' ? 'Email Address' : 'Mobile Number'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {loginMethod === 'email' ? (
                    <FiMail className="h-5 w-5 text-gray-400" />
                  ) : (
                    <FiPhone className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <input
                  {...register('identifier', {
                    required: `${loginMethod === 'email' ? 'Email' : 'Mobile number'} is required`,
                    pattern: loginMethod === 'email' 
                      ? {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      : {
                          value: /^[+]?[1-9][\d]{0,15}$/,
                          message: 'Invalid mobile number'
                        }
                  })}
                  type={loginMethod === 'email' ? 'email' : 'tel'}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  data-form-type="other"
                  className={`w-full px-4 py-4 pl-12 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-400 transition-all duration-300 shadow-sm hover:shadow-md ${
                    errors.identifier 
                      ? 'border-red-300 bg-red-50/50' 
                      : 'border-gray-200/50 bg-gradient-to-r from-gray-50/80 to-white/80 hover:bg-white focus:bg-white backdrop-blur-sm'
                  }`}
                  placeholder={loginMethod === 'email' ? 'Enter your email' : 'Enter your mobile number'}
                />
              </div>
              {errors.identifier && (
                <p className="mt-1 text-sm text-red-600">{errors.identifier.message}</p>
              )}
            </div>

            {/* Custom Password Input - No Browser Interference */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  ref={passwordRef}
                  type="text"
                  value={showPassword ? customPassword : '•'.repeat(customPassword.length)}
                  onChange={(e) => {
                    if (showPassword) {
                      setCustomPassword(e.target.value);
                    } else {
                      // When password is hidden, we need to handle the masking
                      const inputValue = e.target.value;
                      const currentLength = customPassword.length;
                      
                      // If user is typing (adding characters)
                      if (inputValue.length > currentLength) {
                        const newChar = inputValue.slice(-1);
                        if (newChar !== '•') {
                          setCustomPassword(customPassword + newChar);
                        }
                      }
                      // If user is deleting (removing characters)
                      else if (inputValue.length < currentLength) {
                        setCustomPassword(customPassword.slice(0, -1));
                      }
                    }
                    
                    // Clear error when user starts typing
                    if (showPasswordError) {
                      setShowPasswordError(false);
                    }
                  }}
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  data-form-type="other"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore="true"
                  data-blastpassignore="true"
                  data-dashlaneignore="true"
                  data-keepassignore="true"
                  data-bitwardenignore="true"
                  data-roboformignore="true"
                  data-avastignore="true"
                  data-nortonignore="true"
                  data-kasperskyignore="true"
                  name="security-password"
                  id="security-password"
                  className={`w-full px-4 py-4 pl-12 pr-12 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-400 transition-all duration-300 shadow-sm hover:shadow-md ${
                    showPasswordError 
                      ? 'border-red-300 bg-red-50/50' 
                      : 'border-gray-200/50 bg-gradient-to-r from-gray-50/80 to-white/80 hover:bg-white focus:bg-white backdrop-blur-sm'
                  }`}
                  placeholder="Enter your password"
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
              {showPasswordError && (
                <p className="mt-1 text-sm text-red-600">Password is required</p>
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

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-primary-600 via-primary-700 to-purple-600 hover:from-primary-700 hover:via-primary-800 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
            >
              {/* Button shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              {isLoading ? (
                <LoadingSpinner size="small" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center relative z-20">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-primary-600 hover:text-primary-500 transition-colors cursor-pointer underline hover:no-underline"
                style={{ pointerEvents: 'auto', zIndex: 20, position: 'relative' }}
                onClick={(e) => {
                  console.log('Sign up link clicked!');
                  e.preventDefault();
                  window.location.href = '/register';
                }}
              >
                Sign up here
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
    </div>
  );
};

export default Login;
