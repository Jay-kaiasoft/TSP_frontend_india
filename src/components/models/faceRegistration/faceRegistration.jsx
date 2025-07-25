// import React, { useEffect, useRef, useState } from 'react';
// import * as faceapi from 'face-api.js';
// import { styled, useTheme } from '@mui/material/styles';
// import Components from '../../muiComponents/components';
// import Button from '../../common/buttons/button';
// import { connect } from 'react-redux';
// import { setAlert } from '../../../redux/commonReducers/commonReducers';
// import CustomIcons from '../../common/icons/CustomIcons';
// import { faceRecognitionAPIBaseURL, faceRecognitionModelURL } from '../../../config/apiConfig/apiConfig';
// import { useNavigate } from 'react-router-dom';

// const BootstrapDialog = styled(Components.Dialog)(({ theme }) => ({
//     '& .MuiDialogContent-root': {
//         padding: theme.spacing(2),
//     },
//     '& .MuiDialogActions-root': {
//         padding: theme.spacing(1),
//     },
// }));

// const API_BASE_URL = faceRecognitionAPIBaseURL;
// const modelsPath = faceRecognitionModelURL;

// function FaceRegistration({ setAlert, open, handleClose, employeeId, type = null, setLoginInfo }) {
//     const theme = useTheme();
//     const navigate = useNavigate();

//     const onClose = () => {
//         handleClose();
//         stopWebcam();
//     };

//     // Refs
//     const faceAlignedRef = useRef(false);
//     const countdownIntervalRef = useRef(null);
//     const webcamVideoRef = useRef(null);
//     const capturedPhotoRef = useRef(null);
//     const photoCanvasRef = useRef(null);
//     const detectionCanvasRef = useRef(null);
//     const faceFrameRef = useRef(null);
//     const webcamDisplayRef = useRef(null);
//     const capturedDisplayRef = useRef(null);
//     const countdownActiveRef = useRef(false);
//     const faceDetectionIntervalRef = useRef(null);
//     const prevFrameRef = useRef(null);
//     const blinkHistoryRef = useRef([]);

//     // State
//     const [currentStream, setCurrentStream] = useState(null);
//     const [capturedImageDataURL, setCapturedImageDataURL] = useState(null);
//     const [modelsLoaded, setModelsLoaded] = useState(false);
//     const [isPhotoAlreadyCaptured, setIsPhotoAlreadyCaptured] = useState(false);
//     const [isLoading, setIsLoading] = useState(false);
//     const [registerMessage, setRegisterMessage] = useState({ text: '', type: '' });
//     const [blinkCount, setBlinkCount] = useState(0);
//     const [motionDetected, setMotionDetected] = useState(false);
//     const [livenessScore, setLivenessScore] = useState(0);

//     // Helper functions
//     const dataURLtoBlob = (dataurl) => {
//         const arr = dataurl.split(',');
//         const mime = arr[0].match(/:(.*?);/)[1];
//         const bstr = atob(arr[1]);
//         let n = bstr.length;
//         const u8arr = new Uint8Array(n);
//         while (n--) {
//             u8arr[n] = bstr.charCodeAt(n);
//         }
//         return new Blob([u8arr], { type: mime });
//     };

//     const showMessage = (setter, msg, type) => {
//         setter({ text: msg, type });
//     };

//     const clearMessage = (setter) => {
//         setter({ text: '', type: '' });
//     };

//     // Eye aspect ratio calculation
//     // Improved eye aspect ratio calculation
//     const eyeAspectRatio = (eye) => {
//         try {
//             // Vertical distances
//             const A = distance(eye[1], eye[5]);
//             const B = distance(eye[2], eye[4]);

//             // Horizontal distance
//             const C = distance(eye[0], eye[3]);

//             // Avoid division by zero
//             if (C === 0) return 0;

//             return (A + B) / (2 * C);
//         } catch (error) {
//             console.error('Error calculating EAR:', error);
//             return 0;
//         }
//     };

//     const distance = (point1, point2) => {
//         return Math.sqrt(
//             Math.pow(point1.x - point2.x, 2) +
//             Math.pow(point1.y - point2.y, 2)
//         );
//     };

//     // Motion detection
//     const detectMotion = () => {
//         if (!webcamVideoRef.current) return;

//         const canvas = document.createElement('canvas');
//         canvas.width = webcamVideoRef.current.videoWidth;
//         canvas.height = webcamVideoRef.current.videoHeight;
//         const ctx = canvas.getContext('2d');
//         ctx.drawImage(webcamVideoRef.current, 0, 0);
//         const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);

//         if (prevFrameRef.current) {
//             const diff = frameDiff(prevFrameRef.current, currentFrame);
//             if (diff > 0.1) {
//                 setMotionDetected(true);
//                 setLivenessScore(prev => Math.min(prev + 5, 100)); // Increase liveness score
//             }
//         }

//         prevFrameRef.current = currentFrame;
//     };

//     const frameDiff = (frame1, frame2) => {
//         let diff = 0;
//         for (let i = 0; i < frame1.data.length; i += 4) {
//             diff += Math.abs(frame1.data[i] - frame2.data[i]) / 255;
//             diff += Math.abs(frame1.data[i + 1] - frame2.data[i + 1]) / 255;
//             diff += Math.abs(frame1.data[i + 2] - frame2.data[i + 2]) / 255;
//         }
//         return diff / (frame1.data.length / 4 * 3);
//     };

//     // Texture analysis for liveness
//     const analyzeTexture = (imageData) => {
//         const grayscale = [];
//         for (let i = 0; i < imageData.data.length; i += 4) {
//             grayscale.push(
//                 0.299 * imageData.data[i] +
//                 0.587 * imageData.data[i + 1] +
//                 0.114 * imageData.data[i + 2]
//             );
//         }

//         const mean = grayscale.reduce((a, b) => a + b, 0) / grayscale.length;
//         const variance = grayscale.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / grayscale.length;

//         // Higher variance indicates more texture (likely real face)
//         return Math.min(variance / 10, 10); // Normalize to 0-10 scale
//     };

//     // Load face-api.js models
//     const loadModels = async () => {
//         try {
//             await Promise.all([
//                 faceapi.nets.tinyFaceDetector.load(modelsPath),
//                 faceapi.nets.faceLandmark68Net.load(modelsPath)
//             ]);
//             setModelsLoaded(true);
//             showMessage(setRegisterMessage, 'Models loaded. Please position your face and follow the instructions.', 'info');
//         } catch (error) {
//             console.error('Failed to load face-api.js models:', error);
//             showMessage(setRegisterMessage, 'Error loading face detection models. Please refresh.', 'error');
//         }
//     };

//     const handlePlayVideo = async (videoElement) => {
//         try {
//             await videoElement.play();
//         } catch (err) {
//             console.log('Video play error:', err);
//             videoElement.muted = true;
//             try {
//                 await videoElement.play();
//             } catch (err2) {
//                 console.log('Second video play attempt failed:', err2);
//             }
//         }
//     };

//     const detectFaces = async () => {
//         // Early exit conditions
//         if (isPhotoAlreadyCaptured || !webcamVideoRef.current ||
//             webcamVideoRef.current.paused || webcamVideoRef.current.ended ||
//             !modelsLoaded) {
//             return;
//         }

//         try {
//             // 1. Perform face detection with enhanced options
//             const detection = await faceapi.detectSingleFace(
//                 webcamVideoRef.current,
//                 new faceapi.TinyFaceDetectorOptions({
//                     inputSize: 512,       // Higher resolution for better accuracy
//                     scoreThreshold: 0.55,  // Slightly higher threshold for reliability
//                 })
//             ).withFaceLandmarks();

