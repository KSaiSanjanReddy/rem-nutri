import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUpload, FiX, FiFile, FiImage, FiFileText, FiPaperclip } from 'react-icons/fi';

const FileUpload = ({ onFileUpload, onClose }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const onDrop = useCallback((acceptedFiles) => {
    const files = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      preview: URL.createObjectURL(file)
    }));
    
    setUploadedFiles(prev => [...prev, ...files]);
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'application/zip': ['.zip'],
      'application/x-rar-compressed': ['.rar']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  });

  const removeFile = (fileId) => {
    setUploadedFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  const handleUpload = async () => {
    if (uploadedFiles.length === 0) return;
    
    if (!onFileUpload) {
      console.error('onFileUpload prop is not provided');
      return;
    }

    setUploading(true);
    
    try {
      for (const fileData of uploadedFiles) {
        await onFileUpload(fileData.file);
      }
      
      setUploadedFiles([]);
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return FiImage;
    if (type === 'application/pdf') return FiFileText;
    return FiFile;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50 p-4 pb-20"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white/95 backdrop-blur-sm rounded-xl p-4 w-full max-w-sm mx-4 shadow-xl border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-purple-500 rounded-xl flex items-center justify-center">
              <FiPaperclip className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Upload Files</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100/80 rounded-lg transition-all duration-300"
          >
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Drop Zone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 ${
            isDragActive
              ? isDragReject
                ? 'border-red-500 bg-red-50/50'
                : 'border-primary-500 bg-primary-50/50'
              : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50/30'
          }`}
        >
          <input {...getInputProps()} />
          <div className="w-12 h-12 bg-gradient-to-r from-primary-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <FiUpload className="h-6 w-6 text-primary-600" />
          </div>
          <p className="text-sm text-gray-700 font-medium mb-2">
            {isDragActive
              ? isDragReject
                ? 'Some files are not supported'
                : 'Drop files here...'
              : 'Drag & drop files here, or click to select'
            }
          </p>
          <p className="text-xs text-gray-500">
            Supports: Images, PDF, DOC, TXT, ZIP (Max 10MB each)
          </p>
        </div>

        {/* Uploaded Files */}
        <AnimatePresence>
          {uploadedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-2"
            >
              <h4 className="text-sm font-medium text-gray-900">Selected Files:</h4>
              {uploadedFiles.map((fileData) => {
                const Icon = getFileIcon(fileData.type);
                return (
                  <motion.div
                    key={fileData.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <Icon className="w-5 h-5 text-gray-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {fileData.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(fileData.size)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFile(fileData.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex space-x-2 mt-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="flex-1 px-3 py-2 bg-gray-100/80 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-300 text-sm font-medium"
            disabled={uploading}
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleUpload}
            disabled={uploadedFiles.length === 0 || uploading}
            className="flex-1 px-3 py-2 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-lg hover:from-primary-700 hover:to-purple-700 transition-all duration-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : `Upload ${uploadedFiles.length} file${uploadedFiles.length !== 1 ? 's' : ''}`}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FileUpload;
