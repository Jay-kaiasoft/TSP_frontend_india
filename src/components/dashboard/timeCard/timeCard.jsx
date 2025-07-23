import React, { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import CustomIcons from '../../common/icons/CustomIcons';
import DatePickerComponent from '../../common/datePickerComponent/datePickerComponent';
import { useTheme } from '@mui/material';
import { Tabs } from '../../common/tabs/tabs';
import DataTable from '../../common/table/table';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/plugin/timezone'; // import the timezone data

import { getAllEntriesByUserId, updateUserTimeRecord } from '../../../service/userInOut/userInOut';
import { handleConvertUTCDateToLocalDate, handleFormateUTCDateToLocalDate } from '../../../service/common/commonService';
import { getAllEmployeeListByCompanyId } from '../../../service/companyEmployee/companyEmployeeService';
import { connect } from 'react-redux';
import { handleSetTitle, setAlert } from '../../../redux/commonReducers/commonReducers';
import DateTimePickerComponent from '../../common/dateTimePickerComponent/dateTimePicker';
import Components from '../../muiComponents/components';
import PermissionWrapper from '../../common/permissionWrapper/PermissionWrapper';
import Button from '../../common/buttons/button';
import DetailedPDFTable from './timeCardPDF/detailedPDFTable';
import { getCompanyDetails } from '../../../service/companyDetails/companyDetailsService';
import Select from '../../common/select/select';
import { getAllActiveLocationsByCompanyId } from '../../../service/location/locationService';
import SelectMultiple from '../../common/select/selectMultiple';
import { getAllDepartment } from '../../../service/department/departmentService';

const tabData = [
    {
        label: 'Timecard',
    },
    // {
    //     label: 'Totals'
    // },
    // {
    //     label: 'Schedule',
    // },
]

const payClassOptions = [
    { id: 1, title: "Handyman" },
    { id: 2, title: "HouseKeeping" },
    { id: 3, title: "Managar" },
]

const TimeCard = ({ handleSetTitle, setAlert }) => {
    dayjs.extend(utc);
    dayjs.extend(timezone);

    const userInfo = JSON.parse(localStorage.getItem("userInfo"))
    const theme = useTheme();


    const [selectedTab, setSelectedTab] = useState(0);
    const [loadingPdf, setLoadingPdf] = useState(false);

    const [isOpen, setIsOpen] = useState(false);
    const [users, setUsers] = useState([])

    const [rows, setRow] = useState([])
    const [companyInfo, setCompanyInfo] = useState()

    const [editType, setEditType] = useState(null)
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const [showPdfContent, setShowPdfContent] = useState(false);
    const [locations, setLocations] = useState([]);
    const [department, setDepartment] = useState([]);

    const {
        control,
        watch,
        setValue,
    } = useForm({
        defaultValues: {
            startDate: (() => {
                const today = new Date();
                return `${(today.getMonth() + 1).toString().padStart(2, "0")}/01/${today.getFullYear()}`;
            })(),
            endDate: (() => {
                const today = new Date();
                return `${(today.getMonth() + 1).toString().padStart(2, "0")}/${today.getDate().toString().padStart(2, "0")}/${today.getFullYear()}`;
            })(),
            id: null,
            timeIn: null,
            timeOut: null,
            createdOn: null,
            userId: null,
            locationIds: [],
            selectedUserId: [],
            selectedDepartmentId: [],
        }
    });

    const handleChangeTab = (value) => {
        setSelectedTab(value);
    }

    const toggleOpen = () => {
        setIsOpen((prev) => !prev);
    };

    function convertToDesiredFormat(date) {
        // This function now expects a Date object, not an ISO string
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${month}/${day}/${year}, ${hours}:${minutes}:${seconds}`;
    }

    const handleGetAllUsers = async () => {
        if ((userInfo?.roleName === "Admin" && userInfo?.companyId)) {
            const response = await getAllEmployeeListByCompanyId(userInfo?.companyId)
            const data = response.data.result?.map((row) => {
                return {
                    id: row.employeeId,
                    title: row.userName
                }
            })
            setUsers(data)
            // setValue("selectedUserId", [parseInt(userInfo?.employeeId)])
        }
    }

    const handleGetAllEntriesByUserId = async () => {
        let params = new URLSearchParams();
        let userIds = []
        let locationIds = []
        let departmentIds = []

        if (userInfo?.roleName !== "Admin" && userInfo?.companyId && watch("selectedUserId").length === 0) {
            params.append("userIds", [userInfo?.employeeId]);
        } else {
            if (watch("selectedUserId") && watch("selectedUserId").length > 0) {
                watch("selectedUserId").forEach(id => userIds.push(id));
                params.append("userIds", userIds)
            }
        }
        if (watch("locationIds") && watch("locationIds").length > 0) {
            watch("locationIds").forEach(id => locationIds.push(id));
            params.append("locationIds", locationIds)
        }
        if (watch("selectedDepartmentId") && watch("selectedDepartmentId").length > 0) {
            watch("selectedDepartmentId").forEach(id => departmentIds.push(id));
            params.append("departmentIds", departmentIds)
        }
        if (watch("startDate")) params.append("startDate", watch("startDate"));
        if (watch("endDate")) {
            const endDate = new Date(watch("endDate"));
            const today = new Date();
            if (endDate.toDateString() === today.toDateString()) {
                params.append("endDate", convertToDesiredFormat(new Date()));
            } else {
                endDate.setHours(23, 59, 59, 999);
                params.append("endDate", convertToDesiredFormat(endDate));
            }
        }

        let userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (userTimeZone === "Asia/Kolkata") {
            userTimeZone = "Asia/Calcutta";
        }
        params.append("timeZone", userTimeZone);

        try {
            const res = await getAllEntriesByUserId(params)
            setRow(res?.data?.result || [])
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }

    const handleOpenTimePicker = (row, type) => {
        setEditType(type)
        const createdDate = dayjs(row.createdOn, "MM/DD/YYYY, hh:mm:ss A");
        const currentTimeZone = dayjs.tz.guess();
        const timeInUTC = dayjs.utc(row.timeIn, "MM/DD/YYYY, hh:mm:ss A");
        const timeInLocal = timeInUTC.tz(currentTimeZone);

        const timeOutUTC = dayjs.utc(row.timeOut, "MM/DD/YYYY, hh:mm:ss A");
        const timeOutLocal = timeOutUTC.tz(currentTimeZone);

        setValue("timeIn", timeInLocal);
        setValue("timeOut", timeOutLocal);

        setValue("createdOn", createdDate);
        setValue("id", row.id);
        setValue("userId", row.userId);
    };

    const handleUpdateRecord = async () => {
        const data = {
            timeIn: watch("timeIn")?.$d,
            timeOut: watch("timeOut")?.$d,
            userId: watch("userId"),
            createdOn: watch("createdOn"),
            id: watch("id"),
        }
        const response = await updateUserTimeRecord(data)
        if (response?.data?.status === 200) {
            setEditType(null)
            setValue("createdOn", null)
            setValue("timeIn", null)
            setValue("timeOut", null)
            setValue("userId", null)
            setValue("id", null)
            handleGetAllEntriesByUserId()
        } else {
            setAlert({ open: true, message: response?.data?.message, type: "error" })
        }
    }

    const handleGetCompanyInfo = async () => {
        if (userInfo?.companyId) {
            const response = await getCompanyDetails(userInfo?.companyId)
            setCompanyInfo(response?.data?.result)
        }
    }

    const handleGetAllDepartment = async () => {
        if (userInfo?.companyId) {
            const response = await getAllDepartment(userInfo?.companyId)
            if (response.data.status === 200) {
                const data = response.data?.result?.map((item) => {
                    return {
                        id: item?.id,
                        title: item?.departmentName,
                    }
                })
                setDepartment(data)
            }
        }
    }

    useEffect(() => {
        handleSetTitle("Time Card")
        handleGetCompanyInfo()
        handleGetAllEntriesByUserId()
        handleGetAllUsers()
        handleGetAllDepartment()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        handleGetAllEntriesByUserId();
    }, [watch("startDate"), watch("endDate"), watch("selectedUserId"), watch("locationIds"), watch("selectedDepartmentId")]);

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

    const getTotalDurationInMs = (data) => {
        if (data?.length > 0) {
            return data?.reduce((total, row) => {
                if (row.timeIn && row.timeOut) {
                    const diff = new Date(row.timeOut) - new Date(row.timeIn);
                    if (diff > 0) {
                        return total + diff;
                    }
                }
                return total;
            }, 0);
        } else {
            return 0
        }
    };

    const formatHoursToHrMin = (hours) => {
        const hrs = Math.floor(hours);
        const mins = Math.floor((hours - hrs) * 60);
        return `${hrs} hr ${mins} min`;
    };

    const getTotalOT = (data) => {
        if (data?.length > 0) {
            return data.reduce((total, row) => {
                const timeIn = new Date(handleConvertUTCDateToLocalDate(row?.timeIn));
                const timeOut = new Date(handleConvertUTCDateToLocalDate(row?.timeOut));
                const totalHours = parseFloat(row?.companyShiftDto?.totalHours) || 0;

                const workedMs = timeOut - timeIn;
                const workedHours = workedMs / (1000 * 60 * 60); // Convert ms to hours

                const ot = workedHours > totalHours ? workedHours - totalHours : 0;

                return total + ot;
            }, 0);
        } else {
            return 0;
        }
    };

    const getTotalRegular = (data) => {
        let totalRegularHours = 0;

        data?.map((record, index) => {
            const timeIn = new Date(handleConvertUTCDateToLocalDate(record?.timeIn));
            const timeOut = new Date(handleConvertUTCDateToLocalDate(record?.timeOut));
            const totalHours = parseFloat(record?.companyShiftDto?.totalHours) || 0;

            const durationMs = timeOut - timeIn;
            const workedHours = durationMs / (1000 * 60 * 60);
            let regularHours = workedHours;

            if (workedHours > totalHours) {
                regularHours = totalHours;
            }

            totalRegularHours += regularHours;
        });

        const totalRegWholeHours = Math.floor(totalRegularHours);
        const totalRegMinutes = Math.floor((totalRegularHours - totalRegWholeHours) * 60);
        const formattedTotalRegular =
            totalRegWholeHours > 0 || totalRegMinutes > 0
                ? `${totalRegWholeHours > 0 ? `${totalRegWholeHours} hr` : ''}${totalRegMinutes > 0 ? ` ${totalRegMinutes} min` : ''}`.trim()
                : '00:00';

        return formattedTotalRegular;
    }

    const formatTotalDuration = (totalMs) => {
        const minutes = Math.floor((totalMs / (1000 * 60)) % 60);
        const hours = Math.floor((totalMs / (1000 * 60 * 60)) % 24);
        const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));

        const result = [];
        if (days > 0) result.push(`${days} day${days > 1 ? "s" : ""}`);
        if (hours > 0) result.push(`${hours} hr${hours > 1 ? "s" : ""}`);
        if (minutes > 0) result.push(`${minutes} min${minutes > 1 ? "s" : ""}`);

        return result.join(" ");
    };

    const columns = [
        {
            field: 'rowId',
            headerName: 'DAY',
            headerClassName: 'uppercase',
            flex: 1,
            minWidth: 120,
            align: "left",
            headerAlign: "left",
            renderCell: (params) => {
                return (
                    <div>
                        {handleFormateUTCDateToLocalDate(params.row?.createdOn)}
                    </div>
                );
            },
        },
        {
            field: 'timeIn',
            headerName: 'timein',
            headerClassName: 'uppercase',
            flex: 1,
            minWidth: 110,
            align: "left",
            headerAlign: "left",
            renderCell: (params) => {
                const handleOpen = (event) => {
                    handleOpenTimePicker(params.row, "timeIn")
                    setAnchorEl(event.currentTarget);
                };

                const handleClose = () => {
                    setAnchorEl(null);
                    setEditType(null)
                    handleUpdateRecord()
                };

                const id = open ? 'time-picker-popover' : undefined;

                return (
                    <>
                        <div className="flex justify-start items-center gap-3">
                            <PermissionWrapper
                                functionalityName="UserClock"
                                moduleName="UserClock"
                                actionId={2}
                                component={
                                    <div onClick={handleOpen}>
                                        <CustomIcons iconName="fa-solid fa-pen-to-square" css="cursor-pointer h-4 w-4" />
                                    </div>
                                }
                            />
                            <div className="cursor-pointer">
                                {handleConvertUTCDateToLocalDate(params.row?.timeIn)?.toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true,
                                })}
                            </div>
                        </div>
                        {
                            editType === "timeIn" && (
                                <Components.Popover
                                    id={id}
                                    open={open}
                                    anchorEl={anchorEl}
                                    onClose={handleClose}
                                    anchorOrigin={{
                                        vertical: 'bottom',
                                        horizontal: 'left',
                                    }}
                                    sx={{
                                        "& .MuiPaper-root.MuiPopover-paper": {
                                            boxShadow: "none",
                                            border: `2px solid ${theme.palette.primary.main}`
                                        }
                                    }}
                                >
                                    <div>
                                        {
                                            editType === "timeIn" && (
                                                <DateTimePickerComponent
                                                    name="timeIn"
                                                    control={control}
                                                    setValue={setValue}
                                                    maxTime={watch("timeOut")}
                                                />
                                            )
                                        }
                                    </div>
                                </Components.Popover>
                            )
                        }
                    </>
                );
            },

        },
        {
            field: 'timeOut',
            headerName: 'timeout',
            headerClassName: 'uppercase',
            flex: 1,
            minWidth: 110,
            align: "left",
            headerAlign: "left",
            renderCell: (params) => {
                const handleOpen = (event) => {
                    handleOpenTimePicker(params.row, "timeOut")
                    setAnchorEl(event.currentTarget);
                };

                const handleClose = () => {
                    setAnchorEl(null);
                    setEditType(null)
                    handleUpdateRecord()
                };

                const open = Boolean(anchorEl);
                const id = open ? 'time-picker-popover' : undefined;

                return (
                    <>
                        {
                            (params.row?.timeOut !== null && params.row?.timeOut !== undefined) ? (
                                <>
                                    <div className="flex justify-start items-center gap-3">
                                        <PermissionWrapper
                                            functionalityName="UserClock"
                                            moduleName="UserClock"
                                            actionId={2}
                                            component={
                                                <div onClick={handleOpen}>
                                                    <CustomIcons iconName="fa-solid fa-pen-to-square" css="cursor-pointer h-4 w-4" />
                                                </div>
                                            }
                                        />
                                        <div className="cursor-pointer">
                                            {handleConvertUTCDateToLocalDate(params.row?.timeOut)?.toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                hour12: true,
                                            })}
                                        </div>
                                    </div>
                                    {
                                        editType === "timeOut" && (
                                            <Components.Popover
                                                id={id}
                                                open={open}
                                                anchorEl={anchorEl}
                                                onClose={handleClose}
                                                anchorOrigin={{
                                                    vertical: 'bottom',
                                                    horizontal: 'left',
                                                }}
                                                sx={{
                                                    "& .MuiPaper-root.MuiPopover-paper": {
                                                        boxShadow: "none",
                                                        border: `2px solid ${theme.palette.primary.main}`
                                                    }
                                                }}
                                            >
                                                <div>
                                                    <DateTimePickerComponent
                                                        name="timeOut"
                                                        control={control}
                                                        setValue={setValue}
                                                        minTime={watch("timeIn")}
                                                    />
                                                </div>
                                            </Components.Popover>
                                        )
                                    }
                                </>
                            ):<span>-</span>
                        }
                    </>
                );
            },
        },
        {
            field: 'regular',
            headerName: 'regular',
            headerClassName: 'uppercase',
            flex: 1,
            minWidth: 110,
            align: "left",
            headerAlign: "left",
            renderCell: (params) => {
                const timeIn = new Date(handleConvertUTCDateToLocalDate(params?.row?.timeIn));
                const timeOut = new Date(handleConvertUTCDateToLocalDate(params?.row?.timeOut));
                const totalHours = parseFloat(params?.row?.companyShiftDto?.totalHours) || 0;

                const durationMs = timeOut - timeIn;
                const workedHours = durationMs / (1000 * 60 * 60);

                let regularHours = workedHours;

                if (workedHours > totalHours) {
                    regularHours = totalHours;
                }
                const regWholeHours = Math.floor(regularHours);
                const regMinutes = Math.floor((regularHours - regWholeHours) * 60);
                const formattedRegular =
                    regWholeHours > 0 || regMinutes > 0
                        ? `${regWholeHours > 0 ? `${regWholeHours} hr` : ''}${regMinutes > 0 ? ` ${regMinutes} min` : ''}`.trim()
                        : '00:00';

                return (
                    <div>
                        {formattedRegular}
                    </div>
                );
            },
        },
        {
            field: 'ot',
            headerName: 'OT',
            headerClassName: 'uppercase',
            flex: 1,
            minWidth: 80,
            align: "left",
            headerAlign: "left",
            renderCell: (params) => {
                const timeIn = new Date(handleConvertUTCDateToLocalDate(params.row?.timeIn));
                const timeOut = new Date(handleConvertUTCDateToLocalDate(params.row?.timeOut));
                const totalHours = parseFloat(params.row?.companyShiftDto?.totalHours) || 0;

                // Calculate worked hours
                const durationMs = timeOut - timeIn;
                const workedHours = durationMs / (1000 * 60 * 60); // in hours

                // Calculate OT if workedHours > totalHours
                let otHours = 0;
                if (workedHours > totalHours) {
                    otHours = workedHours - totalHours;
                }

                // Format OT hours into hr/min
                const otWholeHours = Math.floor(otHours);
                const otMinutes = Math.floor((otHours - otWholeHours) * 60);

                const formattedOT =
                    otWholeHours > 0 || otMinutes > 0
                        ? `${otWholeHours > 0 ? `${otWholeHours} hr` : ''}${otMinutes > 0 ? ` ${otMinutes} min` : ''}`.trim()
                        : '00:00';

                return <div>{formattedOT}</div>;
            }
        },
        {
            field: 'lbt',
            headerName: 'lbt',
            headerClassName: 'uppercase',
            flex: 1,
            minWidth: 80,
            align: "left",
            headerAlign: "left",
            renderCell: (params) => {
                return (
                    <div>
                        {"00:00"}
                    </div>
                );
            },
        },
        {
            field: 'lbp',
            headerName: 'lbp',
            headerClassName: 'uppercase',
            flex: 1,
            minWidth: 80,
            align: "left",
            headerAlign: "left",
            renderCell: (params) => {
                return (
                    <div>
                        {"00:00"}
                    </div>
                );
            },
        },
        {
            field: 'ok',
            headerName: 'out of shift',
            headerClassName: 'uppercase',
            flex: 1,
            minWidth: 80,
            align: "left",
            headerAlign: "left",
            renderCell: (params) => {
                return (
                    <div>
                        {"-"}
                    </div>
                );
            },
        },
        {
            field: 'total',
            headerName: 'total',
            headerClassName: 'uppercase',
            flex: 1,
            minWidth: 110,
            align: "left",
            headerAlign: "left",
            renderCell: (params) => {
                return (
                    <div>
                        {formatDuration(handleConvertUTCDateToLocalDate(params.row?.timeIn), handleConvertUTCDateToLocalDate(params.row?.timeOut))}
                    </div>
                );
            },
        },
    ];

    const getRowId = (row) => {
        return row.id;
    }

    const generatePDF = async () => {
        setShowPdfContent(true);
        setLoadingPdf(true);

        setTimeout(async () => {
            const element = document.getElementById("table-container");
            if (!element) return;

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
            });

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");

            const imgWidth = 190;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
            pdf.save("report.pdf");

            setShowPdfContent(false);
            setLoadingPdf(false);
        }, 500); // allow time to render
    };

    const actionButtons = () => {
        return (
            <div className='flex justify-start items-center gap-3 w-38'>
                <Button type={`button`} useFor={'error'} text={'Download PDF'} isLoading={loadingPdf} onClick={() => generatePDF()} startIcon={<CustomIcons iconName="fa-solid fa-file-pdf" css="h-5 w-5" />} />
                {/* //     
            //     <p className='text-white'>Generate PDF</p> */}
            </div>
        )
    }

    const handleGetCompanyLocations = async () => {
        if (userInfo?.companyId) {
            const res = await getAllActiveLocationsByCompanyId(userInfo?.companyId)
            if (res?.data?.status === 200) {
                const data = res?.data?.result?.map((item) => {
                    return {
                        title: item?.locationName,
                        id: item?.id
                    }
                })
                setLocations(data)
            }
        }
    }

    useEffect(() => {
        handleGetCompanyLocations();
    }, []);

    return (
        <>
            <div className='py-2 px-4 lg:p-4 border rounded-lg bg-white'>
                <div className='mb-4 relative'>
                    <div className='grid grid-col-12 md:grid-cols-4 gap-3 items-center'>
                        <div className='flex justify-start items-center gap-6'>
                            <div>
                                <p className='font-bold'>{userInfo?.userName}</p>
                            </div>
                            <div onClick={toggleOpen}>
                                <CustomIcons
                                    iconName="fa-solid fa-angle-down"
                                    css={`cursor-pointer h-4 w-4 transition-transform duration-300 ease-in-out transform ${isOpen ? "rotate-180" : "rotate-0"}`}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={`mt-3 overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"}`}>
                        <div className='flex justify-start items-center gap-12'>
                            <div className='flex'>
                                <span style={{ color: theme.palette.primary.text.main }} className="grow md:grow-0 text-sm md:text-medium font-semibold min-w-[120px] lg:min-w-[100px] capitalize">
                                    Position Id :
                                </span>
                                <span style={{ color: theme.palette.primary.text.main }}>-</span>
                            </div>

                            <div className='flex'>
                                <span style={{ color: theme.palette.primary.text.main }} className="grow md:grow-0 text-sm md:text-medium font-semibold min-w-[120px] lg:min-w-[100px] capitalize">
                                    Pay class :
                                </span>
                                <span style={{ color: theme.palette.primary.text.main }}>
                                    {userInfo?.payClass ? payClassOptions?.filter((row) => row.id === parseInt(userInfo?.payClass))?.[0]?.title : "-"}
                                </span>
                            </div>

                            <div className='flex'>
                                <span style={{ color: theme.palette.primary.text.main }} className="grow md:grow-0 text-sm md:text-medium font-semibold min-w-[120px] lg:min-w-[100px] capitalize">
                                    Status :
                                </span>
                                <span style={{ color: theme.palette.primary.text.main }}>
                                    {userInfo?.isActive ? (userInfo?.isActive === 1 ? "Active" : "Deactive") : "-"}
                                </span>
                            </div>
                        </div>

                        <div className='mt-2 flex justify-start items-center gap-12'>
                            <div className='flex'>
                                <span style={{ color: theme.palette.primary.text.main }} className="grow md:grow-0 text-sm md:text-medium font-semibold min-w-[120px] lg:min-w-[100px] capitalize">
                                    Supervisor :
                                </span>
                                <span style={{ color: theme.palette.primary.text.main }}>-</span>
                            </div>

                            <div className='flex col-span-4'>
                                <span style={{ color: theme.palette.primary.text.main }} className="grow md:grow-0 text-sm md:text-medium font-semibold min-w-[120px] lg:min-w-[100px] capitalize">
                                    Department :
                                </span>
                                <span style={{ color: theme.palette.primary.text.main }}>
                                    {userInfo?.departmentName ? userInfo?.departmentName : "-"}
                                </span>
                            </div>

                            <div className='flex'>
                                <span style={{ color: theme.palette.primary.text.main }} className="grow md:grow-0 text-sm md:text-medium font-semibold min-w-[120px] lg:min-w-[100px] capitalize">
                                    Semimonthly :
                                </span>
                                <span style={{ color: theme.palette.primary.text.main }}>-</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='bg-gray-200 h-0.5 my-4'></div>

                <div className='grid grid-col-12 md:grid-cols-4 gap-3 items-center'>
                    <div className='mb-4 w-full md:mb-0'>
                        <DatePickerComponent setValue={setValue} control={control} name='startDate' label={`Start Date`} minDate={null} maxDate={watch("endDate")} />
                    </div>

                    <div className='mb-4 w-full md:mb-0'>
                        <DatePickerComponent setValue={setValue} control={control} name='endDate' label={`End Date`} minDate={watch("startDate")} maxDate={(() => {
                            const today = new Date();
                            return `${(today.getMonth() + 1).toString().padStart(2, "0")}/${today.getDate().toString().padStart(2, "0")}/${today.getFullYear()}`;
                        })()} />
                    </div>

                    {((userInfo?.roleName === "Admin" || userInfo?.roleName === "Owner") && userInfo?.companyId) ? (
                        <div className='mb-4 w-full md:mb-0'>
                            <Controller
                                name="selectedUserId"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        options={users}
                                        label={"Emmployee List"}
                                        placeholder="Select employees"
                                        value={watch("selectedUserId")?.[0] || []}
                                        onChange={(_, newValue) => {
                                            if (newValue?.id) {
                                                field.onChange([newValue.id]);
                                            } else {
                                                setValue("selectedUserId", null);
                                            }
                                        }}
                                    />
                                )}
                            />
                        </div>
                    ) : null}
                    {
                        userInfo?.companyId ? (
                            <div className='mb-4 w-full md:mb-0'>
                                <Controller
                                    name="locationIds"
                                    control={control}
                                    render={({ field }) => (
                                        <SelectMultiple
                                            options={locations}
                                            label={"Select Location"}
                                            placeholder="Select location"
                                            value={field.value || []}
                                            onChange={(newValue) => {
                                                field.onChange(newValue);
                                            }}
                                        />
                                    )}
                                />
                            </div>
                        ) : null
                    }
                    <div className='mb-4 w-full md:mb-0'>
                        <Controller
                            name="selectedDepartmentId"
                            control={control}
                            render={({ field }) => (
                                <SelectMultiple
                                    options={department}
                                    label={"Select Department"}
                                    placeholder="Select department"
                                    value={field.value || []}
                                    onChange={(newValue) => {
                                        field.onChange(newValue);
                                    }}
                                />
                            )}
                        />
                    </div>
                </div>

                <div className='my-4'>
                    <Tabs tabsData={tabData} selectedTab={selectedTab} handleChange={handleChangeTab} type={'underline'} />
                </div>

                <div className='border rounded-lg bg-white lg:w-full shadow-[0px_4px_14px_0px_rgba(38,43,67,0.16)]'>
                    <div>
                        <DataTable columns={columns} rows={rows} getRowId={getRowId} showButtons={true} buttons={actionButtons} />
                    </div>
                </div>

                <div className="self-stretch md:inline-flex justify-start items-center gap-10 mt-5">
                    <div className="md:inline-flex flex-col justify-center items-start gap-3">
                        <div className="inline-flex justify-start items-center gap-[15px]">
                            <div className="justify-start text-xs font-bold  uppercase leading-normal tracking-tight">Total Hours :</div>
                            <div className="justify-start text-xs font-medium  uppercase leading-normal tracking-tight">{formatTotalDuration(getTotalDurationInMs(rows))}</div>
                        </div>
                        <div className="inline-flex justify-start items-center gap-[15px]">
                            <div className="justify-start text-xs font-bold  uppercase leading-normal tracking-tight">vacation :</div>
                            <div className="justify-start text-xs font-medium  uppercase leading-normal tracking-tight">00:00</div>
                        </div>
                    </div>
                    <div className="md:inline-flex flex-col justify-center items-start gap-3">
                        <div className="inline-flex justify-start items-center gap-[15px]">
                            <div className="justify-start text-xs font-bold  uppercase leading-normal tracking-tight">Regular :</div>
                            <div className="justify-start text-xs font-medium  uppercase leading-normal tracking-tight">{getTotalRegular(rows)}</div>
                        </div>
                        <div className="inline-flex justify-start items-center gap-[15px]">
                            <div className="justify-start text-xs font-bold  uppercase leading-normal tracking-tight">Holiday :</div>
                            <div className="justify-start text-xs font-medium  uppercase leading-normal tracking-tight">00:00</div>
                        </div>
                    </div>
                    <div className="md:inline-flex flex-col justify-center items-start gap-3">
                        <div className="inline-flex justify-start items-center gap-[15px]">
                            <div className="justify-start text-xs font-bold  uppercase leading-normal tracking-tight">OT : </div>
                            <div className="justify-start text-xs font-medium  uppercase leading-normal tracking-tight">{formatHoursToHrMin(getTotalOT(rows))}</div>
                        </div>
                        <div className="inline-flex justify-start items-center gap-[15px]">
                            <div className="justify-start text-xs font-bold  uppercase leading-normal tracking-tight">sick :</div>
                            <div className="justify-start text-xs font-medium  uppercase leading-normal tracking-tight">00:00</div>
                        </div>
                    </div>
                    <div className="md:inline-flex flex-col justify-center items-start gap-3">
                        <div className="inline-flex justify-start items-center gap-[15px]">
                            <div className="justify-start text-xs font-bold  uppercase leading-normal tracking-tight">Lunch/Break Taken :</div>
                            <div className="justify-start text-xs font-medium  uppercase leading-normal tracking-tight">00:00</div>
                        </div>
                        <div className="inline-flex justify-start items-center gap-[15px]">
                            <div className="justify-start text-xs font-bold  uppercase leading-normal tracking-tight">others :</div>
                            <div className="justify-start text-xs font-medium  uppercase leading-normal tracking-tight">00:00</div>
                        </div>
                    </div>
                    <div className="md:inline-flex flex-col justify-center items-start gap-3">
                        <div className="inline-flex justify-start items-center gap-[15px]">
                            <div className="justify-start text-xs font-bold  uppercase leading-normal tracking-tight">Lunch/Break Paid :</div>
                            <div className="justify-start text-xs font-medium  uppercase leading-normal tracking-tight">00:00</div>
                        </div>
                        <div className="inline-flex justify-start items-center gap-[15px]">
                            <div className="justify-start text-xs font-bold  uppercase leading-normal tracking-tight">Total amount :</div>
                            <div className="justify-start text-xs font-medium  uppercase leading-normal tracking-tight">00:00</div>
                        </div>
                    </div>
                    <div className="md:inline-flex flex-col justify-center items-start gap-3">
                        <div className="inline-flex justify-start items-center gap-[15px]">
                            <div className="justify-start text-xs font-bold  uppercase leading-normal tracking-tight">OOS :</div>
                            <div className="justify-start text-xs font-medium  uppercase leading-normal tracking-tight">00:00</div>
                        </div>
                        <div className="inline-flex justify-start items-center gap-[15px]">
                            <div className="justify-start text-xs font-bold  uppercase leading-normal tracking-tight">OOS :</div>
                            <div className="justify-start text-xs font-medium  uppercase leading-normal tracking-tight">00:00</div>
                        </div>
                    </div>
                </div>
            </div>
            {showPdfContent && (
                <div className='absolute top-0 left-0 z-[-1] w-[180vh] opacity-0'>
                    <DetailedPDFTable data={rows} companyInfo={companyInfo} startDate={watch("startDate")} endDate={watch("endDate")} />
                </div>
            )}
        </>
    )
}