//             // Debug output
//             const debugData = {
//                 detected: !!detection,
//                 score: detection?.detection?.score?.toFixed(3),
//                 landmarks: !!detection?.landmarks,
//                 leftEye: detection?.landmarks?.getLeftEye()?.length,
//                 rightEye: detection?.landmarks?.getRightEye()?.length,
//                 timestamp: Date.now()
//             };
//             console.debug('Face Detection:', debugData);

//             // 2. Handle no/low-quality detection
//             if (!detection || !detection.detection || detection.detection.score < 0.5) {
//                 if (!isPhotoAlreadyCaptured) {
//                     showMessage(setRegisterMessage, 'Position your face in the center', 'info');
//                 }
//                 resetDetectionState();
//                 return;
//             }

//             // 3. Prepare display dimensions
//             const displaySize = {
//                 width: webcamVideoRef.current.offsetWidth,
//                 height: webcamVideoRef.current.offsetHeight
//             };
//             const resizedDetection = faceapi.resizeResults(detection, displaySize);

//             // 4. Draw detection and landmarks with validation
//             if (detectionCanvasRef.current) {
//                 const ctx = detectionCanvasRef.current.getContext('2d');
//                 ctx.clearRect(0, 0, detectionCanvasRef.current.width, detectionCanvasRef.current.height);

//                 // Only draw if we have valid results
//                 if (resizedDetection.detection) {
//                     faceapi.draw.drawDetections(detectionCanvasRef.current, resizedDetection);
//                 }
//                 if (resizedDetection.landmarks) {
//                     faceapi.draw.drawFaceLandmarks(detectionCanvasRef.current, resizedDetection);
//                 }
//             }

//             // 5. Enhanced blink detection with temporal analysis
//             if (detection.landmarks) {
//                 const blinkResult = await detectBlinksEnhanced(detection.landmarks);

//                 if (blinkResult.didBlink) {
//                     setBlinkCount(prev => {
//                         const newCount = Math.min(prev + 1, 2); // Cap at 2 blinks

//                         if (newCount > prev) {
//                             setLivenessScore(prevScore => Math.min(prevScore + 25, 100));
//                             showVisualFeedback('#3b82f6'); // Blue flash on blink

//                             showMessage(
//                                 setRegisterMessage,
//                                 `Blink detected! (${newCount}/2)`,
//                                 'success'
//                             );
//                         }
//                         return newCount;
//                     });
//                 }

//                 // Log detailed blink analysis
//                 console.debug('Blink Analysis:', {
//                     ...blinkResult.debugInfo,
//                     currentBlinks: blinkCount,
//                     livenessScore: livenessScore
//                 });
//             }

//             // 6. Face alignment verification
//             const faceBox = resizedDetection.detection?.box;
//             if (!faceBox) {
//                 console.warn('Valid face box not found');
//                 return;
//             }

//             const { isWithinFrame, scaledFaceBox } = checkFaceAlignment(
//                 faceBox,
//                 webcamVideoRef.current,
//                 faceFrameRef.current
//             );

//             // 7. Update UI based on alignment
//             updateFrameUI(isWithinFrame);

//             // 8. Handle countdown for capture
//             if (isWithinFrame && blinkCount >= 2 && livenessScore >= 70) {
//                 if (!countdownActiveRef.current) {
//                     startCountdown();
//                 }
//             } else {
//                 cancelCountdown();
//             }

//         } catch (err) {
//             console.error('Face detection error:', err);
//             showMessage(setRegisterMessage, 'Detection error. Please try again.', 'error');
//             resetDetectionState();
//         }
//     };

//     // Helper Functions:

//     // Enhanced blink detection with temporal analysis
//     const detectBlinksEnhanced = async (landmarks) => {
//         const result = {
//             didBlink: false,
//             debugInfo: {
//                 leftEAR: 0,
//                 rightEAR: 0,
//                 avgEAR: 0,
//                 history: [],
//                 state: 'open'
//             }
//         };

//         try {
//             const leftEye = landmarks.getLeftEye();
//             const rightEye = landmarks.getRightEye();

//             // Validate eye points
//             if (!leftEye || !rightEye || leftEye.length < 6 || rightEye.length < 6) {
//                 result.debugInfo.state = 'invalid landmarks';
//                 return result;
//             }

//             // Calculate robust Eye Aspect Ratio
//             const calculateEAR = (eye) => {
//                 try {
//                     const vertical1 = Math.hypot(eye[1].x - eye[5].x, eye[1].y - eye[5].y);
//                     const vertical2 = Math.hypot(eye[2].x - eye[4].x, eye[2].y - eye[4].y);
//                     const horizontal = Math.hypot(eye[0].x - eye[3].x, eye[0].y - eye[3].y);
//                     return horizontal > 0 ? (vertical1 + vertical2) / (2 * horizontal) : 0;
//                 } catch (e) {
//                     console.error('EAR calculation error:', e);
//                     return 0;
//                 }
//             };

//             const leftEAR = calculateEAR(leftEye);
//             const rightEAR = calculateEAR(rightEye);
//             const avgEAR = (leftEAR + rightEAR) / 2;

//             // Update blink history
//             const now = Date.now();
//             blinkHistoryRef.current.push({
//                 ear: avgEAR,
//                 timestamp: now
//             });

//             // Keep only recent history (last 1.2 seconds)
//             blinkHistoryRef.current = blinkHistoryRef.current.filter(
//                 entry => now - entry.timestamp < 1200
//             );

//             // State machine for blink detection
//             if (avgEAR < 0.20) { // Eyes closed
//                 if (blinkHistoryRef.current.blinkState !== 'closed') {
//                     blinkHistoryRef.current.blinkState = 'closed';
//                     result.debugInfo.state = 'closing';
//                 }
//             }
//             else if (avgEAR > 0.25) { // Eyes open
//                 if (blinkHistoryRef.current.blinkState === 'closed') {
//                     // Valid blink detected (transition from closed to open)
//                     result.didBlink = true;
//                     result.debugInfo.state = 'blink completed';
//                 }
//                 blinkHistoryRef.current.blinkState = 'open';
//             }

//             // Populate debug info
//             result.debugInfo = {
//                 leftEAR: parseFloat(leftEAR.toFixed(3)),
//                 rightEAR: parseFloat(rightEAR.toFixed(3)),
//                 avgEAR: parseFloat(avgEAR.toFixed(3)),
//                 history: blinkHistoryRef.current.map(e => parseFloat(e.ear.toFixed(3))),
//                 state: result.debugInfo.state,
//                 frames: blinkHistoryRef.current.length
//             };

//         } catch (error) {
//             console.error('Blink detection error:', error);
//             result.debugInfo.error = error.message;
//         }

//         return result;
//     };

//     // Face alignment verification
//     const checkFaceAlignment = (faceBox, videoElement, frameElement) => {
//         const videoRect = videoElement.getBoundingClientRect();
//         const frameRect = frameElement.getBoundingClientRect();

//         const scaleX = videoElement.videoWidth / videoElement.offsetWidth;
//         const scaleY = videoElement.videoHeight / videoElement.offsetHeight;

//         const scaledFaceBox = {
//             x: faceBox.x * scaleX,
//             y: faceBox.y * scaleY,
//             width: faceBox.width * scaleX,
//             height: faceBox.height * scaleY
//         };

//         const scaledFrame = {
//             x: (frameRect.left - videoRect.left) * scaleX,
//             y: (frameRect.top - videoRect.top) * scaleY,
//             width: frameRect.width * scaleX,
//             height: frameRect.height * scaleY
//         };

