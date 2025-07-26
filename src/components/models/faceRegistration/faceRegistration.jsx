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
        handleClose();
        stopWebcam();
    };

    // Refs
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
    const prevFrameRef = useRef(null);
    const blinkHistoryRef = useRef([]);
    const blinkStateRef = useRef('open'); // Add this for reliable blink state

    // State
    const [currentStream, setCurrentStream] = useState(null);
    const [capturedImageDataURL, setCapturedImageDataURL] = useState(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [isPhotoAlreadyCaptured, setIsPhotoAlreadyCaptured] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [registerMessage, setRegisterMessage] = useState({ text: '', type: '' });
    const [blinkCount, setBlinkCount] = useState(0);
    const [motionDetected, setMotionDetected] = useState(false); // Can keep this if you want to display motion status
    const [livenessScore, setLivenessScore] = useState(0);

    // Helper functions
    const dataURLtoBlob = (dataurl) => {
        const arr = dataurl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
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

    // *** MOVED frameDiff definition BEFORE detectMotion ***
    const frameDiff = (frame1, frame2) => {
        let diff = 0;
        for (let i = 0; i < frame1.data.length; i += 4) {
            diff += Math.abs(frame1.data[i] - frame2.data[i]) / 255;
            diff += Math.abs(frame1.data[i + 1] - frame2.data[i + 1]) / 255;
            diff += Math.abs(frame1.data[i + 2] - frame2.data[i + 2]) / 255;
        }
        return diff / (frame1.data.length / 4 * 3);
    };

    // Load face-api.js models
    const loadModels = async () => {
        try {
            await Promise.all([
                faceapi.nets.tinyFaceDetector.load(modelsPath),
                faceapi.nets.faceLandmark68Net.load(modelsPath)
            ]);
            setModelsLoaded(true);
            showMessage(setRegisterMessage, 'Models loaded. Please position your face and follow the instructions.', 'info');
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
        // Early exit conditions
        if (isPhotoAlreadyCaptured || !webcamVideoRef.current ||
            webcamVideoRef.current.paused || webcamVideoRef.current.ended ||
            !modelsLoaded) {
            return;
        }

        try {
            // 1. Perform face detection with enhanced options
            const detection = await faceapi.detectSingleFace(
                webcamVideoRef.current,
                new faceapi.TinyFaceDetectorOptions({
                    inputSize: 512,
                    scoreThreshold: 0.55,
                })
            ).withFaceLandmarks();

            // 2. Prepare display dimensions
            const displaySize = {
                width: webcamVideoRef.current.offsetWidth,
                height: webcamVideoRef.current.offsetHeight
            };
            const resizedDetection = faceapi.resizeResults(detection, displaySize);

            // Check alignment first
            let isWithinFrame = false;
            if (resizedDetection.detection) {
                const faceBox = resizedDetection.detection.box;
                if (faceBox) {
                    const alignmentCheckResult = checkFaceAlignment(
                        faceBox,
                        webcamVideoRef.current,
                        faceFrameRef.current
                    );
                    isWithinFrame = alignmentCheckResult.isWithinFrame;
                }
            }

            // IMPORTANT: If face is not detected or not within frame, reset state and return
            if (!detection || !detection.detection || detection.detection.score < 0.5 || !isWithinFrame) {
                if (!isPhotoAlreadyCaptured) {
                    showMessage(setRegisterMessage, 'Position your face in the center', 'info');
                }
                updateFrameUI(false); // Update UI to red
                resetDetectionState(); // This will now also reset blinkCount and livenessScore
                return; // Exit early if conditions are not met
            }

            // If we reach here, a face is detected and aligned.
            // Update UI to green
            updateFrameUI(true);
            if (!isPhotoAlreadyCaptured) {
                // Only update message if photo is not captured yet
                if (blinkCount < 2) {
                    showMessage(setRegisterMessage, `Face detected! Now, please blink your eyes twice. (${blinkCount}/2)`, 'info');
                } else {
                    showMessage(setRegisterMessage, 'Face detected and liveness criteria met. Ready to capture!', 'success');
                }
            }


            // 4. Draw detection and landmarks with validation
            if (detectionCanvasRef.current) {
                const ctx = detectionCanvasRef.current.getContext('2d');
                ctx.clearRect(0, 0, detectionCanvasRef.current.width, detectionCanvasRef.current.height);

                if (resizedDetection.detection) {
                    faceapi.draw.drawDetections(detectionCanvasRef.current, resizedDetection);
                }
                if (resizedDetection.landmarks) {
                    faceapi.draw.drawFaceLandmarks(detectionCanvasRef.current, resizedDetection);
                }
            }

            // 5. Enhanced blink detection with temporal analysis
            if (detection.landmarks) {
                const blinkResult = await detectBlinksEnhanced(detection.landmarks);
                // In detectFaces function, replace the blink count handling with:
                if (blinkResult.didBlink) {
                    setBlinkCount(prev => {
                        // Cap at 2 blinks - no more counting after that
                        if (prev >= 2) return prev;

                        const newCount = prev + 1;
                        if (newCount > prev) {
                            setLivenessScore(Math.floor((newCount / 2) * 100));
                            showVisualFeedback('#3b82f6');
                            showMessage(
                                setRegisterMessage,
                                `Blink detected! (${newCount}/2)`,
                                'success'
                            );
                        }
                        return newCount;
                    });
                }

                console.log('Blink Analysis:', {
                    ...blinkResult.debugInfo,
                    currentBlinks: blinkCount,
                    livenessScore: livenessScore
                });
            }

            if (isWithinFrame && blinkCount >= 2 && livenessScore >= 100) {
                if (!countdownActiveRef.current) {
                    startCountdown();
                }
            } else {
                cancelCountdown();
                // If conditions are not met, ensure message prompts user for action
                if (!isPhotoAlreadyCaptured) {
                    if (!isWithinFrame) {
                        showMessage(setRegisterMessage, 'Position your face in the center', 'info');
                    } else if (blinkCount < 2) {
                        showMessage(setRegisterMessage, `Please blink your eyes twice. (${blinkCount}/2)`, 'info');
                    }
                }
            }

        } catch (err) {
            console.error('Face detection error:', err);
            showMessage(setRegisterMessage, 'Detection error. Please try again.', 'error');
            resetDetectionState(); // Reset on error
        }
    };

    const detectBlinksEnhanced = async (landmarks) => {
        const result = {
            didBlink: false,
            debugInfo: {
                leftEAR: 0,
                rightEAR: 0,
                avgEAR: 0,
                minEAR: 0,
                maxEAR: 0,
                history: [],
                state: 'open',
                consecutiveClosed: 0,
                consecutiveOpen: 0,
                baselineOpenEAR: 0,
                dynamicThreshold: 0
            }
        };

        try {
            // 1. Get eye landmarks
            const leftEye = landmarks.getLeftEye();
            const rightEye = landmarks.getRightEye();

            if (!leftEye || !rightEye || leftEye.length < 6 || rightEye.length < 6) {
                result.debugInfo.state = 'invalid landmarks';
                return result;
            }

            // 2. Calculate Eye Aspect Ratio (EAR) for both eyes
            const calculateEAR = (eye) => {
                try {
                    // Vertical distances
                    const A = Math.hypot(eye[1].x - eye[5].x, eye[1].y - eye[5].y);
                    const B = Math.hypot(eye[2].x - eye[4].x, eye[2].y - eye[4].y);

                    // Horizontal distance
                    const C = Math.hypot(eye[0].x - eye[3].x, eye[0].y - eye[3].y);

                    return C > 0 ? (A + B) / (2 * C) : 0;
                } catch (e) {
                    console.error('EAR calculation error:', e);
                    return 0;
                }
            };

            const leftEAR = calculateEAR(leftEye);
            const rightEAR = calculateEAR(rightEye);
            let avgEAR = (leftEAR + rightEAR) / 2;

            // 3. Update blink history and calculate baseline
            const now = Date.now();
            blinkHistoryRef.current.push({
                ear: avgEAR,
                timestamp: now
            });

            // Keep only the last 1.5 seconds of data
            blinkHistoryRef.current = blinkHistoryRef.current.filter(
                entry => now - entry.timestamp < 1500
            );

            // Calculate baseline EAR when eyes are open (using 75th percentile)
            const sortedEars = blinkHistoryRef.current.map(e => e.ear).sort();
            const baselineOpenEAR = sortedEars.length > 0 ?
                sortedEars[Math.floor(sortedEars.length * 0.75)] : 0.3;

            // 4. Dynamic thresholds based on user's baseline
            const EAR_OPEN_THRESHOLD = baselineOpenEAR * 0.85;  // 85% of baseline
            const EAR_CLOSED_THRESHOLD = baselineOpenEAR * 0.55; // 55% of baseline
            const EAR_PARTIAL_THRESHOLD = baselineOpenEAR * 0.7; // For partial blinks

            // 5. State machine for blink detection
            if (avgEAR < EAR_CLOSED_THRESHOLD) {
                // Eyes are firmly closed
                result.debugInfo.consecutiveClosed++;
                result.debugInfo.consecutiveOpen = 0;

                if (blinkStateRef.current === 'open') {
                    blinkStateRef.current = 'closing';
                } else if (blinkStateRef.current === 'closing' &&
                    result.debugInfo.consecutiveClosed >= 2) {
                    blinkStateRef.current = 'closed';
                }
            }
            else if (avgEAR < EAR_PARTIAL_THRESHOLD) {
                // Eyes are partially closed (transition state)
                if (blinkStateRef.current === 'open') {
                    blinkStateRef.current = 'partial';
                }
            }
            else if (avgEAR >= EAR_OPEN_THRESHOLD) {
                // Eyes are open
                result.debugInfo.consecutiveOpen++;

                if (blinkStateRef.current === 'closed' &&
                    result.debugInfo.consecutiveOpen >= 3) {
                    // Only register blink after eyes have been open for 3+ frames
                    blinkStateRef.current = 'open';
                    result.didBlink = true;
                } else if (blinkStateRef.current === 'partial') {
                    // Didn't close enough to count as full blink
                    blinkStateRef.current = 'open';
                }
            }

            // 6. Update debug info
            result.debugInfo = {
                leftEAR: parseFloat(leftEAR.toFixed(3)),
                rightEAR: parseFloat(rightEAR.toFixed(3)),
                avgEAR: parseFloat(avgEAR.toFixed(3)),
                minEAR: sortedEars.length > 0 ? parseFloat(Math.min(...sortedEars).toFixed(3)) : 0,
                maxEAR: sortedEars.length > 0 ? parseFloat(Math.max(...sortedEars).toFixed(3)) : 0,
                history: blinkHistoryRef.current.slice(-5).map(e => parseFloat(e.ear.toFixed(3))),
                state: blinkStateRef.current,
                consecutiveClosed: result.debugInfo.consecutiveClosed,
                consecutiveOpen: result.debugInfo.consecutiveOpen,
                baselineOpenEAR: parseFloat(baselineOpenEAR.toFixed(3)),
                dynamicThreshold: {
                    open: parseFloat(EAR_OPEN_THRESHOLD.toFixed(3)),
                    closed: parseFloat(EAR_CLOSED_THRESHOLD.toFixed(3)),
                    partial: parseFloat(EAR_PARTIAL_THRESHOLD.toFixed(3))
                },
                frames: blinkHistoryRef.current.length
            };

            // 7. Visual feedback
            if (avgEAR < EAR_CLOSED_THRESHOLD) {
                showVisualFeedback('#ef4444'); // Red when fully closed
            } else if (avgEAR < EAR_PARTIAL_THRESHOLD) {
                showVisualFeedback('#f59e0b'); // Orange when partially closed
            }

        } catch (error) {
            console.error('Blink detection error:', error);
            result.debugInfo.error = error.message;
        }

        return result;
    };

    // Face alignment verification
    const checkFaceAlignment = (faceBox, videoElement, frameElement) => {
        const videoRect = videoElement.getBoundingClientRect();
        const frameRect = frameElement.getBoundingClientRect();

        const scaleX = videoElement.videoWidth / videoElement.offsetWidth;
        const scaleY = videoElement.videoHeight / videoElement.offsetHeight;

        const scaledFaceBox = {
            x: faceBox.x * scaleX,
            y: faceBox.y * scaleY,
            width: faceBox.width * scaleX,
            height: faceBox.height * scaleY
        };

        const scaledFrame = {
            x: (frameRect.left - videoRect.left) * scaleX,
            y: (frameRect.top - videoRect.top) * scaleY,
            width: frameRect.width * scaleX,
            height: frameRect.height * scaleY
        };

        // 10% margin on all sides
        const marginX = scaledFrame.width * 0.10;
        const marginY = scaledFrame.height * 0.10;

        const isWithinFrame =
            scaledFaceBox.x + scaledFaceBox.width > scaledFrame.x + marginX &&
            scaledFaceBox.y + scaledFaceBox.height > scaledFrame.y + marginY &&
            scaledFaceBox.x < scaledFrame.x + scaledFrame.width - marginX &&
            scaledFaceBox.y < scaledFrame.y + scaledFrame.height - marginY;

        return { isWithinFrame, scaledFaceBox };
    };

    // UI Updates
    const updateFrameUI = (isAligned) => {
        faceAlignedRef.current = isAligned;
        if (faceFrameRef.current) {
            const color = isAligned ? "#22c55e" : "#ef4444";
            faceFrameRef.current.style.borderColor = color;
            faceFrameRef.current.querySelectorAll('.corner').forEach(c => {
                c.style.borderColor = color;
            });
        }
    };

    const showVisualFeedback = (color) => {
        if (faceFrameRef.current) {
            faceFrameRef.current.style.borderColor = color;
            setTimeout(() => {
                if (faceFrameRef.current) {
                    faceFrameRef.current.style.borderColor =
                        faceAlignedRef.current ? "#22c55e" : "#ef4444";
                }
            }, 300);
        }
    };

    const cancelCountdown = () => {
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
            countdownActiveRef.current = false;
        }
    };

    // Helper functions used in detectFaces
    const resetDetectionState = () => {
        faceAlignedRef.current = false;
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
            countdownActiveRef.current = false;
        }
        // NEW: Reset blink count and liveness score if face is not aligned
        setBlinkCount(0);
        setLivenessScore(0);
        blinkHistoryRef.current = []; // Clear blink history
        blinkStateRef.current = 'open'; // Reset the blink state machine
    };

    const startCountdown = () => {
        countdownActiveRef.current = true;
        let countdown = 2;

        // showMessage(setRegisterMessage, 'Perfect! Capturing in 2 seconds...', 'success');

        countdownIntervalRef.current = setInterval(() => {
            countdown--;

            if (countdown > 0) {
                // showMessage(setRegisterMessage, `Capturing in ${countdown}...`, 'success');
            } else {
                clearInterval(countdownIntervalRef.current);
                countdownIntervalRef.current = null;
                countdownActiveRef.current = false;
                capturePhoto();
            }
        }, 1000);
    };

    const startWebcam = async () => {
        stopWebcam();
        clearMessage(setRegisterMessage);
        setCapturedImageDataURL(null);
        setIsPhotoAlreadyCaptured(false);
        countdownActiveRef.current = false;
        setBlinkCount(0);
        setMotionDetected(false);
        setLivenessScore(0);
        blinkHistoryRef.current = [];
        blinkStateRef.current = 'open'; // Reset blink state here

        if (webcamDisplayRef.current) webcamDisplayRef.current.classList.remove('hidden');
        if (capturedDisplayRef.current) capturedDisplayRef.current.classList.add('hidden');
        if (webcamVideoRef.current) webcamVideoRef.current.classList.remove('hidden');
        if (detectionCanvasRef.current) detectionCanvasRef.current.classList.remove('hidden');
        if (faceFrameRef.current) faceFrameRef.current.classList.remove('hidden');

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
                showMessage(setRegisterMessage, 'Webcam started. Please position your face within the frame.', 'info');

                webcamVideoRef.current.onloadedmetadata = async () => {
                    try {
                        await handlePlayVideo(webcamVideoRef.current);
                        const displaySize = {
                            width: webcamVideoRef.current.offsetWidth,
                            height: webcamVideoRef.current.offsetHeight
                        };
                        faceapi.matchDimensions(detectionCanvasRef.current, displaySize);
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
        clearMessage(setRegisterMessage);
        setCapturedImageDataURL(null);
        setIsPhotoAlreadyCaptured(false);
    };

    // Photo capture
    const capturePhoto = () => {
        if (!currentStream) {
            showMessage(setRegisterMessage, 'Webcam not active.', 'error');
            return;
        }

        // Now, require exactly 2 blinks and 100% liveness score (which comes from 2 blinks)
        if (blinkCount < 2 || livenessScore < 100) {
            showMessage(setRegisterMessage, 'Liveness verification failed. Please ensure you blinked twice.', 'error');
            retakePhoto();
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

            // Removed: Additional liveness check with texture analysis from affecting livenessScore
            // const imageData = context.getImageData(0, 0, photoCanvasRef.current.width, photoCanvasRef.current.height);
            // const textureScore = analyzeTexture(imageData);
            // setLivenessScore(prev => Math.min(prev + textureScore, 100)); // This line is removed

            const dataURL = photoCanvasRef.current.toDataURL('image/jpeg', 0.9);
            setCapturedImageDataURL(dataURL);
            if (capturedPhotoRef.current) capturedPhotoRef.current.src = dataURL;

            webcamDisplayRef.current?.classList.add('hidden');
            capturedDisplayRef.current?.classList.remove('hidden');

            setIsPhotoAlreadyCaptured(true);
            faceAlignedRef.current = false;

            if (faceDetectionIntervalRef.current) {
                clearInterval(faceDetectionIntervalRef.current);
                faceDetectionIntervalRef.current = null;
            }

            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
                countdownIntervalRef.current = null;
            }

            countdownActiveRef.current = false;
            showMessage(setRegisterMessage, 'Face captured successfully! You can now register.', 'success');
        } catch (err) {
            console.error('Error capturing photo:', err);
            showMessage(setRegisterMessage, 'Error capturing photo. Please try again.', 'error');
            retakePhoto();
        }
    };

    const retakePhoto = () => {
        clearMessage(setRegisterMessage);
        setCapturedImageDataURL(null);
        setIsPhotoAlreadyCaptured(false);
        countdownActiveRef.current = false;
        setBlinkCount(0);
        setMotionDetected(false);
        setLivenessScore(0);
        blinkHistoryRef.current = [];
        blinkStateRef.current = 'open'; // Reset blink state here

        capturedDisplayRef.current?.classList.add('hidden');
        webcamDisplayRef.current?.classList.remove('hidden');

        startWebcam();
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
        formData.append('livenessScore', livenessScore.toString());
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
                        open: true,
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
                    open: true,
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
            if (faceDetectionIntervalRef.current) {
                clearInterval(faceDetectionIntervalRef.current);
            }
            faceDetectionIntervalRef.current = setInterval(detectFaces, 150);
        } else {
            if (faceDetectionIntervalRef.current) {
                clearInterval(faceDetectionIntervalRef.current);
                faceDetectionIntervalRef.current = null;
            }
            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
                countdownIntervalRef.current = null;
                countdownActiveRef.current = false;
            }
            if (isPhotoAlreadyCaptured) {
                faceAlignedRef.current = false;
            }
        }
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

    useEffect(() => {
        const debugInterval = setInterval(() => {
            if (blinkHistoryRef.current.length > 0) {
                const latest = blinkHistoryRef.current[blinkHistoryRef.current.length - 1];
                // console.log('Current EAR:', latest.ear.toFixed(3),
                //     'Blink count:', blinkCount);
            }
        }, 500);
        return () => clearInterval(debugInterval);
    }, [blinkCount]);

    return (
        <React.Fragment>
            <BootstrapDialog
                open={open}
                aria-labelledby="customized-dialog-title"
                fullScreen
            >
                <Components.DialogTitle sx={{ m: 0, p: 2, color: theme.palette.primary.text.main }} id="customized-dialog-title">
                    {type === "login" ? "Login with Face" : "Register Face"}
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
                                className={`captured-display relative rounded-lg overflow-hidden shadow h-[28rem] w-full max-w-[500px] mx-auto ${!isPhotoAlreadyCaptured ? 'hidden' : ''}`}
                            >
                                <img
                                    id="capturedPhoto"
                                    ref={capturedPhotoRef}
                                    alt="Captured Photo Preview"
                                    className="w-full h-full object-cover rounded-lg"
                                />

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

                            {/* Liveness progress indicator */}
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                    className="bg-blue-600 h-2.5 rounded-full"
                                    style={{ width: `${livenessScore}%` }}
                                ></div>
                            </div>
                            <p className="text-sm text-gray-600">
                                Liveness verification: {livenessScore}% complete
                            </p>

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
                        <Button
                            type={`button`}
                            text={type === "login" ? "Login" : "Register Face"}
                            isLoading={isLoading}
                            onClick={() => registerUser()}
                            disabled={!isPhotoAlreadyCaptured || livenessScore < 80}
                        />
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
//         handleClose(); // Trigger parent to close modal
//         stopWebcam(); // Ensure webcam is stopped
//     };

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

//     const [currentStream, setCurrentStream] = useState(null);
//     const [capturedImageDataURL, setCapturedImageDataURL] = useState(null);
//     const [modelsLoaded, setModelsLoaded] = useState(false);
//     const [isPhotoAlreadyCaptured, setIsPhotoAlreadyCaptured] = useState(false); // Manages visibility
//     const [isLoading, setIsLoading] = useState(false);
//     const [registerMessage, setRegisterMessage] = useState({ text: '', type: '' });

//     const dataURLtoBlob = (dataurl) => {
//         const arr = dataurl.split(',');
//         const mime = arr[0].match(/:(.*?);/)[1];
//         const bstr = atob(arr[1]);
//         let n = bstr.length;
//         const u8arr = new Uint8Array(n); // Corrected typo
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

//     const loadModels = async () => {
//         try {
//             await faceapi.nets.tinyFaceDetector.load(modelsPath);
//             setModelsLoaded(true);
//             console.log('Face-API models loaded successfully.');
//             // Initial message after models load, before webcam is fully ready
//             showMessage(setRegisterMessage, 'Models loaded. Starting webcam...', 'info');
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
//         if (isPhotoAlreadyCaptured) {
//             console.log('detectFaces: Photo already captured, skipping detection cycle.');
//             return;
//         }

//         if (!webcamVideoRef.current || webcamVideoRef.current.paused || webcamVideoRef.current.ended || !modelsLoaded) {
//             console.log('detectFaces: Webcam or models not ready.');
//             return;
//         }

//         try {
//             const detection = await faceapi.detectSingleFace(
//                 webcamVideoRef.current,
//                 new faceapi.TinyFaceDetectorOptions()
//             );

//             if (!detection || detection.score < 0.6) {
//                 if (!isPhotoAlreadyCaptured) {
//                     showMessage(setRegisterMessage, 'No face detected. Please stand in front of the camera.', 'info');
//                 }
//                 faceAlignedRef.current = false;
//                 if (faceFrameRef.current) {
//                     faceFrameRef.current.style.borderColor = "#ef4444"; // Red
//                     faceFrameRef.current.querySelectorAll('.corner').forEach(c => c.style.borderColor = "#ef4444");
//                 }
//                 if (countdownIntervalRef.current) {
//                     clearInterval(countdownIntervalRef.current);
//                     countdownIntervalRef.current = null;
//                     countdownActiveRef.current = false;
//                 }
//                 return;
//             }

//             const displaySize = {
//                 width: webcamVideoRef.current.offsetWidth,
//                 height: webcamVideoRef.current.offsetHeight
//             };
//             const resizedDetection = faceapi.resizeResults(detection, displaySize);

//             // Draw detection box
//             if (detectionCanvasRef.current) {
//                 const ctx = detectionCanvasRef.current.getContext('2d');
//                 ctx.clearRect(0, 0, detectionCanvasRef.current.width, detectionCanvasRef.current.height);
//                 faceapi.draw.drawDetections(detectionCanvasRef.current, resizedDetection);
//             }

//             const faceBox = resizedDetection.box;
//             const frameRect = faceFrameRef.current.getBoundingClientRect();
//             const videoRect = webcamVideoRef.current.getBoundingClientRect();

//             const frameX = frameRect.left - videoRect.left;
//             const frameY = frameRect.top - videoRect.top;
//             const frameWidth = frameRect.width;
//             const frameHeight = frameRect.height;

//             const scaleX = webcamVideoRef.current.videoWidth / webcamVideoRef.current.offsetWidth;
//             const scaleY = webcamVideoRef.current.videoHeight / webcamVideoRef.current.offsetHeight;

//             const scaledFaceBox = new faceapi.Rect(
//                 faceBox.x * scaleX,
//                 faceBox.y * scaleY,
//                 faceBox.width * scaleX,
//                 faceBox.height * scaleY
//             );

//             const scaledFrameX = frameX * scaleX;
//             const scaledFrameY = frameY * scaleY;
//             const scaledFrameWidth = frameWidth * scaleX;
//             const scaledFrameHeight = frameHeight * scaleY;

//             // Relaxed margin to allow easier face alignment (especially on phones)
//             const relaxedMarginX = scaledFrameWidth * 0.05; // 5%
//             const relaxedMarginY = scaledFrameHeight * 0.07; // 7%

//             const isWithinFrame =
//                 scaledFaceBox.x + scaledFaceBox.width > scaledFrameX + relaxedMarginX &&
//                 scaledFaceBox.y + scaledFaceBox.height > scaledFrameY + relaxedMarginY &&
//                 scaledFaceBox.x < scaledFrameX + scaledFrameWidth - relaxedMarginX &&
//                 scaledFaceBox.y < scaledFrameY + scaledFrameHeight - relaxedMarginY;

//             if (isWithinFrame) {
//                 faceAlignedRef.current = true;
//                 faceFrameRef.current.style.borderColor = "#22c55e"; // Green
//                 faceFrameRef.current.querySelectorAll('.corner').forEach(c => c.style.borderColor = "#22c55e");

//                 if (!isPhotoAlreadyCaptured && !countdownActiveRef.current) {
//                     countdownActiveRef.current = true;
//                     let countdown = 2;
//                     countdownIntervalRef.current = setInterval(() => {
//                         countdown--;
//                         if (countdown > 0) {
//                         } else {
//                             clearInterval(countdownIntervalRef.current);
//                             countdownIntervalRef.current = null;
//                             countdownActiveRef.current = false;
//                             capturePhoto();
//                         }
//                     }, 1000);
//                 }
//             } else {
//                 faceAlignedRef.current = false;
//                 faceFrameRef.current.style.borderColor = "#ef4444"; // Red
//                 faceFrameRef.current.querySelectorAll('.corner').forEach(c => c.style.borderColor = "#ef4444");

//                 if (countdownIntervalRef.current) {
//                     clearInterval(countdownIntervalRef.current);
//                     countdownIntervalRef.current = null;
//                     countdownActiveRef.current = false;
//                     showMessage(setRegisterMessage, 'Face moved out of alignment. Please re-center.', 'warning');
//                 } else if (!isPhotoAlreadyCaptured) {
//                     showMessage(setRegisterMessage, 'Please position your face within the frame.', 'info');
//                 }
//             }

//         } catch (err) {
//             console.error('Face detection error:', err);
//         }
//     };

//     const startWebcam = async () => {
//         stopWebcam();
//         clearMessage(setRegisterMessage);
//         clearMessage(setRegisterMessage);
//         setCapturedImageDataURL(null);
//         setIsPhotoAlreadyCaptured(false); // Ensure this is false to restart detection
//         countdownActiveRef.current = false;

//         // --- VISIBILITY CONTROL ---
//         if (webcamDisplayRef.current) webcamDisplayRef.current.classList.remove('hidden');
//         if (capturedDisplayRef.current) capturedDisplayRef.current.classList.add('hidden');
//         // Ensure detection elements are visible when webcam is active
//         if (webcamVideoRef.current) webcamVideoRef.current.classList.remove('hidden');
//         if (detectionCanvasRef.current) detectionCanvasRef.current.classList.remove('hidden');
//         if (faceFrameRef.current) faceFrameRef.current.classList.remove('hidden');


//         // Clean up previous stream if exists
//         if (currentStream) {
//             currentStream.getTracks().forEach(track => {
//                 track.stop();
//             });
//             setCurrentStream(null);
//         }
//         // Also clear any existing face detection interval
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
//                 showMessage(setRegisterMessage, 'Webcam started. Please position your face within the frame.', 'info'); // Simplified message

//                 webcamVideoRef.current.onloadedmetadata = async () => {
//                     try {
//                         await handlePlayVideo(webcamVideoRef.current);
//                         // Optional: Add a small delay here if you still face issues with video frames not being ready
//                         // await new Promise(resolve => setTimeout(resolve, 100));

//                         const displaySize = {
//                             width: webcamVideoRef.current.offsetWidth,
//                             height: webcamVideoRef.current.offsetHeight
//                         };
//                         faceapi.matchDimensions(detectionCanvasRef.current, displaySize);
//                         // The useEffect with dependencies will handle starting detection
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

//         // Optional: Clear UI state if needed
//         clearMessage(setRegisterMessage);
//         clearMessage(setRegisterMessage);
//         setCapturedImageDataURL(null);
//         setIsPhotoAlreadyCaptured(false);
//     };

//     const capturePhoto = () => {

//         if (!currentStream) {
//             console.log('Capture failed: No current stream');
//             showMessage(setRegisterMessage, 'Webcam not active.', 'error');
//             return;
//         }

//         if (!faceAlignedRef.current) {
//             console.log('Capture failed: Face not aligned at capture moment');
//             showMessage(setRegisterMessage, 'Face moved out of alignment before capture. Please re-center.', 'warning');
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

//             const dataURL = photoCanvasRef.current.toDataURL('image/jpeg', 0.9);
//             setCapturedImageDataURL(dataURL);
//             if (capturedPhotoRef.current) capturedPhotoRef.current.src = dataURL;

//             // --- VISIBILITY CONTROL ---
//             webcamDisplayRef.current?.classList.add('hidden'); // Hide webcam
//             capturedDisplayRef.current?.classList.remove('hidden'); // Show captured photo

//             setIsPhotoAlreadyCaptured(true); // This state change is key for stopping detection
//             faceAlignedRef.current = false;

//             // Ensure all intervals are stopped after capture
//             if (faceDetectionIntervalRef.current) {
//                 clearInterval(faceDetectionIntervalRef.current);
//                 faceDetectionIntervalRef.current = null;
//             }
//             if (countdownIntervalRef.current) {
//                 clearInterval(countdownIntervalRef.current);
//                 countdownIntervalRef.current = null;
//                 console.log('capturePhoto: Stopped countdown interval.');
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
//         clearMessage(setRegisterMessage);
//         setCapturedImageDataURL(null);
//         setIsPhotoAlreadyCaptured(false); // This state change is key for restarting detection
//         countdownActiveRef.current = false;

//         // --- VISIBILITY CONTROL ---
//         capturedDisplayRef.current?.classList.add('hidden'); // Hide captured photo
//         webcamDisplayRef.current?.classList.remove('hidden'); // Show webcam

//         startWebcam(); // This will re-initialize the webcam and its state, triggering useEffect to restart detection
//     };

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
//                         open:true,
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
//                     open:true,
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

//     useEffect(() => {
//         if (modelsLoaded && currentStream && webcamVideoRef.current && !isPhotoAlreadyCaptured) {
//             // Clear any existing interval before setting a new one
//             if (faceDetectionIntervalRef.current) {
//                 clearInterval(faceDetectionIntervalRef.current);
//             }
//             faceDetectionIntervalRef.current = setInterval(detectFaces, 150);
//         } else {
//             // Stop detection if conditions are not met (e.g., photo captured, stream stopped)
//             if (faceDetectionIntervalRef.current) {
//                 clearInterval(faceDetectionIntervalRef.current);
//                 faceDetectionIntervalRef.current = null;
//             }
//             if (countdownIntervalRef.current) {
//                 clearInterval(countdownIntervalRef.current);
//                 countdownIntervalRef.current = null;
//                 countdownActiveRef.current = false;
//             }
//             // This is important: if detection stops because a photo was captured, reset faceAlignedRef
//             if (isPhotoAlreadyCaptured) {
//                 faceAlignedRef.current = false;
//             }
//         }

//         // Cleanup for this specific effect
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

//     return (
//         <React.Fragment>
//             <BootstrapDialog
//                 open={open}
//                 // onClose={onClose}
//                 aria-labelledby="customized-dialog-title"
//                 fullScreen
//             >
//                 <Components.DialogTitle sx={{ m: 0, p: 2, color: theme.palette.primary.text.main }} id="customized-dialog-title">
//                     {
//                         type === "login" ? "Login with Face" : "Register Face"
//                     }
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
//                                 className={`captured-display relative rounded-lg overflow-hidden shadow h-[28rem] w-full max-w-[500px] mx-auto ${!isPhotoAlreadyCaptured ? 'hidden' : ''
//                                     }`}
//                             >
//                                 <img
//                                     id="capturedPhoto"
//                                     ref={capturedPhotoRef}
//                                     alt="Captured Preview"
//                                     className=" w-full h-full object-cover rounded-lg"
//                                 />

//                                 {/* Retake Button Overlay */}
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
//                     </div>
//                 </Components.DialogContent>

//                 <Components.DialogActions>
//                     <div className='flex justify-end'>
//                         <Button type={`button`} text={type === "login" ? "Login" : "Register Face"} isLoading={isLoading} onClick={() => registerUser()} />
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