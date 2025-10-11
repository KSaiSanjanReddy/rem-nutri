import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiSearch, FiFilter, FiStar, FiClock, FiMessageCircle } from 'react-icons/fi';
import { getDoctors } from '../../store/slices/userSlice';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const Doctors = () => {
  const dispatch = useDispatch();
  const { doctors = [], isLoading } = useSelector((state) => state.user || {});
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    dispatch(getDoctors({ page: 1, limit: 20 }));
  }, [dispatch]);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    const scrollableElements = document.querySelectorAll('[class*="overflow"], .main-content, .content-wrapper');
    scrollableElements.forEach(element => {
      if (element.scrollTop > 0) {
        element.scrollTop = 0;
      }
    });
  }, []);

  useEffect(() => {
    const handleHeaderSearch = (event) => {
      const query = event.detail.query;
      setSearchQuery(query);
    };

    window.addEventListener('headerSearch', handleHeaderSearch);
    
    return () => {
      window.removeEventListener('headerSearch', handleHeaderSearch);
    };
  }, []);

  const specialties = [
    'Cardiology', 'Dermatology', 'Neurology', 'Orthopedics', 'Pediatrics',
    'Gynecology', 'Psychiatry', 'Oncology', 'Endocrinology', 'Gastroenterology'
  ];

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doctor.specialization?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = !selectedSpecialty || doctor.specialization === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  const sortedDoctors = [...filteredDoctors].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'experience':
        return b.experience - a.experience;
      case 'fee':
        return a.consultation_fee - b.consultation_fee;
      default:
        return 0;
    }
  });

  const handleStartChat = (doctor) => {
    console.log('Start chat with:', doctor);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden"
        >
          <div className="bg-gradient-to-r from-primary-600 via-purple-600 to-health-600 rounded-3xl p-8 lg:p-12 text-white relative shadow-2xl">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-xl animate-pulse"></div>
              <div className="absolute -bottom-20 -left-20 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse delay-1000"></div>
              <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-white/5 rounded-full blur-lg animate-pulse delay-500"></div>
            </div>
            
            <div className="relative z-10">
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-4xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent"
              >
                Find Doctors
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-lg lg:text-xl text-white/90 max-w-2xl"
              >
                Connect with certified healthcare professionals for personalized medical advice
              </motion.p>
            </div>
          </div>
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0 lg:space-x-6">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FiSearch className="h-6 w-6 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search doctors by name or specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-400 transition-all duration-300 shadow-sm hover:shadow-md bg-white/80 backdrop-blur-sm text-lg"
              />
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="px-4 py-3 border-2 border-gray-200/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-400 transition-all duration-300 shadow-sm hover:shadow-md bg-white/80 backdrop-blur-sm font-medium"
              >
                <option value="">All Specialties</option>
                {specialties.map(specialty => (
                  <option key={specialty} value={specialty}>{specialty}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border-2 border-gray-200/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-400 transition-all duration-300 shadow-sm hover:shadow-md bg-white/80 backdrop-blur-sm font-medium"
              >
                <option value="rating">Sort by Rating</option>
                <option value="experience">Sort by Experience</option>
                <option value="fee">Sort by Fee</option>
              </select>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className="p-3 border-2 border-gray-200/50 rounded-2xl hover:bg-white/60 transition-all duration-300 shadow-sm hover:shadow-md bg-white/80 backdrop-blur-sm"
              >
                <FiFilter className="h-6 w-6 text-gray-600" />
              </motion.button>
            </div>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-6 pt-6 border-t border-gray-200/50"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Consultation Fee Range
                  </label>
                  <div className="flex space-x-2">
                    <input type="number" placeholder="Min" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                    <input type="number" placeholder="Max" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experience (Years)
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                    <option value="">Any Experience</option>
                    <option value="0-2">0-2 years</option>
                    <option value="3-5">3-5 years</option>
                    <option value="6-10">6-10 years</option>
                    <option value="10+">10+ years</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Availability
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                    <option value="">Any Time</option>
                    <option value="now">Available Now</option>
                    <option value="today">Available Today</option>
                    <option value="week">This Week</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Doctors List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-blue-50/50">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
              {filteredDoctors.length} Doctor{filteredDoctors.length !== 1 ? 's' : ''} Found
            </h2>
            <p className="text-gray-600 mt-2">Connect with the best healthcare professionals</p>
          </div>

          <div className="p-8">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="large" />
              </div>
            ) : sortedDoctors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sortedDoctors.map((doctor, index) => (
                  <motion.div
                    key={doctor._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                    className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/50 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-start space-x-6">
                        <div className="relative">
                          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 via-purple-500 to-health-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <span className="text-white font-bold text-xl">
                              {doctor.full_name?.charAt(0)?.toUpperCase() || 'D'}
                            </span>
                          </div>
                          <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 border-3 border-white rounded-full shadow-lg">
                            <div className="w-full h-full bg-green-400 rounded-full animate-pulse"></div>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-gray-800 transition-colors">
                            Dr. {doctor.full_name}
                          </h3>
                          <p className="text-base text-gray-600 mb-4 group-hover:text-gray-700 transition-colors">
                            {doctor.specialization}
                          </p>
                          
                          <div className="flex items-center space-x-6 mb-6">
                            <div className="flex items-center space-x-2 px-3 py-1 bg-yellow-100 rounded-full">
                              <FiStar className="w-4 h-4 text-yellow-500 fill-current" />
                              <span className="text-sm font-semibold text-gray-700">{doctor.rating || 0}</span>
                            </div>
                            <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 rounded-full">
                              <FiClock className="w-4 h-4 text-blue-500" />
                              <span className="text-sm font-semibold text-gray-700">
                                {doctor.experience} years
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                                ₹{doctor.consultation_fee}
                              </p>
                              <p className="text-sm text-gray-500">per consultation</p>
                            </div>

                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleStartChat(doctor)}
                              className="px-6 py-3 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-2xl font-semibold hover:from-primary-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2"
                            >
                              <FiMessageCircle className="w-5 h-5" />
                              <span>Start Chat</span>
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center py-16"
              >
                <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
                  <FiSearch className="w-16 h-16 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg">No doctors found.</p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Doctors;