//         // 10% margin on all sides
//         const marginX = scaledFrame.width * 0.10;
//         const marginY = scaledFrame.height * 0.10;

//         const isWithinFrame =
//             scaledFaceBox.x + scaledFaceBox.width > scaledFrame.x + marginX &&
//             scaledFaceBox.y + scaledFaceBox.height > scaledFrame.y + marginY &&
//             scaledFaceBox.x < scaledFrame.x + scaledFrame.width - marginX &&
//             scaledFaceBox.y < scaledFrame.y + scaledFrame.height - marginY;

//         return { isWithinFrame, scaledFaceBox };
//     };

//     // UI Updates
//     const updateFrameUI = (isAligned) => {
//         faceAlignedRef.current = isAligned;
//         if (faceFrameRef.current) {
//             const color = isAligned ? "#22c55e" : "#ef4444";
//             faceFrameRef.current.style.borderColor = color;
//             faceFrameRef.current.querySelectorAll('.corner').forEach(c => {
//                 c.style.borderColor = color;
//             });
//         }
//     };

//     const showVisualFeedback = (color) => {
//         if (faceFrameRef.current) {
//             faceFrameRef.current.style.borderColor = color;
//             setTimeout(() => {
//                 if (faceFrameRef.current) {
//                     faceFrameRef.current.style.borderColor =
//                         faceAlignedRef.current ? "#22c55e" : "#ef4444";
//                 }
//             }, 300);
//         }
//     };

//     const cancelCountdown = () => {
//         if (countdownIntervalRef.current) {
//             clearInterval(countdownIntervalRef.current);
//             countdownIntervalRef.current = null;
//             countdownActiveRef.current = false;
//         }
//     };

//     // Helper functions used in detectFaces
//     const resetDetectionState = () => {
//         faceAlignedRef.current = false;
//         if (countdownIntervalRef.current) {
//             clearInterval(countdownIntervalRef.current);
//             countdownIntervalRef.current = null;
//             countdownActiveRef.current = false;
//         }
//     };

//     const startCountdown = () => {
//         countdownActiveRef.current = true;
//         let countdown = 2;

//         showMessage(setRegisterMessage, 'Perfect! Capturing in 2 seconds...', 'success');

//         countdownIntervalRef.current = setInterval(() => {
//             countdown--;

//             if (countdown > 0) {
//                 showMessage(setRegisterMessage, `Capturing in ${countdown}...`, 'success');
//             } else {
//                 clearInterval(countdownIntervalRef.current);
//                 countdownIntervalRef.current = null;
//                 countdownActiveRef.current = false;
//                 capturePhoto();
//             }
//         }, 1000);
//     };


//     const detectBlinks = (landmarks) => {
//         const result = {
//             didBlink: false,
//             debugInfo: null
//         };

//         try {
//             const leftEye = landmarks.getLeftEye();
//             const rightEye = landmarks.getRightEye();

//             // Validate eye points
//             if (!leftEye || !rightEye || leftEye.length < 6 || rightEye.length < 6) {
//                 result.debugInfo = 'Invalid eye landmarks';
//                 return result;
//             }

//             // Calculate Eye Aspect Ratios with validation
//             const calculateEAR = (eye) => {
//                 try {
//                     const A = Math.hypot(eye[1].x - eye[5].x, eye[1].y - eye[5].y);
//                     const B = Math.hypot(eye[2].x - eye[4].x, eye[2].y - eye[4].y);
//                     const C = Math.hypot(eye[0].x - eye[3].x, eye[0].y - eye[3].y);
//                     return (A + B) / (2 * C);
//                 } catch (e) {
//                     console.error('EAR calculation error:', e);
//                     return 0;
//                 }
//             };

//             const leftEAR = calculateEAR(leftEye);
//             const rightEAR = calculateEAR(rightEye);
//             const avgEAR = (leftEAR + rightEAR) / 2;

//             // Update blink history
//             const now = Date.now();
//             blinkHistoryRef.current.push({
//                 ear: avgEAR,
//                 timestamp: now
//             });

//             // Keep only recent history (last 1 second)
//             blinkHistoryRef.current = blinkHistoryRef.current.filter(
//                 entry => now - entry.timestamp < 1000
//             );

//             // Blink detection logic
//             if (avgEAR < 0.21) { // Eyes closed threshold (adjusted lower)
//                 if (!blinkHistoryRef.current.currentlyBlinking) {
//                     // Check if eyes were open recently (3 frames ago)
//                     if (blinkHistoryRef.current.length > 3) {
//                         const wasOpen = blinkHistoryRef.current
//                             .slice(0, -3)
//                             .some(entry => entry.ear > 0.25);

//                         if (wasOpen) {
//                             result.didBlink = true;
//                             blinkHistoryRef.current.currentlyBlinking = true;
//                         }
//                     }
//                 }
//             } else if (avgEAR > 0.25) { // Eyes open threshold
//                 blinkHistoryRef.current.currentlyBlinking = false;
//             }

//             result.debugInfo = {
//                 leftEAR: leftEAR.toFixed(3),
//                 rightEAR: rightEAR.toFixed(3),
//                 avgEAR: avgEAR.toFixed(3),
//                 history: blinkHistoryRef.current.map(e => e.ear.toFixed(3)),
//                 blinkDetected: result.didBlink
//             };

//         } catch (error) {
//             console.error('Blink detection error:', error);
//             result.debugInfo = `Error: ${error.message}`;
//         }

//         return result;
//     };

//     // Webcam management
//     const startWebcam = async () => {
//         stopWebcam();
//         clearMessage(setRegisterMessage);
//         setCapturedImageDataURL(null);
//         setIsPhotoAlreadyCaptured(false);
//         countdownActiveRef.current = false;
//         setBlinkCount(0);
//         setMotionDetected(false);
//         setLivenessScore(0);
//         blinkHistoryRef.current = [];

//         if (webcamDisplayRef.current) webcamDisplayRef.current.classList.remove('hidden');
//         if (capturedDisplayRef.current) capturedDisplayRef.current.classList.add('hidden');
//         if (webcamVideoRef.current) webcamVideoRef.current.classList.remove('hidden');
//         if (detectionCanvasRef.current) detectionCanvasRef.current.classList.remove('hidden');
//         if (faceFrameRef.current) faceFrameRef.current.classList.remove('hidden');

//         if (currentStream) {
//             currentStream.getTracks().forEach(track => track.stop());
//             setCurrentStream(null);
//         }

//         if (faceDetectionIntervalRef.current) {
//             clearInterval(faceDetectionIntervalRef.current);
//             faceDetectionIntervalRef.current = null;
//         }

//         if (countdownIntervalRef.current) {
//             clearInterval(countdownIntervalRef.current);
//             countdownIntervalRef.current = null;
//         }

//         try {
//             const stream = await navigator.mediaDevices.getUserMedia({
//                 video: {
//                     width: { ideal: 1280 },
//                     height: { ideal: 720 },
//                     facingMode: 'user'
//                 }
//             });
//             setCurrentStream(stream);

//             if (webcamVideoRef.current) {
//                 webcamVideoRef.current.srcObject = stream;
//                 showMessage(setRegisterMessage, 'Webcam started. Please position your face within the frame.', 'info');

