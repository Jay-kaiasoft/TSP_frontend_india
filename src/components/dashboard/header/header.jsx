import React, { useEffect, useRef, useState } from 'react'
import Cookies from 'js-cookie';
import { ReactComponent as User } from "../../../assets/svgs/user-alt.svg";

import Components from '../../muiComponents/components'
import { handleDrawerOpen, handleToogleSettingDrawer, handleResetTheme, handleSetTimeIn, setLoading, handleSetUserDetails, handleSetCompanyLogo } from '../../../redux/commonReducers/commonReducers';
import { connect } from 'react-redux';
import { useForm } from 'react-hook-form';
import AlertDialog from '../../common/alertDialog/alertDialog';
import { addUserTimeIn, getTodayInOutRecords, getUserLastInOut, updateUserTimeIn } from '../../../service/userInOut/userInOut';
import Menu from '../../common/menu/Menu';
import Button from '../../common/buttons/button';
import Divider from '../../common/divider/divider';
import { useLocation, useNavigate } from 'react-router-dom';
import { handleConvertUTCDateToLocalDate } from '../../../service/common/commonService';
import CustomIcons from '../../common/icons/CustomIcons';
import { useTheme } from '@mui/material';
import { getCompanyDetails } from '../../../service/companyDetails/companyDetailsService';
import { getAccurateLocation } from '../../../service/common/radarService';
import { radarPKAPIKey } from '../../../config/apiConfig/apiConfig';
import { getLocations } from '../../../service/location/locationService';