const mapDispatchToProps = {
    handleSetTitle,
    setAlert
};

export default connect(null, mapDispatchToProps)(TimeCard);


// const generatePDF = async () => {
//     setLoadingPdf(true)
//     const element = document.getElementById("table-container");
//     if (!element) return;

//     const tables = element.getElementsByTagName("table");
//     const pdf = new jsPDF("p", "mm", "a4");

//     let yPos = 20; // Initial Y position
//     pdf.text("In-Out Report", 105, 15, { align: "center" });

//     for (let index = 0; index < tables.length; index++) {
//         const table = tables[index];

//         // Convert each table to an image
//         const canvas = await html2canvas(table, {
//             scale: 2,
//             useCORS: true,
//         });

//         const imgData = canvas.toDataURL("image/png");
//         const imgWidth = 190; // Fit within A4 width (210mm - 10mm margins)
//         const imgHeight = (canvas.height * imgWidth) / canvas.width;

//         // Check if a new page is needed
//         if (yPos + imgHeight > 280) {
//             pdf.addPage();
//             yPos = 10; // Reset Y position on new page
//         }

//         pdf.addImage(imgData, "PNG", 10, yPos, imgWidth, imgHeight);
//         yPos += imgHeight + 10; // Move position down
//     }

//     pdf.save("report.pdf");
//     setLoadingPdf(false)
// };