//                 webcamVideoRef.current.onloadedmetadata = async () => {
//                     try {
//                         await handlePlayVideo(webcamVideoRef.current);
//                         const displaySize = {
//                             width: webcamVideoRef.current.offsetWidth,
//                             height: webcamVideoRef.current.offsetHeight
//                         };
//                         faceapi.matchDimensions(detectionCanvasRef.current, displaySize);
//                     } catch (err) {
//                         console.error('onloadedmetadata: Error in handler:', err);
//                         showMessage(setRegisterMessage, 'Error starting webcam. Please try again.', 'error');
//                     }
//                 };
//             }
//         } catch (err) {
//             console.error('startWebcam: Error accessing webcam:', err);
//             showMessage(setRegisterMessage, 'Could not start webcam. Please check permissions.', 'error');
//         }
//     };

//     const stopWebcam = () => {
//         if (currentStream) {
//             currentStream.getTracks().forEach(track => track.stop());
//             setCurrentStream(null);
//         }

//         if (faceDetectionIntervalRef.current) {
//             clearInterval(faceDetectionIntervalRef.current);
//             faceDetectionIntervalRef.current = null;
//         }

//         if (countdownIntervalRef.current) {
//             clearInterval(countdownIntervalRef.current);
//             countdownIntervalRef.current = null;
//         }

//         countdownActiveRef.current = false;
//         faceAlignedRef.current = false;
//         clearMessage(setRegisterMessage);
//         setCapturedImageDataURL(null);
//         setIsPhotoAlreadyCaptured(false);
//     };

//     // Photo capture
//     const capturePhoto = () => {
//         if (!currentStream) {
//             showMessage(setRegisterMessage, 'Webcam not active.', 'error');
//             return;
//         }

//         if (!faceAlignedRef.current || blinkCount < 2 || livenessScore < 70) {
//             showMessage(setRegisterMessage, 'Liveness verification failed. Please try again.', 'error');
//             return;
//         }

//         try {
//             const videoWidth = webcamVideoRef.current.videoWidth;
//             const videoHeight = webcamVideoRef.current.videoHeight;
//             const displayWidth = webcamVideoRef.current.offsetWidth;
//             const displayHeight = webcamVideoRef.current.offsetHeight;

//             const frameRect = faceFrameRef.current.getBoundingClientRect();
//             const videoRect = webcamVideoRef.current.getBoundingClientRect();

//             const frameX_display = frameRect.left - videoRect.left;
//             const frameY_display = frameRect.top - videoRect.top;
//             const frameWidth_display = frameRect.width;
//             const frameHeight_display = frameRect.height;

//             const scaleX = videoWidth / displayWidth;
//             const scaleY = videoHeight / displayHeight;

//             const paddingPercentage = 0.1;

//             const sourceX = Math.max(0, (frameX_display * scaleX) - (frameWidth_display * scaleX * paddingPercentage));
//             const sourceY = Math.max(0, (frameY_display * scaleY) - (frameHeight_display * scaleY * paddingPercentage));
//             const sourceWidth = Math.min(videoWidth - sourceX, (frameWidth_display * scaleX) * (1 + paddingPercentage * 2));
//             const sourceHeight = Math.min(videoHeight - sourceY, (frameHeight_display * scaleY) * (1 + paddingPercentage * 2));

//             photoCanvasRef.current.width = sourceWidth;
//             photoCanvasRef.current.height = sourceHeight;
//             const context = photoCanvasRef.current.getContext('2d');

//             context.drawImage(
//                 webcamVideoRef.current,
//                 sourceX, sourceY, sourceWidth, sourceHeight,
//                 0, 0, photoCanvasRef.current.width, photoCanvasRef.current.height
//             );

//             // Additional liveness check with texture analysis
//             const imageData = context.getImageData(0, 0, photoCanvasRef.current.width, photoCanvasRef.current.height);
//             const textureScore = analyzeTexture(imageData);
//             setLivenessScore(prev => Math.min(prev + textureScore, 100));

//             if (livenessScore < 80) {
//                 showMessage(setRegisterMessage, 'Liveness verification failed. Please try again.', 'error');
//                 retakePhoto();
//                 return;
//             }

//             const dataURL = photoCanvasRef.current.toDataURL('image/jpeg', 0.9);
//             setCapturedImageDataURL(dataURL);
//             if (capturedPhotoRef.current) capturedPhotoRef.current.src = dataURL;

//             webcamDisplayRef.current?.classList.add('hidden');
//             capturedDisplayRef.current?.classList.remove('hidden');

//             setIsPhotoAlreadyCaptured(true);
//             faceAlignedRef.current = false;

//             if (faceDetectionIntervalRef.current) {
//                 clearInterval(faceDetectionIntervalRef.current);
//                 faceDetectionIntervalRef.current = null;
//             }

//             if (countdownIntervalRef.current) {
//                 clearInterval(countdownIntervalRef.current);
//                 countdownIntervalRef.current = null;
//             }

//             countdownActiveRef.current = false;
//             showMessage(setRegisterMessage, 'Face captured successfully! You can now register.', 'success');
//         } catch (err) {
//             console.error('Error capturing photo:', err);
//             showMessage(setRegisterMessage, 'Error capturing photo. Please try again.', 'error');
//         }
//     };

//     const retakePhoto = () => {
//         clearMessage(setRegisterMessage);
//         setCapturedImageDataURL(null);
//         setIsPhotoAlreadyCaptured(false);
//         countdownActiveRef.current = false;
//         setBlinkCount(0);
//         setMotionDetected(false);
//         setLivenessScore(0);
//         blinkHistoryRef.current = [];

//         capturedDisplayRef.current?.classList.add('hidden');
//         webcamDisplayRef.current?.classList.remove('hidden');

//         startWebcam();
//     };

//     // Registration API call
//     const registerUser = async () => {
//         setIsLoading(true);
//         clearMessage(setRegisterMessage);

//         if (!capturedImageDataURL) {
//             setIsLoading(false);
//             showMessage(setRegisterMessage, 'No captured face detected. Please retake or capture a new face.', 'error');
//             return;
//         }

//         const imageBlob = dataURLtoBlob(capturedImageDataURL);
//         const formData = new FormData();

//         const isLogin = type === "login";
//         const fieldName = isLogin ? "file" : "image";
//         const fileName = isLogin ? "login.jpg" : "register.jpg";
//         const apiEndpoint = isLogin ? "/login" : "/register";

//         formData.append('employeeId', employeeId);
//         formData.append(fieldName, imageBlob, fileName);
//         formData.append('livenessScore', livenessScore.toString());

//         try {
//             const response = await fetch(`${API_BASE_URL}${apiEndpoint}`, {
//                 method: 'POST',
//                 body: formData,
//             });

//             const data = await response.json();
//             if (response.ok) {
//                 setIsLoading(false);
//                 if (!isLogin) {
//                     setAlert({
//                         open: true,
//                         type: 'success',
//                         message: 'Face registered successfully!'
//                     });
//                     navigate('/dashboard/manageemployees');
//                 } else {
//                     setLoginInfo(data);
//                 }
//                 onClose();
//             } else {
//                 setIsLoading(false);
//                 setAlert({
//                     open: true,
//                     type: 'error',
//                     message: `${isLogin ? 'Login' : 'Registration'} failed: ${data.detail || 'Unknown error.'}`
//                 });
//             }
//         } catch (error) {
//             setIsLoading(false);
//             setAlert({
//                 type: 'error',
//                 message: `${isLogin ? 'Login' : 'Registration'} failed due to network or server error.`
//             });
//         }
//     };

