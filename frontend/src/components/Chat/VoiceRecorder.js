import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMic, FiSquare, FiPlay, FiPause, FiTrash2, FiX } from 'react-icons/fi';

const VoiceRecorder = ({ onVoiceUpload, onClose }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playingDuration, setPlayingDuration] = useState(0);
  
  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const durationIntervalRef = useRef(null);
  const playingIntervalRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (playingIntervalRef.current) {
        clearInterval(playingIntervalRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;
      chunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Start duration counter
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    }
  };

  const playAudio = () => {
    if (audioRef.current && audioUrl) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        if (playingIntervalRef.current) {
          clearInterval(playingIntervalRef.current);
        }
      } else {
        audioRef.current.play();
        setIsPlaying(true);
        setPlayingDuration(0);
        
        playingIntervalRef.current = setInterval(() => {
          setPlayingDuration(prev => {
            const newDuration = prev + 1;
            if (newDuration >= recordingDuration) {
              setIsPlaying(false);
              clearInterval(playingIntervalRef.current);
              return recordingDuration;
            }
            return newDuration;
          });
        }, 1000);
      }
    }
  };

  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingDuration(0);
    setPlayingDuration(0);
    setIsPlaying(false);
  };

  const sendVoiceMessage = () => {
    if (audioBlob) {
      onVoiceUpload(audioBlob);
      onClose();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white/95 backdrop-blur-sm rounded-xl p-3 w-full max-w-xs mx-4 shadow-xl border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-r from-primary-500 to-purple-500 rounded-lg flex items-center justify-center">
              <FiMic className="w-3 h-3 text-white" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Voice Message</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100/80 rounded-lg transition-all duration-300"
          >
            <FiX className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Recording Area */}
        <div className="text-center">
          {!audioBlob ? (
            <div>
              {/* Recording Button */}
              <div className="mb-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 shadow-md ${
                    isRecording 
                      ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 animate-pulse' 
                      : 'bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700'
                  }`}
                >
                  {isRecording ? (
                    <FiSquare className="w-4 h-4 text-white" />
                  ) : (
                    <FiMic className="w-4 h-4 text-white" />
                  )}
                </motion.button>
              </div>

              {/* Recording Status */}
              <div className="mb-3">
                {isRecording ? (
                  <div>
                    <p className="text-red-600 font-semibold text-xs mb-1">Recording...</p>
                    <p className="text-lg font-mono text-gray-900 font-bold">{formatTime(recordingDuration)}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-700 font-medium text-xs mb-1">Tap to start recording</p>
                    <p className="text-xs text-gray-500">Hold to record your voice message</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              {/* Audio Player */}
              <div className="mb-3">
                <div className="flex items-center justify-center space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={playAudio}
                    className="w-10 h-10 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 rounded-lg flex items-center justify-center transition-all duration-300 shadow-sm"
                  >
                    {isPlaying ? (
                      <FiPause className="w-4 h-4 text-white" />
                    ) : (
                      <FiPlay className="w-4 h-4 text-white ml-1" />
                    )}
                  </motion.button>
                  
                  <div className="flex-1 max-w-xs">
                    <div className="bg-gray-200 rounded-full h-1.5 mb-1">
                      <div 
                        className="bg-gradient-to-r from-primary-600 to-purple-600 h-1.5 rounded-full transition-all duration-100"
                        style={{ 
                          width: `${audioBlob ? (playingDuration / recordingDuration) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 font-medium">
                      <span>{formatTime(playingDuration)}</span>
                      <span>{formatTime(recordingDuration)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-700 font-medium mb-3">
                Voice message ({formatTime(recordingDuration)})
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-1">
            {audioBlob && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={deleteRecording}
                className="flex-1 px-2 py-1.5 bg-gray-100/80 text-gray-700 rounded-md hover:bg-red-100 hover:text-red-700 transition-all duration-300 flex items-center justify-center space-x-1 text-xs font-medium"
              >
                <FiTrash2 className="w-3 h-3" />
                <span>Delete</span>
              </motion.button>
            )}
            
            {audioBlob ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={sendVoiceMessage}
                className="flex-1 px-2 py-1.5 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-md hover:from-primary-700 hover:to-purple-700 transition-all duration-300 text-xs font-medium"
              >
                Send
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="flex-1 px-2 py-1.5 bg-gray-100/80 text-gray-700 rounded-md hover:bg-gray-200 transition-all duration-300 text-xs font-medium"
              >
                Cancel
              </motion.button>
            )}
          </div>
        </div>

        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => {
            setIsPlaying(false);
            setPlayingDuration(0);
            if (playingIntervalRef.current) {
              clearInterval(playingIntervalRef.current);
            }
          }}
        />
      </motion.div>
    </motion.div>
  );
};

export default VoiceRecorder;