// const generateExcel = async () => {
//     setLoadingExcel(true)
//     let params = new URLSearchParams();
//     if (userInfo?.roleId !== 1) {
//         params.append("userIds", userInfo?.employeeId);
//     } else {
//         if (watch("selectedUserId") && watch("selectedUserId").length > 0) {
//             watch("selectedUserId").forEach(id => params.append("userIds", id)); // append multiple userIds
//         }
//     }
//     if (watch("startDate")) params.append("startDate", watch("startDate"));
//     if (watch("endDate")) {
//         const endDate = new Date(watch("endDate"));
//         const today = new Date();
//         if (endDate.toDateString() === today.toDateString()) {
//             params.append("endDate", convertToDesiredFormat(new Date()));
//         } else {
//             endDate.setHours(23, 59, 59, 999);
//             params.append("endDate", convertToDesiredFormat(endDate));
//         }
//     }

//     let userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
//     if (userTimeZone === "Asia/Kolkata") {
//         userTimeZone = "Asia/Calcutta";
//     }
//     params.append("timeZone", userTimeZone);
//     try {
//         const response = await axios.get(`${userInOutURL}/generateExcelReport?${params.toString()}`, {
//             responseType: "blob",
//             headers: {
//                 Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
//             },
//         });

//         if (response.status !== 200) throw new Error("Failed to generate report");