//     // Effects
//     useEffect(() => {
//         if (modelsLoaded && currentStream && webcamVideoRef.current && !isPhotoAlreadyCaptured) {
//             if (faceDetectionIntervalRef.current) {
//                 clearInterval(faceDetectionIntervalRef.current);
//             }
//             faceDetectionIntervalRef.current = setInterval(detectFaces, 150);
//         } else {
//             if (faceDetectionIntervalRef.current) {
//                 clearInterval(faceDetectionIntervalRef.current);
//                 faceDetectionIntervalRef.current = null;
//             }
//             if (countdownIntervalRef.current) {
//                 clearInterval(countdownIntervalRef.current);
//                 countdownIntervalRef.current = null;
//                 countdownActiveRef.current = false;
//             }
//             if (isPhotoAlreadyCaptured) {
//                 faceAlignedRef.current = false;
//             }
//         }

//         return () => {
//             if (faceDetectionIntervalRef.current) {
//                 clearInterval(faceDetectionIntervalRef.current);
//                 faceDetectionIntervalRef.current = null;
//             }
//             if (countdownIntervalRef.current) {
//                 clearInterval(countdownIntervalRef.current);
//                 countdownIntervalRef.current = null;
//             }
//             countdownActiveRef.current = false;
//         };
//     }, [modelsLoaded, currentStream, isPhotoAlreadyCaptured]);

//     useEffect(() => {
//         if (open) {
//             loadModels().then(startWebcam);
//         } else {
//             stopWebcam();
//         }
//     }, [open]);

//     useEffect(() => {
//         const debugInterval = setInterval(() => {
//             if (blinkHistoryRef.current.length > 0) {
//                 const latest = blinkHistoryRef.current[blinkHistoryRef.current.length - 1];
//                 console.log('Current EAR:', latest.ear.toFixed(3),
//                     'Blink count:', blinkCount);
//             }
//         }, 500);
//         return () => clearInterval(debugInterval);
//     }, [blinkCount]);
//     return (
//         <React.Fragment>
//             <BootstrapDialog
//                 open={open}
//                 aria-labelledby="customized-dialog-title"
//                 fullScreen
//             >
//                 <Components.DialogTitle sx={{ m: 0, p: 2, color: theme.palette.primary.text.main }} id="customized-dialog-title">
//                     {type === "login" ? "Login with Face" : "Register Face"}
//                 </Components.DialogTitle>

//                 <Components.IconButton
//                     aria-label="close"
//                     onClick={onClose}
//                     sx={(theme) => ({
//                         position: 'absolute',
//                         right: 8,
//                         top: 8,
//                         color: theme.palette.primary.icon,
//                     })}
//                 >
//                     <CustomIcons iconName={'fa-solid fa-xmark'} css='cursor-pointer text-black w-5 h-5' />
//                 </Components.IconButton>

//                 <Components.DialogContent dividers>
//                     <div className='flex justify-center items-center'>
//                         <div className="bg-white w-[300px] max-w-md flex flex-col gap-5 text-center">
//                             <div
//                                 id="webcamDisplay"
//                                 ref={webcamDisplayRef}
//                                 className={`video-container relative rounded-lg overflow-hidden bg-black h-[28rem] ${isPhotoAlreadyCaptured ? 'hidden' : ''}`}
//                             >
//                                 <video
//                                     id="webcamVideo"
//                                     ref={webcamVideoRef}
//                                     autoPlay
//                                     muted
//                                     playsInline
//                                     className="absolute top-0 left-0 w-full h-full object-cover"
//                                 />
//                                 <canvas
//                                     id="detectionCanvas"
//                                     ref={detectionCanvasRef}
//                                     className="absolute top-0 left-0 w-full h-full"
//                                 />
//                                 <div
//                                     className="face-frame absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 md:w-52 h-4/5 md:max-w-[25rem] max-h-[32rem] border-2 border-opacity-80 border-red-500 rounded-xl pointer-events-none z-10 transition-colors"
//                                     ref={faceFrameRef}
//                                 >
//                                     <div className="corner tl absolute top-[-2px] left-[-2px] w-5 h-5 border-4 border-blue-500 border-r-0 border-b-0 rounded-tl-lg"></div>
//                                     <div className="corner tr absolute top-[-2px] right-[-2px] w-5 h-5 border-4 border-blue-500 border-l-0 border-b-0 rounded-tr-lg"></div>
//                                     <div className="corner bl absolute bottom-[-2px] left-[-2px] w-5 h-5 border-4 border-blue-500 border-r-0 border-t-0 rounded-bl-lg"></div>
//                                     <div className="corner br absolute bottom-[-2px] right-[-2px] w-5 h-5 border-4 border-blue-500 border-l-0 border-t-0 rounded-br-lg"></div>
//                                 </div>
//                             </div>

//                             <div
//                                 id="capturedDisplay"
//                                 ref={capturedDisplayRef}
//                                 className={`captured-display relative rounded-lg overflow-hidden shadow h-[28rem] w-full max-w-[500px] mx-auto ${!isPhotoAlreadyCaptured ? 'hidden' : ''}`}
//                             >
//                                 <img
//                                     id="capturedPhoto"
//                                     ref={capturedPhotoRef}
//                                     alt="Captured Photo Preview"
//                                     className="w-full h-full object-cover rounded-lg"
//                                 />

//                                 <div className='absolute bottom-5 right-2 z-50 bg-white bg-opacity-90 rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform'>
//                                     <Components.IconButton
//                                         id="retakeIcon"
//                                         onClick={retakePhoto}
//                                     >
//                                         <CustomIcons iconName="fa-solid fa-rotate-left" css="text-blue-600 w-5 h-5" />
//                                     </Components.IconButton>
//                                 </div>
//                             </div>

//                             <canvas id="photoCanvas" ref={photoCanvasRef} className="hidden"></canvas>

//                             {/* Liveness progress indicator */}
//                             <div className="w-full bg-gray-200 rounded-full h-2.5">
//                                 <div
//                                     className="bg-blue-600 h-2.5 rounded-full"
//                                     style={{ width: `${livenessScore}%` }}
//                                 ></div>
//                             </div>
//                             <p className="text-sm text-gray-600">
//                                 Liveness verification: {livenessScore}% complete
//                             </p>

//                             {registerMessage.text && (
//                                 <p className={`message rounded-lg px-3 py-2 text-sm my-2 ${registerMessage.type === 'success' ? 'bg-green-100 text-green-800' :
//                                     registerMessage.type === 'error' ? 'bg-red-100 text-red-800' :
//                                         registerMessage.type === 'info' ? 'bg-blue-100 text-blue-800' :
//                                             'bg-yellow-100 text-yellow-800'
//                                     }`}>
//                                     {registerMessage.text}
//                                 </p>
//                             )}
//                         </div>

//                         <div className="blink-feedback">
//                             <p className="text-sm mb-2">
//                                 Blink Status:
//                                 <span className={`ml-2 font-bold ${blinkCount >= 2 ? 'text-green-600' : 'text-yellow-600'
//                                     }`}>
//                                     {blinkCount >= 2 ? 'Completed' : `${blinkCount}/2 blinks detected`}
//                                 </span>
//                             </p>
//                             <div className="relative h-4 bg-gray-200 rounded-full">
//                                 <div
//                                     className="absolute h-4 bg-blue-500 rounded-full transition-all duration-300"
//                                     style={{ width: `${Math.min(blinkCount * 50, 100)}%` }}
//                                 ></div>
//                             </div>
//                         </div>
//                     </div>
//                 </Components.DialogContent>