const Header = ({ handleSetCompanyLogo, companyLogo, userDetails, handleSetUserDetails, setLoading, handleDrawerOpen, drawerWidth, handleToogleSettingDrawer, handleResetTheme, handleSetTimeIn, timeIn, title }) => {
    const navigate = useNavigate()
    const location = useLocation()
    const theme = useTheme();
    const geoCheckInFlight = useRef(false);
    const intervalRef = useRef(null);

    const {
        setValue,
    } = useForm({
        defaultValues: {
            id: '',
            timeIn: '',
            timeOut: ''
        },
    });

    let userInfo = userDetails || JSON.parse(localStorage.getItem("userInfo"))
    const [anchorEl, setAnchorEl] = useState(null);
    const [profileAnchorEl, setProfileAnchorEl] = useState(null);

    const [dialog, setDialog] = useState({ open: false, title: '', message: '', actionButtonText: '' });
    const [logOutDialog, setLogOutDialog] = useState({ open: false, title: '', message: '', actionButtonText: '' });

    const [timer, setTimer] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [userTimeRecords, setUserTimeRecords] = useState([]);

    const open = Boolean(anchorEl);
    const openProfile = Boolean(profileAnchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleClickProfile = (event) => {
        setProfileAnchorEl(event.currentTarget);
    };

    const handleCloseProfile = () => {
        setProfileAnchorEl(null);
    };

    const handleOpenDialog = () => {
        setDialog({
            open: true,
            title: "Clock Out",
            message: "Are you sure! Do you want to clock out?",
            actionButtonText: "Yes",
        })
    }

    const handleCloseDialog = () => {
        setDialog({
            open: false,
            title: "",
            message: "",
            actionButtonText: "",
        })
    }

    const formatDuration = (timeIn, timeOut) => {
        if (!timeOut) return;

        const diff = new Date(timeOut) - new Date(timeIn);
        if (diff <= 0) return "0 sec";

        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        let result = [];

        if (days > 0) result.push(`${days} day${days > 1 ? "s" : ""}`);
        if (hours > 0) result.push(`${hours} hr${hours > 1 ? "s" : ""}`);
        if (minutes > 0) result.push(`${minutes} min${minutes > 1 ? "s" : ""}`);

        return result.join(" ");
    };

    const handleStart = async () => {
        if (!isRunning) {
            const response = await addUserTimeIn(sessionStorage.getItem("locationId") !== undefined && sessionStorage.getItem("locationId") !== null ? sessionStorage.getItem("locationId") : "", userInfo?.companyId);
            if (response.data?.status === 201) {
                setIsRunning(true);
                setValue("id", response.data?.result?.id);
                setTimer(0)
                localStorage.setItem("timeIn", "true")
                handleSetTimeIn(true)
            }
        }
    };

    const handleStop = async () => {
        if (isRunning) {
            setIsRunning(false);
            const response = await updateUserTimeIn(userInfo?.employeeId);
            if (response.data.status === 200) {
                handleCloseDialog()
                setTimer(0);
                setValue("id", null);
                localStorage.removeItem("timeIn")
                handleSetTimeIn(null)
                handleGetTodayInOutRecords();
                if (location.pathname.endsWith("/dashboard/timecard")) {
                    navigate("/dashboard/timecard")
                }
            }
        }
    };

    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${hrs}:${mins}:${secs}`;
    };

    const handleGetTodayInOutRecords = async () => {
        const response = await getTodayInOutRecords()
        setUserTimeRecords(response?.data?.result)
    }

    const handleOpenLogoutDialog = () => {
        setLogOutDialog({ open: true, title: "Logout", message: "Are you sure! Do you want to logout?", actionButtonText: "Logout" })
    }

    const handleLogout = () => {
        handleResetTheme()
        Cookies.remove('authToken');
        localStorage.removeItem('theme')
        localStorage.removeItem('authToken')
        localStorage.removeItem('permissions')
        localStorage.removeItem('userInfo')
        localStorage.removeItem('timeInAllow')
        setLogOutDialog({ open: false, title: "", message: "", actionButtonText: "" })
        navigate("/signin")
    }

    const handleCloseLogoutModel = () => {
        setLogOutDialog({ open: false, title: "", message: "", actionButtonText: "" })
    }

    const getInitials = (firstName, lastName) => {
        return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`;
    };

    const handleProfile = () => {
        // handleCloseProfile()
        // navigate("/dashboard/profile")
    }

    const parseUTCToLocal = (s) => {
        if (!s) return null;

        const [datePart, timePartRaw] = s.split(",").map(t => t.trim());
        const [dd, mm, yyyy] = datePart.split("/").map(Number);

        const [timePart, ampm] = timePartRaw.split(" ");
        let [hh, min, ss] = timePart.split(":").map(Number);

        if (ampm === "PM" && hh < 12) hh += 12;
        if (ampm === "AM" && hh === 12) hh = 0;

        // 👇 treat as UTC explicitly
        return new Date(Date.UTC(yyyy, mm - 1, dd, hh, min, ss));
    };

    const handleGetUserLastInOut = async () => {
        if (userInfo?.employeeId) {
            const res = await getUserLastInOut(userInfo?.employeeId);

            if (res.data.result) {
                const date1 = new Date();
                const date2 = parseUTCToLocal(res.data.result.timeIn); // ✅ parse correctly

                if (!date2 || Number.isNaN(date2.getTime())) {
                    setTimer(0);
                    setIsRunning(false);
                    return;
                }

                const diffInSeconds = Math.max(0, Math.floor((date1.getTime() - date2.getTime()) / 1000));

                setTimer(diffInSeconds);
                setIsRunning(true);
            } else {
                setTimer(0);
                setIsRunning(false);
                setValue("id", null);
            }
        }
    };


    const handleGetCompany = async () => {
        if (userInfo?.companyId) {
            const response = await getCompanyDetails(userInfo?.companyId);
            if (response.data.status === 200) {
                handleSetCompanyLogo(response.data?.result?.companyLogo)
            }
        }
    };

    useEffect(() => {
        let intervalId;
        if (isRunning) {
            intervalId = setInterval(() => {
                setTimer(prevTime => {
                    const updatedTime = prevTime + 1;
                    return updatedTime;
                });
            }, 1000);
        }
        return () => clearInterval(intervalId);
    }, [isRunning]);

    // useEffect(() => {
    // }, [timeIn])

    const checkGeofenceStatus = async () => {
        // ✅ prevent overlapping checks
        if (geoCheckInFlight.current) return;
        geoCheckInFlight.current = true;

        try {
            // If geofence is not required, allow directly
            if (
                !(
                    userInfo?.companyId &&
                    userInfo?.checkGeofence === 1 &&
                    userInfo?.roleName !== "Admin" &&
                    userInfo?.roleName !== "Owner"
                )
            ) {
                localStorage.setItem("timeInAllow", 1);
                return;
            }

            setLoading(true);

            const locations = await getLocations(JSON.parse(userInfo?.companyLocation));
            if (locations?.data?.status !== 200) {
                console.error("Failed to fetch locations:", locations?.data?.message);
                return;
            }

            const allowedExternalIds =
                locations?.data?.result?.map((item) => ({
                    externalId: item.externalId,
                    locationId: item.id,
                })) || [];

            const loc = await getAccurateLocation();

            if (!window.Radar) {
                console.error("Radar SDK not loaded.");
                return;
            }

            if (!loc?.latitude || !loc?.longitude) {
                console.error("Location data not available.");
                return;
            }

            const { latitude, longitude, accuracy } = loc;

            const formattedLatitude = parseFloat(Number(latitude).toFixed(5));
            const formattedLongitude = parseFloat(Number(longitude).toFixed(5));

            window.Radar.initialize(radarPKAPIKey);
            window.Radar.setUserId(`timesheetspro_user_${userInfo?.employeeId}`);

            // ✅ make trackOnce awaitable (so results won't race)
            const matched = await new Promise((resolve) => {
                window.Radar.trackOnce(
                    {
                        latitude: formattedLatitude,
                        longitude: formattedLongitude,
                        accuracy: Math.min(accuracy || 0, 30),
                    },
                    (status, radarLocation, user, events) => {
                        const geofences = [
                            ...(user?.user?.geofences || []),
                            ...(events?.map((e) => e?.geofence).filter(Boolean) || []),
                        ];

                        for (const g of geofences) {
                            const geofenceExternalId = g?.externalId;

                            const matchedLocation = allowedExternalIds.find(
                                (x) => x.externalId === geofenceExternalId
                            );

                            if (matchedLocation?.locationId !== undefined) {
                                console.log("✅ Matched geofence:", geofenceExternalId);
                                resolve(true); // ✅ stop here
                                return;
                            }
                        }

                        console.log("❌ No matching geofence found.");
                        resolve(false);
                    }
                );
            });

            localStorage.setItem("timeInAllow", matched ? 1 : 0);

            // ✅ OPTIONAL: stop future checks after first success
            if (matched && intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        } catch (error) {
            console.error("Error checking geofence status:", error);
        } finally {
            geoCheckInFlight.current = false;
            setLoading(false);
        }
    };

    // const checkGeofenceStatus = async () => {
    //     try {
    //         if (userInfo?.companyId && userInfo?.checkGeofence === 1 && userInfo?.roleName !== "Admin" && userInfo?.roleName !== "Owner") {
    //             setLoading(true);
    //             const locations = await getLocations(JSON.parse(userInfo?.companyLocation));
    //             if (locations.data.status === 200) {
    //                 const locationData = locations?.data?.result?.map(item => ({
    //                     externalId: item.externalId,
    //                     locationId: item.id
    //                 }));

    //                 const allowedExternalIds = locationData?.map((loc, i) => {
    //                     return {
    //                         externalId: loc.externalId,
    //                         locationId: loc.locationId
    //                     }
    //                 });
    //                 const loc = await getAccurateLocation();

    //                 if (!window.Radar) {
    //                     console.error("Radar SDK not loaded.");
    //                     return false;
    //                 }

    //                 if (!loc?.latitude || !loc?.longitude) {
    //                     console.error("Location data not available.");
    //                     return false;
    //                 }

    //                 const { latitude, longitude, accuracy } = loc;

    //                 const formattedLatitude = parseFloat(latitude.toFixed(5));
    //                 const formattedLongitude = parseFloat(longitude.toFixed(5));

    //                 window.Radar.initialize(radarPKAPIKey);
    //                 window.Radar.setUserId(`timesheetspro_user_${userInfo?.employeeId}`);

    //                 window.Radar.trackOnce(
    //                     {
    //                         latitude: formattedLatitude,
    //                         longitude: formattedLongitude,
    //                         accuracy: Math.min(accuracy, 30),
    //                     },
    //                     (status, loc, user, events) => {
    //                         const geofences = [
    //                             ...(user?.user?.geofences || []),
    //                             ...(events?.map(e => e?.geofence).filter(Boolean) || []),
    //                         ];
    //                         for (const g of geofences) {
    //                             const geofenceExternalId = g?.externalId;

    //                             const matchedLocation = allowedExternalIds.find(
    //                                 loc => loc.externalId === geofenceExternalId
    //                             );

    //                             if (matchedLocation?.locationId !== undefined) {
    //                                 console.log("✅ Matched geofence:", geofenceExternalId);
    //                                 localStorage.setItem("timeInAllow", 1)
    //                                 return;
    //                             }
    //                         }
    //                         console.log("❌ No matching geofence found.");
    //                         localStorage.setItem("timeInAllow", 0)
    //                     }
    //                 );

    //             } else {
    //                 console.error("Failed to fetch locations:", locations.data.message);
    //                 setLoading(false);
    //                 return;
    //             }
    //         } else {
    //             localStorage.setItem("timeInAllow", 1);
    //         }
    //     } catch (error) {
    //         console.error("Error checking geofence status:", error);
    //     }
    // };

    useEffect(() => {
        const stored = localStorage.getItem("userInfo");
        const parsedUser = stored ? JSON.parse(stored) : null;

        if (parsedUser) {
            handleSetUserDetails(parsedUser);
        }

        handleGetTodayInOutRecords();
        handleGetUserLastInOut();
        handleGetCompany();

        // First immediate check
        checkGeofenceStatus();

        // Repeat every 60 sec
        intervalRef.current = setInterval(() => {
            checkGeofenceStatus();
        }, 60000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    // useEffect(() => {
    //     if (JSON.parse(localStorage.getItem("userInfo"))) {
    //         handleSetUserDetails(JSON.parse(localStorage.getItem("userInfo")))
    //     }
    //     handleGetTodayInOutRecords()
    //     handleGetUserLastInOut()
    //     handleGetCompany()
    //     checkGeofenceStatus();
    //     const intervalId = setInterval(checkGeofenceStatus, 60000);
    //     return () => clearInterval(intervalId);
    // }, []);

    return (
        <>
            <Components.AppBar
                position="fixed"
                sx={{
                    width: { md: `calc(100% - ${drawerWidth}px)` },
                    ml: { md: `${drawerWidth}px` },
                    background: theme.palette.primary.background.headerBgColor || 'white',
                    boxShadow: 0,
                    transition: 'width 0.3s ease-in-out',
                    borderBottom: `1px solid ${theme.palette.primary.background.headerBgColor}`,
                }}
            >
                <Components.Toolbar sx={{ display: 'block', paddingY: 0.5 }}>
                    <Components.Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingY: '0px',
                            width: '100%',
                            gap: { xs: 0, sm: 4 }
                        }}
                    >
                        <Components.IconButton
                            color="inherit"
                            aria-label="open drawer"
                            edge="start"
                            sx={{ mr: 0, display: { md: 'none' } }}
                            onClick={handleDrawerOpen}
                        >
                            <CustomIcons iconName={'fa-solid fa-list'} css='text-[#262b43] cursor-pointer' />
                        </Components.IconButton>

                        <Components.Box sx={{ flexGrow: 1 }}>
                            <div className="flex justify-start items-center gap-3">
                                {
                                    <div className='w-12 h-12 rounded-full'>
                                        {companyLogo ? (
                                            <img
                                                src={companyLogo}
                                                alt="Preview"
                                                className="h-full w-full object-cover border rounded-full"
                                            />
                                        ) :
                                            <div className='mt-2'>
                                                <User height={30} width={30} fill="#CED4DA" />
                                            </div>
                                        }
                                    </div>
                                }
                                <div>
                                    <p style={{ color: theme.palette.primary.text.main, fontWeight: "bold", fontSize: 20 }}>
                                        {title}
                                    </p>
                                </div>
                            </div>

                            {/* <SearchInput startIcon={<Icons.RiSearchLine className='w-6 h-6 mr-2' />} placeholder="Search" /> */}
                        </Components.Box>

                        <Components.Box sx={{ display: 'flex', gap: 2 }}>
                            <Components.Box sx={{ display: 'flex', gap: 2, padding: 1, alignItems: "center" }}>
                                {
                                    (userInfo?.employeeId && userInfo?.companyId) && (
                                        <Components.Box onClick={handleClick}>
                                            <CustomIcons iconName={"fa-regular fa-clock"} css='cursor-pointer text-2xl mt-2 text-black' />
                                        </Components.Box>
                                    )
                                }
                                <Components.Box onClick={handleClickProfile}>
                                    <Components.Avatar
                                        alt={userInfo?.firstName + " " + userInfo?.lastName}
                                        src={userInfo?.profileImage}
                                        sx={{
                                            backgroundColor: userInfo?.profileImage ? "" : "#0093E9",
                                            border: "1px solid #cfd0d6",
                                            color: "white",
                                            fontSize: "16px",
                                            fontWeight: "bold",
                                            cursor: "pointer",
                                        }}
                                    >
                                        {!userInfo?.profileImage && getInitials(userInfo?.firstName, userInfo?.lastName)}
                                    </Components.Avatar>
                                </Components.Box>
                            </Components.Box>
                        </Components.Box>
                    </Components.Box>
                </Components.Toolbar>
            </Components.AppBar>

            <AlertDialog open={dialog.open} title={dialog.title} message={dialog.message} actionButtonText={dialog.actionButtonText} handleAction={handleStop} handleClose={handleCloseDialog} />
            <AlertDialog open={logOutDialog.open} title={logOutDialog.title} message={logOutDialog.message} actionButtonText={logOutDialog.actionButtonText} handleAction={handleLogout} handleClose={handleCloseLogoutModel} />

            <Menu
                id="demo-customized-menu"
                MenuListProps={{
                    'aria-labelledby': 'demo-customized-button',
                }}
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                width={360}

            >
                <div className="flex flex-col items-center gap-4 p-5">
                    <div className="text-xl font-bold">{formatTime(timer)}</div>

                    {
                        parseInt(localStorage.getItem("timeInAllow")) === 1 && (
                            <div className="flex justify-center gap-4">
                                <button
                                    className={`px-4 py-2 text-white rounded ${isRunning || parseInt(localStorage.getItem("timeInAllow")) === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 cursor-pointer'}`}
                                    onClick={handleStart}
                                    //|| isRunning
                                    disabled={parseInt(localStorage.getItem("timeInAllow")) === 0 || isRunning}
                                >
                                    Clock In
                                </button>
                                <button
                                    className={`px-4 py-2 text-white rounded ${!isRunning ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500'}`}
                                    onClick={handleOpenDialog}
                                    disabled={!isRunning}
                                >
                                    Clock Out
                                </button>
                            </div>
                        )
                    }

                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b-2 border-gray-300 text-left">
                                <th className="p-2">#</th>
                                <th className="p-2">Clock In</th>
                                <th className="p-2">Clock Out</th>
                                <th className="p-2">Total Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {userTimeRecords?.map((entry, index) => (
                                <tr key={index} className="border-b border-gray-200">
                                    <td className="p-2">{index + 1}</td>
                                    <td className="p-2">
                                        {
                                            handleConvertUTCDateToLocalDate(entry.timeIn)?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
                                        }
                                        {/* {new Date(entry.timeIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} */}
                                    </td>
                                    <td className="p-2">
                                        {
                                            entry.timeOut ? handleConvertUTCDateToLocalDate(entry.timeOut)?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : "-"
                                        }
                                        {/* {new Date(entry.timeOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} */}
                                    </td>
                                    <td className="p-2">{formatDuration(handleConvertUTCDateToLocalDate(entry.timeIn), handleConvertUTCDateToLocalDate(entry.timeOut))}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Menu>

            <Menu
                id="demo-customized-menu"
                anchorEl={profileAnchorEl}
                open={openProfile}
                onClose={handleCloseProfile}
                width={200}
            >
                <div className='text-center p-3 hover:bg-gray-50 cursor-pointer' onClick={() => handleProfile()}>
                    <div className='flex justify-start gap-3 items-center'>
                        <Components.Avatar
                            alt={userInfo?.firstName + " " + userInfo?.lastName}
                            src={userInfo?.profileImage}
                            sx={{
                                backgroundColor: userInfo?.profileImage ? "" : "#0093E9",
                                border: "1px solid #cfd0d6",
                                color: "white",
                                fontSize: "16px",
                                fontWeight: "bold",
                            }}
                        >
                            {!userInfo?.profileImage && getInitials(userInfo?.firstName, userInfo?.lastName)}
                        </Components.Avatar>

                        <p className='text-sm text-start font-semibold'>
                            {userInfo?.firstName} {userInfo?.lastName}<br />
                            <span>
                                {userInfo?.roleName}
                            </span>
                        </p>
                    </div>
                </div>
                <Divider />
                <div className='px-3 py-1'>
                    <Button useFor="error" endIcon={<CustomIcons iconName="fa-solid fa-arrow-right-from-bracket" />} text="Logout" onClick={handleOpenLogoutDialog}></Button>
                </div>
            </Menu>
        </>
    )
}

const mapDispatchToProps = {
    handleDrawerOpen,
    handleToogleSettingDrawer,
    handleResetTheme,
    handleSetTimeIn,
    setLoading,
    handleSetUserDetails,
    handleSetCompanyLogo
};

const mapStateToProps = (state) => ({
    drawerOpen: state.common.drawerOpen,
    timeIn: state.common.timeIn,
    title: state.common.title,
    userDetails: state.common.userDetails,
    companyLogo: state.common.companyLogo,
});

export default connect(mapStateToProps, mapDispatchToProps)(Header)