//         // Convert response to Blob and create a download link
//         const blob = new Blob([response.data], { type: response.headers["content-type"] });
//         const url = window.URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = "InOutReport.xlsx";
//         document.body.appendChild(a);
//         a.click();
//         document.body.removeChild(a);
//         setLoadingExcel(false)
//     } catch (error) {
//         console.error("Error:", error);
//         setLoadingExcel(false)
//     }
// };


{/* <div className='flex justify-end items-center gap-4 my-2 py-3'>
                        <div className='w-80 flex justify-end items-center gap-4'>
                            <Button type={`button`} useFor={'success'} text={'Download Excel'} isLoading={loadingExcel} onClick={generateExcel} />
                            <Button type={`button`} useFor='error' text={'Download PDF'} isLoading={loadingPdf} onClick={generatePDF} />
                        </div>
                    </div>

                    <div className='max-h-[400px] overflow-x-auto'>
                        <ReportTable data={reportData} tableRef={tableRef} startDay={watch("startDate")} endDay={watch("endDate")} />
                    </div> */}


// const handleGetPaginationRecords = async () => {
//     let params = new URLSearchParams();
//     if (userInfo?.roleId !== 1) {
//         params.append("userIds", userInfo?.employeeId);
//     } else {
//         if (watch("selectedUserId") && watch("selectedUserId").length > 0) {
//             watch("selectedUserId").forEach(id => params.append("userIds", id));
//         }
//     }
//     if (watch("startDate")) params.append("startDate", watch("startDate"));
//     if (watch("endDate")) {
//         const endDate = new Date(watch("endDate"));
//         const today = new Date();
//         if (endDate.toDateString() === today.toDateString()) {
//             params.append("endDate", convertToDesiredFormat(new Date()));
//         } else {
//             endDate.setHours(23, 59, 59, 999);
//             params.append("endDate", convertToDesiredFormat(endDate));
//         }
//     }

//     let userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
//     if (userTimeZone === "Asia/Kolkata") {
//         userTimeZone = "Asia/Calcutta";
//     }
//     params.append("timeZone", userTimeZone);

//     try {
//         const res = await getAllEntriesWithFilter(params);
//         setReportData(res?.data?.result?.data || []);
//     } catch (error) {
//         console.error("Error fetching data:", error);
//     }
// };