//                 <Components.DialogActions>
//                     <div className='flex justify-end'>
//                         <Button
//                             type={`button`}
//                             text={type === "login" ? "Login" : "Register Face"}
//                             isLoading={isLoading}
//                             onClick={() => registerUser()}
//                             disabled={!isPhotoAlreadyCaptured || livenessScore < 80}
//                         />
//                     </div>
//                 </Components.DialogActions>
//             </BootstrapDialog>
//         </React.Fragment>
//     );
// }

// const mapDispatchToProps = {
//     setAlert,
// };

// export default connect(null, mapDispatchToProps)(FaceRegistration);





import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { styled, useTheme } from '@mui/material/styles';
import Components from '../../muiComponents/components';
import Button from '../../common/buttons/button';
import { connect } from 'react-redux';
import { setAlert } from '../../../redux/commonReducers/commonReducers';
import CustomIcons from '../../common/icons/CustomIcons';
import { faceRecognitionAPIBaseURL, faceRecognitionModelURL } from '../../../config/apiConfig/apiConfig';
import { useNavigate } from 'react-router-dom';

const BootstrapDialog = styled(Components.Dialog)(({ theme }) => ({
    '& .MuiDialogContent-root': {
        padding: theme.spacing(2),
    },
    '& .MuiDialogActions-root': {
        padding: theme.spacing(1),
    },
}));

const API_BASE_URL = faceRecognitionAPIBaseURL;
const modelsPath = faceRecognitionModelURL;

function FaceRegistration({ setAlert, open, handleClose, employeeId, type = null, setLoginInfo }) {
    const theme = useTheme();
    const navigate = useNavigate();

    const onClose = () => {
        handleClose(); // Trigger parent to close modal
        stopWebcam(); // Ensure webcam is stopped
    };

    const faceAlignedRef = useRef(false);
    const countdownIntervalRef = useRef(null);
    const webcamVideoRef = useRef(null);
    const capturedPhotoRef = useRef(null);
    const photoCanvasRef = useRef(null);
    const detectionCanvasRef = useRef(null);
    const faceFrameRef = useRef(null);
    const webcamDisplayRef = useRef(null);
    const capturedDisplayRef = useRef(null);
    const countdownActiveRef = useRef(false);
    const faceDetectionIntervalRef = useRef(null);

    const [currentStream, setCurrentStream] = useState(null);
    const [capturedImageDataURL, setCapturedImageDataURL] = useState(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [isPhotoAlreadyCaptured, setIsPhotoAlreadyCaptured] = useState(false); // Manages visibility
    const [isLoading, setIsLoading] = useState(false);
    const [registerMessage, setRegisterMessage] = useState({ text: '', type: '' });

    const dataURLtoBlob = (dataurl) => {
        const arr = dataurl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n); // Corrected typo
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    };

    const showMessage = (setter, msg, type) => {
        setter({ text: msg, type });
    };

    const clearMessage = (setter) => {
        setter({ text: '', type: '' });
    };

    const loadModels = async () => {
        try {
            await faceapi.nets.tinyFaceDetector.load(modelsPath);
            setModelsLoaded(true);
            console.log('Face-API models loaded successfully.');
            // Initial message after models load, before webcam is fully ready
            showMessage(setRegisterMessage, 'Models loaded. Starting webcam...', 'info');
        } catch (error) {
            console.error('Failed to load face-api.js models:', error);
            showMessage(setRegisterMessage, 'Error loading face detection models. Please refresh.', 'error');
        }
    };

    const handlePlayVideo = async (videoElement) => {
        try {
            await videoElement.play();
        } catch (err) {
            console.log('Video play error:', err);
            videoElement.muted = true;
            try {
                await videoElement.play();
            } catch (err2) {
                console.log('Second video play attempt failed:', err2);
            }
        }
    };

    const detectFaces = async () => {
        if (isPhotoAlreadyCaptured) {
            console.log('detectFaces: Photo already captured, skipping detection cycle.');
            return;
        }

        if (!webcamVideoRef.current || webcamVideoRef.current.paused || webcamVideoRef.current.ended || !modelsLoaded) {
            console.log('detectFaces: Webcam or models not ready.');
            return;
        }

        try {
            const detection = await faceapi.detectSingleFace(
                webcamVideoRef.current,
                new faceapi.TinyFaceDetectorOptions()
            );

            if (!detection || detection.score < 0.6) {
                if (!isPhotoAlreadyCaptured) {
                    showMessage(setRegisterMessage, 'No face detected. Please stand in front of the camera.', 'info');
                }
                faceAlignedRef.current = false;
                if (faceFrameRef.current) {
                    faceFrameRef.current.style.borderColor = "#ef4444"; // Red
                    faceFrameRef.current.querySelectorAll('.corner').forEach(c => c.style.borderColor = "#ef4444");
                }
                if (countdownIntervalRef.current) {
                    clearInterval(countdownIntervalRef.current);
                    countdownIntervalRef.current = null;
                    countdownActiveRef.current = false;
                }
                return;
            }

            const displaySize = {
                width: webcamVideoRef.current.offsetWidth,
                height: webcamVideoRef.current.offsetHeight
            };
            const resizedDetection = faceapi.resizeResults(detection, displaySize);

            // Draw detection box
            if (detectionCanvasRef.current) {
                const ctx = detectionCanvasRef.current.getContext('2d');
                ctx.clearRect(0, 0, detectionCanvasRef.current.width, detectionCanvasRef.current.height);
                faceapi.draw.drawDetections(detectionCanvasRef.current, resizedDetection);
            }

            const faceBox = resizedDetection.box;
            const frameRect = faceFrameRef.current.getBoundingClientRect();
            const videoRect = webcamVideoRef.current.getBoundingClientRect();

            const frameX = frameRect.left - videoRect.left;
            const frameY = frameRect.top - videoRect.top;
            const frameWidth = frameRect.width;
            const frameHeight = frameRect.height;

            const scaleX = webcamVideoRef.current.videoWidth / webcamVideoRef.current.offsetWidth;
            const scaleY = webcamVideoRef.current.videoHeight / webcamVideoRef.current.offsetHeight;

            const scaledFaceBox = new faceapi.Rect(
                faceBox.x * scaleX,
                faceBox.y * scaleY,
                faceBox.width * scaleX,
                faceBox.height * scaleY
            );

            const scaledFrameX = frameX * scaleX;
            const scaledFrameY = frameY * scaleY;
            const scaledFrameWidth = frameWidth * scaleX;
            const scaledFrameHeight = frameHeight * scaleY;

            // Relaxed margin to allow easier face alignment (especially on phones)
            const relaxedMarginX = scaledFrameWidth * 0.05; // 5%
            const relaxedMarginY = scaledFrameHeight * 0.07; // 7%

            const isWithinFrame =
                scaledFaceBox.x + scaledFaceBox.width > scaledFrameX + relaxedMarginX &&
                scaledFaceBox.y + scaledFaceBox.height > scaledFrameY + relaxedMarginY &&
                scaledFaceBox.x < scaledFrameX + scaledFrameWidth - relaxedMarginX &&
                scaledFaceBox.y < scaledFrameY + scaledFrameHeight - relaxedMarginY;

            if (isWithinFrame) {
                faceAlignedRef.current = true;
                faceFrameRef.current.style.borderColor = "#22c55e"; // Green
                faceFrameRef.current.querySelectorAll('.corner').forEach(c => c.style.borderColor = "#22c55e");

                if (!isPhotoAlreadyCaptured && !countdownActiveRef.current) {
                    countdownActiveRef.current = true;
                    let countdown = 2;
                    countdownIntervalRef.current = setInterval(() => {
                        countdown--;
                        if (countdown > 0) {
                        } else {
                            clearInterval(countdownIntervalRef.current);
                            countdownIntervalRef.current = null;
                            countdownActiveRef.current = false;
                            capturePhoto();
                        }
                    }, 1000);
                }
            } else {
                faceAlignedRef.current = false;
                faceFrameRef.current.style.borderColor = "#ef4444"; // Red
                faceFrameRef.current.querySelectorAll('.corner').forEach(c => c.style.borderColor = "#ef4444");

                if (countdownIntervalRef.current) {
                    clearInterval(countdownIntervalRef.current);
                    countdownIntervalRef.current = null;
                    countdownActiveRef.current = false;
                    showMessage(setRegisterMessage, 'Face moved out of alignment. Please re-center.', 'warning');
                } else if (!isPhotoAlreadyCaptured) {
                    showMessage(setRegisterMessage, 'Please position your face within the frame.', 'info');
                }
            }

        } catch (err) {
            console.error('Face detection error:', err);
        }
    };

    const startWebcam = async () => {
        stopWebcam();
        clearMessage(setRegisterMessage);
        clearMessage(setRegisterMessage);
        setCapturedImageDataURL(null);
        setIsPhotoAlreadyCaptured(false); // Ensure this is false to restart detection
        countdownActiveRef.current = false;

        // --- VISIBILITY CONTROL ---
        if (webcamDisplayRef.current) webcamDisplayRef.current.classList.remove('hidden');
        if (capturedDisplayRef.current) capturedDisplayRef.current.classList.add('hidden');
        // Ensure detection elements are visible when webcam is active
        if (webcamVideoRef.current) webcamVideoRef.current.classList.remove('hidden');
        if (detectionCanvasRef.current) detectionCanvasRef.current.classList.remove('hidden');
        if (faceFrameRef.current) faceFrameRef.current.classList.remove('hidden');


        // Clean up previous stream if exists
        if (currentStream) {
            currentStream.getTracks().forEach(track => {
                track.stop();
            });
            setCurrentStream(null);
        }
        // Also clear any existing face detection interval
        if (faceDetectionIntervalRef.current) {
            clearInterval(faceDetectionIntervalRef.current);
            faceDetectionIntervalRef.current = null;
        }
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }


        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                }
            });
            setCurrentStream(stream);

            if (webcamVideoRef.current) {
                webcamVideoRef.current.srcObject = stream;
                showMessage(setRegisterMessage, 'Webcam started. Please position your face within the frame.', 'info'); // Simplified message

                webcamVideoRef.current.onloadedmetadata = async () => {
                    try {
                        await handlePlayVideo(webcamVideoRef.current);
                        // Optional: Add a small delay here if you still face issues with video frames not being ready
                        // await new Promise(resolve => setTimeout(resolve, 100));

                        const displaySize = {
                            width: webcamVideoRef.current.offsetWidth,
                            height: webcamVideoRef.current.offsetHeight
                        };
                        faceapi.matchDimensions(detectionCanvasRef.current, displaySize);
                        // The useEffect with dependencies will handle starting detection
                    } catch (err) {
                        console.error('onloadedmetadata: Error in handler:', err);
                        showMessage(setRegisterMessage, 'Error starting webcam. Please try again.', 'error');
                    }
                };
            }

        } catch (err) {
            console.error('startWebcam: Error accessing webcam:', err);
            showMessage(setRegisterMessage, 'Could not start webcam. Please check permissions.', 'error');
        }
    };

    const stopWebcam = () => {
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
            setCurrentStream(null);
        }

        if (faceDetectionIntervalRef.current) {
            clearInterval(faceDetectionIntervalRef.current);
            faceDetectionIntervalRef.current = null;
        }

        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }

        countdownActiveRef.current = false;
        faceAlignedRef.current = false;

        // Optional: Clear UI state if needed
        clearMessage(setRegisterMessage);
        clearMessage(setRegisterMessage);
        setCapturedImageDataURL(null);
        setIsPhotoAlreadyCaptured(false);
    };

    const capturePhoto = () => {

        if (!currentStream) {
            console.log('Capture failed: No current stream');
            showMessage(setRegisterMessage, 'Webcam not active.', 'error');
            return;
        }

        if (!faceAlignedRef.current) {
            console.log('Capture failed: Face not aligned at capture moment');
            showMessage(setRegisterMessage, 'Face moved out of alignment before capture. Please re-center.', 'warning');
            return;
        }

        try {
            const videoWidth = webcamVideoRef.current.videoWidth;
            const videoHeight = webcamVideoRef.current.videoHeight;
            const displayWidth = webcamVideoRef.current.offsetWidth;
            const displayHeight = webcamVideoRef.current.offsetHeight;

            const frameRect = faceFrameRef.current.getBoundingClientRect();
            const videoRect = webcamVideoRef.current.getBoundingClientRect();

            const frameX_display = frameRect.left - videoRect.left;
            const frameY_display = frameRect.top - videoRect.top;
            const frameWidth_display = frameRect.width;
            const frameHeight_display = frameRect.height;

            const scaleX = videoWidth / displayWidth;
            const scaleY = videoHeight / displayHeight;

            const paddingPercentage = 0.1;

            const sourceX = Math.max(0, (frameX_display * scaleX) - (frameWidth_display * scaleX * paddingPercentage));
            const sourceY = Math.max(0, (frameY_display * scaleY) - (frameHeight_display * scaleY * paddingPercentage));
            const sourceWidth = Math.min(videoWidth - sourceX, (frameWidth_display * scaleX) * (1 + paddingPercentage * 2));
            const sourceHeight = Math.min(videoHeight - sourceY, (frameHeight_display * scaleY) * (1 + paddingPercentage * 2));

            photoCanvasRef.current.width = sourceWidth;
            photoCanvasRef.current.height = sourceHeight;
            const context = photoCanvasRef.current.getContext('2d');

            context.drawImage(
                webcamVideoRef.current,
                sourceX, sourceY, sourceWidth, sourceHeight,
                0, 0, photoCanvasRef.current.width, photoCanvasRef.current.height
            );

            const dataURL = photoCanvasRef.current.toDataURL('image/jpeg', 0.9);
            setCapturedImageDataURL(dataURL);
            if (capturedPhotoRef.current) capturedPhotoRef.current.src = dataURL;

            // --- VISIBILITY CONTROL ---
            webcamDisplayRef.current?.classList.add('hidden'); // Hide webcam
            capturedDisplayRef.current?.classList.remove('hidden'); // Show captured photo

            setIsPhotoAlreadyCaptured(true); // This state change is key for stopping detection
            faceAlignedRef.current = false;

            // Ensure all intervals are stopped after capture
            if (faceDetectionIntervalRef.current) {
                clearInterval(faceDetectionIntervalRef.current);
                faceDetectionIntervalRef.current = null;
            }
            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
                countdownIntervalRef.current = null;
                console.log('capturePhoto: Stopped countdown interval.');
            }
            countdownActiveRef.current = false;

            showMessage(setRegisterMessage, 'Face captured successfully! You can now register.', 'success');
        } catch (err) {
            console.error('Error capturing photo:', err);
            showMessage(setRegisterMessage, 'Error capturing photo. Please try again.', 'error');
        }
    };

    const retakePhoto = () => {
        clearMessage(setRegisterMessage);
        clearMessage(setRegisterMessage);
        setCapturedImageDataURL(null);
        setIsPhotoAlreadyCaptured(false); // This state change is key for restarting detection
        countdownActiveRef.current = false;

        // --- VISIBILITY CONTROL ---
        capturedDisplayRef.current?.classList.add('hidden'); // Hide captured photo
        webcamDisplayRef.current?.classList.remove('hidden'); // Show webcam

        startWebcam(); // This will re-initialize the webcam and its state, triggering useEffect to restart detection
    };

    const registerUser = async () => {
        setIsLoading(true);
        clearMessage(setRegisterMessage);

        if (!capturedImageDataURL) {
            setIsLoading(false);
            showMessage(setRegisterMessage, 'No captured face detected. Please retake or capture a new face.', 'error');
            return;
        }

        const imageBlob = dataURLtoBlob(capturedImageDataURL);
        const formData = new FormData();

        const isLogin = type === "login";
        const fieldName = isLogin ? "file" : "image";
        const fileName = isLogin ? "login.jpg" : "register.jpg";
        const apiEndpoint = isLogin ? "/login" : "/register";

        formData.append('employeeId', employeeId);
        formData.append(fieldName, imageBlob, fileName);

        try {
            const response = await fetch(`${API_BASE_URL}${apiEndpoint}`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            if (response.ok) {
                setIsLoading(false);
                if (!isLogin) {
                    setAlert({
                        open:true,
                        type: 'success',
                        message: 'Face registered successfully!'
                    });
                    navigate('/dashboard/manageemployees');
                } else {
                    setLoginInfo(data);
                }
                onClose();
            } else {
                setIsLoading(false);
                setAlert({
                    open:true,
                    type: 'error',
                    message: `${isLogin ? 'Login' : 'Registration'} failed: ${data.detail || 'Unknown error.'}`
                });
            }
        } catch (error) {
            setIsLoading(false);
            setAlert({
                type: 'error',
                message: `${isLogin ? 'Login' : 'Registration'} failed due to network or server error.`
            });
        }
    };

    useEffect(() => {
        if (modelsLoaded && currentStream && webcamVideoRef.current && !isPhotoAlreadyCaptured) {
            // Clear any existing interval before setting a new one
            if (faceDetectionIntervalRef.current) {
                clearInterval(faceDetectionIntervalRef.current);
            }
            faceDetectionIntervalRef.current = setInterval(detectFaces, 150);
        } else {
            // Stop detection if conditions are not met (e.g., photo captured, stream stopped)
            if (faceDetectionIntervalRef.current) {
                clearInterval(faceDetectionIntervalRef.current);
                faceDetectionIntervalRef.current = null;
            }
            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
                countdownIntervalRef.current = null;
                countdownActiveRef.current = false;
            }
            // This is important: if detection stops because a photo was captured, reset faceAlignedRef
            if (isPhotoAlreadyCaptured) {
                faceAlignedRef.current = false;
            }
        }

        // Cleanup for this specific effect
        return () => {
            if (faceDetectionIntervalRef.current) {
                clearInterval(faceDetectionIntervalRef.current);
                faceDetectionIntervalRef.current = null;
            }
            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
                countdownIntervalRef.current = null;
            }
            countdownActiveRef.current = false;
        };
    }, [modelsLoaded, currentStream, isPhotoAlreadyCaptured]);

    useEffect(() => {
        if (open) {
            loadModels().then(startWebcam);
        } else {
            stopWebcam();
        }
    }, [open]);

    return (
        <React.Fragment>
            <BootstrapDialog
                open={open}
                // onClose={onClose}
                aria-labelledby="customized-dialog-title"
                fullScreen
            >
                <Components.DialogTitle sx={{ m: 0, p: 2, color: theme.palette.primary.text.main }} id="customized-dialog-title">
                    {
                        type === "login" ? "Login with Face" : "Register Face"
                    }
                </Components.DialogTitle>

                <Components.IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={(theme) => ({
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: theme.palette.primary.icon,
                    })}
                >
                    <CustomIcons iconName={'fa-solid fa-xmark'} css='cursor-pointer text-black w-5 h-5' />
                </Components.IconButton>


                <Components.DialogContent dividers>
                    <div className='flex justify-center items-center'>
                        <div className="bg-white w-[300px] max-w-md flex flex-col gap-5 text-center">
                            <div
                                id="webcamDisplay"
                                ref={webcamDisplayRef}
                                className={`video-container relative rounded-lg overflow-hidden bg-black h-[28rem] ${isPhotoAlreadyCaptured ? 'hidden' : ''}`}
                            >
                                <video
                                    id="webcamVideo"
                                    ref={webcamVideoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    className="absolute top-0 left-0 w-full h-full object-cover"
                                />
                                <canvas
                                    id="detectionCanvas"
                                    ref={detectionCanvasRef}
                                    className="absolute top-0 left-0 w-full h-full"
                                />
                                <div
                                    className="face-frame absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 md:w-52 h-4/5 md:max-w-[25rem] max-h-[32rem] border-2 border-opacity-80 border-red-500 rounded-xl pointer-events-none z-10 transition-colors"
                                    ref={faceFrameRef}
                                >
                                    <div className="corner tl absolute top-[-2px] left-[-2px] w-5 h-5 border-4 border-blue-500 border-r-0 border-b-0 rounded-tl-lg"></div>
                                    <div className="corner tr absolute top-[-2px] right-[-2px] w-5 h-5 border-4 border-blue-500 border-l-0 border-b-0 rounded-tr-lg"></div>
                                    <div className="corner bl absolute bottom-[-2px] left-[-2px] w-5 h-5 border-4 border-blue-500 border-r-0 border-t-0 rounded-bl-lg"></div>
                                    <div className="corner br absolute bottom-[-2px] right-[-2px] w-5 h-5 border-4 border-blue-500 border-l-0 border-t-0 rounded-br-lg"></div>
                                </div>
                            </div>

                            <div
                                id="capturedDisplay"
                                ref={capturedDisplayRef}
                                className={`captured-display relative rounded-lg overflow-hidden shadow h-[28rem] w-full max-w-[500px] mx-auto ${!isPhotoAlreadyCaptured ? 'hidden' : ''
                                    }`}
                            >
                                <img
                                    id="capturedPhoto"
                                    ref={capturedPhotoRef}
                                    alt="Captured Preview"
                                    className=" w-full h-full object-cover rounded-lg"
                                />

                                {/* Retake Button Overlay */}
                                <div className='absolute bottom-5 right-2 z-50 bg-white bg-opacity-90 rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform'>
                                    <Components.IconButton
                                        id="retakeIcon"
                                        onClick={retakePhoto}
                                    >
                                        <CustomIcons iconName="fa-solid fa-rotate-left" css="text-blue-600 w-5 h-5" />
                                    </Components.IconButton>
                                </div>
                            </div>


                            <canvas id="photoCanvas" ref={photoCanvasRef} className="hidden"></canvas>
                            {registerMessage.text && (
                                <p className={`message rounded-lg px-3 py-2 text-sm my-2 ${registerMessage.type === 'success' ? 'bg-green-100 text-green-800' :
                                    registerMessage.type === 'error' ? 'bg-red-100 text-red-800' :
                                        registerMessage.type === 'info' ? 'bg-blue-100 text-blue-800' :
                                            'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {registerMessage.text}
                                </p>
                            )}
                        </div>
                    </div>
                </Components.DialogContent>

                <Components.DialogActions>
                    <div className='flex justify-end'>
                        <Button type={`button`} text={type === "login" ? "Login" : "Register Face"} isLoading={isLoading} onClick={() => registerUser()} />
                    </div>
                </Components.DialogActions>
            </BootstrapDialog>
        </React.Fragment>
    );
}

const mapDispatchToProps = {
    setAlert,
};

export default connect(null, mapDispatchToProps)(FaceRegistration);
