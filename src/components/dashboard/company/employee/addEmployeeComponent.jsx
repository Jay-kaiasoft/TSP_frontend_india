import React, { useEffect, useRef, useState } from 'react'
import { ReactComponent as User } from "../../../../assets/svgs/user-alt.svg";
import { Controller, useForm } from 'react-hook-form';
import { createEmployee, deleteEmployeeAadharImage, deleteEmployeeImage, getCompanyEmployee, updateEmployee, uploadEmployeeAadharImage, uploadEmployeeImage } from '../../../../service/companyEmployee/companyEmployeeService';
import { useNavigate, useParams } from 'react-router-dom';
import { connect } from 'react-redux';
import { handleSetTitle, setAlert } from '../../../../redux/commonReducers/commonReducers';
import { uploadFiles } from '../../../../service/common/commonService';
import { getAllCompanyRole } from '../../../../service/companyEmployeeRole/companyEmployeeRoleService';
import Button from '../../../common/buttons/button';
import CustomIcons from '../../../common/icons/CustomIcons';
import Input from '../../../common/input/input';
import Select from '../../../common/select/select';
import Stapper from '../../../common/stapper/stapper';
import DatePickerComponent from '../../../common/datePickerComponent/datePickerComponent';
import { createEmployeeBankInfo, deletePassbookImage, getEmployeeBankInfo, updateEmployeeBankInfo, uploadPassbookImage } from '../../../../service/employeeBackAccountInfo/employeeBackAccountInfoService';
import { getAllDepartment } from '../../../../service/department/departmentService';
import { getAllEmployeeType } from '../../../../service/employeeType/employeeTypeService';
import dayjs from 'dayjs';
import { useTheme } from '@mui/material';
import { getAllShifts } from '../../../../service/companyShift/companyShiftService';
import { getAllCountry } from '../../../../service/country/countryService';
import { getAllStateByCountry } from '../../../../service/state/stateService';
import { getAllActiveLocationsByCompanyId } from '../../../../service/location/locationService';
import SelectMultiple from '../../../common/select/selectMultiple';
import AlertDialog from '../../../common/alertDialog/alertDialog';
import Switch from '../../../common/switch/Switch';
import FaceRegistration from '../../../models/faceRegistration/faceRegistration';
import axios from 'axios';
import { faceRecognitionAPIBaseURL } from '../../../../config/apiConfig/apiConfig';
import FileInputBox from '../../../common/fileInput/FileInputBox';
import Checkbox from '../../../common/checkBox/checkbox';
import { getRowsStateFromCache } from '@mui/x-data-grid/hooks/features/rows/gridRowsUtils';

const GenderOptions = [
    { id: 1, title: "Male" },
    { id: 2, title: "Female" }
]

const statusOptions = [
    { id: 1, title: "Active" },
    { id: 2, title: "Deactive" }
]

const accountTypeOptions = [
    { id: 1, title: "Current" },
    { id: 2, title: "Savings" },
]

const depositDistributionOptions = [
    { id: 1, title: "Fixed Amount" },
    { id: 2, title: "Percentage" },
    { id: 3, title: "Remainder" },
    { id: 4, title: "Split Evenly" },
    { id: 5, title: "Custom Rule" },
]

const payScheduleOptions = [
    { id: 1, title: "Weekly" },
    { id: 2, title: "Half-Monthly" },
    { id: 3, title: "Monthly" },
    { id: 4, title: "Yearly" },
]

const AddEmployeeComponent = ({ setAlert, handleSetTitle }) => {
    const { isContractor, companyId, id } = useParams();
    const navigate = useNavigate();
    const theme = useTheme()
    const userInfo = JSON.parse(localStorage.getItem("userInfo"))

    const [steps, setSteps] = useState([
        "Employee Info",
        "Employment Info",
        "PayRoll Info",
        "Direact Deposite",
        "Face Registration"
    ])

    const [countryData, setCountryData] = useState([])
    const [stateData, setStateData] = useState([])
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const [formDataFile, setFormDataFile] = useState(null)
    const [formDataFileAadhar, setFormDataFileAadhar] = useState(null)
    const [bankPassbookImage, setBankPassbookImage] = useState(null);

    const [roles, setRoles] = useState([])
    const [departments, setDepartments] = useState([]);
    const [employeeType, setEmployeeType] = useState([]);
    const [shifts, setShifts] = useState([]);

    const [activeStep, setActiveStep] = useState(0)
    const [activeTaxStep, setActiveTaxStep] = useState(0)
    const [locations, setLocations] = useState([])
    const [dialog, setDialog] = useState({ open: false, title: '', message: '', actionButtonText: '' });
    const [showFaceRegistration, setShowFaceRegistration] = useState(false);
    const [dialogFaceRegistration, setDialogFaceRegistration] = useState({ open: false, title: '', message: '', actionButtonText: '' });
    const {
        handleSubmit,
        control,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm({
        defaultValues: {
            employeeId: "",
            profileImage: "",
            userName: "",
            firstName: "",
            middleName: "",
            lastName: "",
            dob: new Date(),
            email: "",
            phone: "",
            password: "",
            roleId: '',
            shiftId: '',
            companyId: "",
            hourlyRate: "",
            gender: "",
            city: "",
            state: "",
            country: "",
            address1: "",
            address2: "",
            zipCode: "",
            bloodGroup: "",
            aadharImage: "",

            companyLocation: [],
            emergencyContact: "",
            contactPhone: "",
            relationship: "",
            departmentId: "",
            contractorId: "",
            employeeTypeId: "",
            payPeriod: "",
            hiredDate: new Date(),
            isActive: 1,
            isContractor: parseInt(isContractor),
            workState: "",
            workLocation: "",
            checkGeofence: true,
            isPf: false,
            pfPercentage: 0,
            pfAmount: 0,
            isPt: false,
            ptAmount: 0,
            basicSalary: "",
            grossSalary: "",

            accountId: "",
            accountType: "",
            ifscCode: "",
            branch: "",
            bankName: "",
            accountNumber: "",
            confirmAccountNumber: "",
            address: "",
            passbookImage: "",
        },
    });

    const handleOpenFaceRegistrationDialog = () => {
        setDialogFaceRegistration({
            open: true,
            title: 'Delete Registered Face',
            message: 'Are you sure, Do you want to delete registered face?',
            actionButtonText: 'Delete',
        });
    }

    const handleCloseFaceRegistrationDialog = () => {
        setDialogFaceRegistration({
            open: false,
            title: '',
            message: '',
            actionButtonText: ''
        });
    }

    const handleDeleteFaceRegistration = async () => {
        setLoading(true);
        const response = await axios.delete(`${faceRecognitionAPIBaseURL}/clear-embedding/${id}`);
        if (response.status === 200) {
            setLoading(false);
            setAlert({ open: true, message: response.data.message, type: "success" });
            handleCloseFaceRegistrationDialog();
        } else {
            setLoading(false);
            setAlert({ open: true, message: response.data.message, type: "error" });
        }
    }

    const handleOpenFaceRegistration = () => {
        setShowFaceRegistration(true);
    }

    const handleCloseFaceRegistration = () => {
        setShowFaceRegistration(false);
    }

    const handleCloseDialog = () => {
        handleSetTitle("Manage Employees")
        navigate("/dashboard/manageemployees")
        setDialog({
            open: false,
            title: '',
            message: '',
            actionButtonText: ''
        })
    }

    const handleOpenDialog = () => {
        if (shifts?.length === 0) {
            setDialog({
                open: true,
                title: 'Cannot Create OR Update Employee',
                message: 'Please add at least one shift before creating a new employee.',
                actionButtonText: 'Create Shift',
            });
            return
        }
        if (departments?.length === 0) {
            setDialog({
                open: true,
                title: 'Cannot Create OR Update Employee',
                message: 'Please add at least one department before creating a new employee.',
                actionButtonText: 'Create Department',
            });
        }
    }

    const handleCreateShift = () => {
        if (shifts?.length === 0) {
            handleSetTitle("Manage Shifts")
            navigate("/dashboard/manageshifts")
        }
        if (departments?.length === 0) {
            handleSetTitle("Departments")
            navigate("/dashboard/department")
        }
    }

    const togglePasswordVisibility = () => {
        setIsPasswordVisible((prev) => !prev);
    };

    const handleBackToManageEmployee = () => {
        handleSetTitle("Manage Employees")
        navigate("/dashboard/manageemployees")
    }

    const handleBack = () => {
        if (activeStep === 0) {
            handleBackToManageEmployee()
        }
        else if (activeStep === 3) {
            if (activeTaxStep !== 0) {
                setActiveTaxStep((prev) => prev - 1)
            } else {
                setActiveStep((prev) => prev - 1)
            }
        }
        else {
            setActiveStep((prev) => prev - 1)
        }
    }

    const handleGetEmployee = async () => {
        if (id) {
            handleSetTitle("Update Employee")
            const res = await getCompanyEmployee(id);
            if (res?.data?.status === 200) {
                reset(res?.data?.result);
                setValue("gender", res?.data?.result?.gender === "Male" ? 1 : (res?.data?.result?.gender !== "" && res?.data?.result?.gender !== null) ? 2 : "")
                setValue("companyLocation", res?.data?.result?.companyLocation ? JSON.parse(res?.data?.result?.companyLocation) : [])
            }
            if (res?.data?.result?.bankAccountId) {
                const response = await getEmployeeBankInfo(res?.data?.result?.bankAccountId)
                if (response?.data?.status === 200) {
                    setValue("accountId", res?.data?.result?.bankAccountId)
                    // setValue("accountId", response?.data?.result?.id)
                    setValue("ifscCode", response?.data?.result?.ifscCode)
                    setValue("branch", response?.data?.result?.branch || "")
                    setValue("bankName", response?.data?.result?.bankName)
                    setValue("accountNumber", response?.data?.result?.accountNumber)
                    setValue("confirmAccountNumber", response?.data?.result?.accountNumber)
                    setValue("passbookImage", response?.data?.result?.passbookImage || "")
                    setValue("address", response?.data?.result?.address || "")
                    setValue("accountType", accountTypeOptions?.filter((row) => row?.title === response?.data?.result?.accountType)?.[0]?.id || null)
                }
            }
        } else {
            handleSetTitle("Add Employee")
        }
    }

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setFormDataFile(file)
            setValue("profileImage", URL.createObjectURL(file));
        }
    }

    const handleImageChangeAadhar = (event) => {
        if (event) {
            setFormDataFileAadhar(event)
            setValue("aadharImage", URL.createObjectURL(event));
        }
    }

    const handleImageChangePassbook = (event) => {
        if (event) {
            setBankPassbookImage(event)
            setValue("passbookImage", URL.createObjectURL(event));
        }
    }

    const handleUploadPassbookImage = (companyId, bankId) => {
        if (!bankPassbookImage) {
            return
        } else {
            const formData = new FormData();
            formData.append("files", bankPassbookImage);
            formData.append("folderName", `employeeProfile/bank/${bankId}`);
            formData.append("userId", companyId);

            uploadFiles(formData).then((res) => {
                if (res.data.status === 200) {
                    const { imageURL } = res?.data?.result[0];
                    uploadPassbookImage({ bank: imageURL, companyId: companyId, bankId: bankId }).then((res) => {
                        if (res.data.status !== 200) {
                            setAlert({ open: true, message: res?.data?.message, type: "error" })
                        } else {
                            return
                        }
                    })
                } else {
                    setAlert({ open: true, message: res?.data?.message, type: "error" })
                    setLoading(false)
                }
            });
        }
    }

    const handleUploadAadharImage = (companyId, id) => {
        if (!formDataFileAadhar) {
            return
        } else {
            const formData = new FormData();
            formData.append("files", formDataFileAadhar);
            formData.append("folderName", `employeeProfile/aadharImage/${id}`);
            formData.append("userId", companyId);

            uploadFiles(formData).then((res) => {
                if (res.data.status === 200) {
                    const { imageURL } = res?.data?.result[0];
                    uploadEmployeeAadharImage({ employee: imageURL, companyId: companyId, employeeId: id }).then((res) => {
                        if (res.data.status !== 200) {
                            setAlert({ open: true, message: res?.data?.message, type: "error" })
                        } else {
                            return
                        }
                    })
                } else {
                    setAlert({ open: true, message: res?.data?.message, type: "error" })
                    setLoading(false)
                }
            });
        }
    }

    const handleUploadImage = (companyId, id) => {
        if (!formDataFile) {
            setActiveStep((prev) => prev + 1)
            return
        } else {
            const formData = new FormData();
            formData.append("files", formDataFile);
            formData.append("folderName", `employeeProfile/${id}`);
            formData.append("userId", companyId);

            uploadFiles(formData).then((res) => {
                if (res.data.status === 200) {
                    const { imageURL } = res?.data?.result[0];
                    uploadEmployeeImage({ employee: imageURL, companyId: companyId, employeeId: id }).then((res) => {
                        if (res.data.status !== 200) {
                            setAlert({ open: true, message: res?.data?.message, type: "error" })
                        } else {
                            setActiveStep((prev) => prev + 1)
                            return
                        }
                    })
                } else {
                    setAlert({ open: true, message: res?.data?.message, type: "error" })
                    setLoading(false)
                }
            });
        }
    }

    const handleDeleteImage = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (id && formDataFile === null) {
            const response = await deleteEmployeeImage(companyId, id);
            if (response.data.status === 200) {
                setValue("profileImage", "");
                setFormDataFile(null);
            } else {
                setAlert({ open: true, message: response.data.message, type: "error" })
            }
        } else {
            setValue("profileImage", "");
            setFormDataFile(null);
        }
    }

    const handleDeleteAadharImage = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (id && formDataFileAadhar === null) {
            const response = await deleteEmployeeAadharImage(companyId, id);
            if (response.data.status === 200) {
                setValue("aadharImage", "");
                setFormDataFileAadhar(null);
            } else {
                setAlert({ open: true, message: response.data.message, type: "error" })
            }
        } else {
            setValue("aadharImage", "");
            setFormDataFileAadhar(null);
        }
    }

    const handleDeletePassbookImage = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (watch("accountId") && bankPassbookImage === null) {
            const response = await deletePassbookImage(companyId, watch("accountId"));
            if (response.data.status === 200) {
                setValue("passbookImage", "");
                setBankPassbookImage(null);
            } else {
                setAlert({ open: true, message: response.data.message, type: "error" })
            }
        } else {
            setValue("passbookImage", "");
            setBankPassbookImage(null);
        }
    }

    const handleDivClick = () => {
        fileInputRef.current.click();
    };

    const handleGetEmployeeRoles = async () => {
        if (companyId) {
            const res = await getAllCompanyRole(companyId)
            if (res?.data?.status === 200) {
                const data = res?.data?.result?.map((item) => {
                    return {
                        title: item?.roleName,
                        id: item?.roleId
                    }
                })
                setRoles(data)
            }
        }
    }

    const handleGetCompanyLocations = async () => {
        if (companyId) {
            const res = await getAllActiveLocationsByCompanyId(companyId)
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

    const handleGetAllDepartment = async () => {
        const response = await getAllDepartment(userInfo?.companyId)
        if (response?.data?.result?.length === 0) {
            setDepartments([]);
            handleOpenDialog();
            return;
        }
        const data = response?.data?.result?.map((item) => {
            return {
                id: item.id,
                title: item.departmentName
            }
        })
        setDepartments(data)
    }

    const handleGetAllUserType = async () => {
        const res = await getAllEmployeeType()
        const data = res?.data?.result?.map((item) => {
            return {
                id: item.id,
                title: item.name
            }
        })
        setEmployeeType(data)
    }

    const handleGetAllShift = async () => {
        const res = await getAllShifts(companyId);
        if (res?.data?.result?.length === 0) {
            setShifts([]);
            handleOpenDialog();
            return;
        }
        const data = res?.data?.result?.map((item) => {
            const isHourly = item?.shiftType === "Hourly";
            const timeFormat = "hh:mm A";

            const timeDisplay = isHourly
                ? `${item.totalHours} hrs`
                : `${dayjs(item?.timeStart).format(timeFormat)} - ${dayjs(item?.timeEnd).format(timeFormat)}`;

            return {
                id: item.id,
                title: `${item.shiftName} (${item.shiftType} - ${timeDisplay})`,
            };
        });

        setShifts(data);
    };

    const handleGetAllCountrys = async () => {
        const res = await getAllCountry()
        const data = res?.data?.result?.map((item) => {
            return {
                id: item.id,
                title: item.cntName
            }
        })
        setCountryData(data)
    }

    const handleGetAllStatesByCountryId = async (id) => {
        const res = await getAllStateByCountry(id)
        const data = res?.data?.result?.map((item) => {
            return {
                ...item,
                id: item.id,
                title: item.stateLong
            }
        })
        setStateData(data)

        if (watch("state")) {
            const selectedState = data?.filter((row) => row?.title === watch("state"))?.[0] || null
            setValue("state", selectedState?.title)
        }
    }

    const submit = async (data, submitType) => {
        const saveAndExit = submitType === "saveAndExit";
        const newData = {
            ...data,
            companyId: companyId,
            employeeId: id || watch("employeeId"),
            isContractor: parseInt(isContractor),
            gender: parseInt(watch("gender")) === 1 ? "Male" : watch("gender") !== null ? "Female" : "",
            accountType: accountTypeOptions?.filter((row) => row?.id === watch("accountType"))?.[0]?.title || null,
            depositDistribution: depositDistributionOptions?.filter((row) => row?.id === watch("depositDistribution"))?.[0]?.title || null,
            hiredDate: dayjs(watch("hiredDate")).isValid()
                ? dayjs(watch("hiredDate")).format("MM/DD/YYYY")
                : watch("hiredDate"),
            dob: dayjs(watch("dob")).isValid()
                ? dayjs(watch("dob")).format("MM/DD/YYYY")
                : watch("dob"),
            date: dayjs(watch("date")).isValid()
                ? dayjs(watch("date")).format("MM/DD/YYYY")
                : watch("date"),

            companyLocation: watch("companyLocation")?.length > 0 ? JSON.stringify(watch("companyLocation")) : null,
            checkGeofence: data.checkGeofence ? 1 : 0,
        }
        if (activeStep === 2) {
            if (id) {
                const res = await updateEmployee(id, newData)
                if (res.data?.status === 200) {
                    setValue("employeeId", res?.data?.result?.employeeId)
                    handleUploadAadharImage(companyId, res?.data?.result?.employeeId)
                    handleUploadImage(companyId, res?.data?.result?.employeeId)
                    if (saveAndExit) {
                        handleSetTitle("Manage Employees")
                        navigate("/dashboard/manageemployees")
                        return
                    }
                } else {
                    setAlert({ open: true, message: res?.data?.message, type: "error" })
                    return
                }
            }
            else {
                const res = await createEmployee(newData)
                if (res.data?.status === 201) {
                    setValue("employeeId", res?.data?.result?.employeeId)
                    handleUploadAadharImage(companyId, res?.data?.result?.employeeId)
                    handleUploadImage(companyId, res?.data?.result?.employeeId)
                } else {
                    setActiveStep((prev) => prev + 1)
                }
            }
        }
        else if (activeStep === 3) {
            if (watch("accountId")) {
                const response = await updateEmployeeBankInfo(watch("accountId"), { ...newData, employeeId: id || watch("employeeId") })
                if (response?.data?.status === 200) {
                    handleUploadPassbookImage(companyId, watch("accountId"))
                    handleSetTitle("Manage Employees")
                    navigate("/dashboard/manageemployees")
                    return
                }
                else {
                    setAlert({ open: true, message: response?.data?.message, type: "error" })
                    return
                }
            } else {
                const response = await createEmployeeBankInfo({ ...newData, employeeId: id || watch("employeeId") })
                if (response?.data?.status === 201) {
                    setValue("accountId", response?.data?.result?.id)
                    handleUploadPassbookImage(companyId, response?.data?.result?.id)
                    setActiveStep((prev) => prev + 1)
                } else {
                    setAlert({ open: true, message: response?.data?.message, type: "error" })
                    return
                }
            }
        }
        else {
            setActiveStep((prev) => prev + 1)
        }
    }

    useEffect(() => {
        if (parseInt(isContractor) === 1) {
            const updatedSteps = steps.filter(step => step !== "Tax Info");
            setSteps(updatedSteps)
        }
        if (id) {
            const updatedSteps = steps.filter(step => step !== "Face Registration");
            setSteps(updatedSteps)
        }
    }, [])

    useEffect(() => {
        handleGetAllCountrys()
        handleGetEmployee();
        handleGetAllUserType()
        handleGetAllDepartment()
        handleGetAllShift()
    }, [id])

    useEffect(() => {
        handleGetCompanyLocations()
        handleGetEmployeeRoles();
    }, [companyId])

    useEffect(() => {
        if (countryData?.length > 0 && watch("country")) {
            handleGetAllStatesByCountryId(countryData?.filter((item) => item.title === watch("country"))?.[0]?.id)
        }
    }, [countryData])

    return (
        <div className='px-3 lg:px-0'>
            <div className='border rounded-lg bg-white lg:w-full p-5'>
                <div className='flex justify-start items-start gap-6 relative'>
                    <div className='hidden self-stretch p-3 md:inline-flex flex-col justify-start items-start gap-2'>
                        <div className='xl:w-64'>
                            <Stapper steps={steps} activeStep={activeStep} orientation={`vertical`} labelFontSize="16px" />
                        </div>
                    </div>

                    <div className='py-3 xl:w-[800px] xl:px-24'>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault(); // prevent native submission
                                const submitter = e.nativeEvent.submitter;
                                const submitType = submitter?.getAttribute("data-value"); // Will be "next" or "saveAndExit"
                                handleSubmit((data) => submit(data, submitType))(e); // Pass the value manually
                            }}
                            noValidate
                        >
                            {
                                activeStep === 0 && (
                                    <>
                                        <div className='mb-2 font-medium text-center text-[28px] text-[#262B43]'>
                                            <p style={{ color: theme.palette.primary.text.main, }}>Employee Info</p>
                                        </div>

                                        <div className="flex items-center justify-center">
                                            <div
                                                className="h-28 w-28 md:h-28 md:w-28 border rounded-full flex items-center justify-center  cursor-pointer relative"
                                                onClick={handleDivClick}
                                            >
                                                {watch("profileImage") ? (
                                                    <img
                                                        src={watch("profileImage")}
                                                        alt="Preview"
                                                        className="h-full w-full object-cover rounded-full"
                                                    />
                                                ) : (
                                                    <div className="flex justify-center items-center h-full w-full">
                                                        <User height={60} width={60} fill="#CED4DA" />
                                                    </div>
                                                )}
                                                {watch("profileImage") && (
                                                    <div className='absolute -top-2 right-0 h-6 w-6 flex justify-center items-center rounded-full border border-red-500 bg-red-500'>
                                                        <div onClick={(e) => handleDeleteImage(e)}>
                                                            <CustomIcons iconName={'fa-solid fa-xmark'} css='cursor-pointer text-white' />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <input
                                                type="file"
                                                accept="image/png, image/jpeg"
                                                ref={fileInputRef}
                                                className="hidden"
                                                onChange={handleImageChange}
                                            />
                                        </div>

                                        <div className='mb-6 text-base font-medium leading-snug text-[#262B43]'>
                                            <p style={{ color: theme.palette.primary.text.main, }}>Legal Information</p>
                                        </div>

                                        <div className='grid grid-cols-2 lg:grid-cols-2 gap-6'>
                                            <div className='col-span-2'>
                                                <Controller
                                                    name="firstName"
                                                    control={control}
                                                    rules={{
                                                        required: "First name is required",
                                                    }}
                                                    render={({ field }) => (
                                                        <Input
                                                            {...field}
                                                            label="First Name"
                                                            type={`text`}
                                                            error={errors?.firstName}
                                                            onChange={(e) => {
                                                                field.onChange(e);
                                                            }}
                                                        />
                                                    )}
                                                />
                                            </div>

                                            <div>
                                                <Controller
                                                    name="middleName"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Input
                                                            {...field}
                                                            label="Middle Name"
                                                            type={`text`}
                                                            onChange={(e) => {
                                                                field.onChange(e);
                                                            }}
                                                        />
                                                    )}
                                                />
                                            </div>

                                            <div className='col-span-3'>
                                                <Controller
                                                    name="lastName"
                                                    control={control}
                                                    rules={{
                                                        required: "Last name is required",
                                                    }}
                                                    render={({ field }) => (
                                                        <Input
                                                            {...field}
                                                            label="Last Name"
                                                            type={`text`}
                                                            error={errors?.lastName}
                                                            onChange={(e) => {
                                                                field.onChange(e);
                                                            }}
                                                        />
                                                    )}
                                                />
                                            </div>
                                        </div>

                                        <div className='grid grid-cols-2 lg:grid-cols-2 gap-6 my-6'>
                                            <div>
                                                <Controller
                                                    name="gender"
                                                    control={control}
                                                    rules={{
                                                        required: "Gender is required"
                                                    }}
                                                    render={({ field }) => (
                                                        <Select
                                                            options={GenderOptions}
                                                            label={"Gender"}
                                                            placeholder="Select gender"
                                                            value={parseInt(watch("gender")) || null}
                                                            onChange={(_, newValue) => {
                                                                if (newValue?.id) {
                                                                    field.onChange(newValue.id);
                                                                } else {
                                                                    setValue("gender", null);
                                                                }
                                                            }}
                                                            error={errors?.gender}
                                                        />
                                                    )}
                                                />
                                            </div>

                                            <div>
                                                <DatePickerComponent setValue={setValue} control={control} name='dob' label={`Birth Date`} minDate={null} maxDate={new Date()} />
                                            </div>

                                            <div>
                                                <Controller
                                                    name="userName"
                                                    control={control}
                                                    rules={{
                                                        required: "Username is required",
                                                    }}
                                                    render={({ field }) => (
                                                        <Input
                                                            {...field}
                                                            label="User Name"
                                                            type={`text`}
                                                            error={errors?.userName}
                                                            onChange={(e) => {
                                                                field.onChange(e);
                                                            }}
                                                        />
                                                    )}
                                                />
                                            </div>

                                            <div>
                                                <Controller
                                                    name="password"
                                                    control={control}
                                                    rules={{ required: "Pin is required" }}
                                                    render={({ field }) => (
                                                        <Input
                                                            {...field}
                                                            label="Pin"
                                                            type={isPasswordVisible ? 'text' : 'password'}
                                                            error={errors?.password}
                                                            onChange={(e) => {
                                                                field.onChange(e);
                                                                // validatePassword(e.target.value);
                                                            }}
                                                            // onFocus={(e) => {
                                                            //     setShowPasswordRequirement(true)
                                                            // }}
                                                            // onBlur={(e) => {
                                                            //     setShowPasswordRequirement(false)
                                                            // }}

                                                            endIcon={
                                                                <span
                                                                    onClick={togglePasswordVisibility}
                                                                    style={{ cursor: 'pointer', color: 'white' }}
                                                                >
                                                                    {isPasswordVisible ? (
                                                                        <CustomIcons iconName={'fa-solid fa-eye'} css='cursor-pointer text-black' />
                                                                    ) : (
                                                                        <CustomIcons iconName={'fa-solid fa-eye-slash'} css='cursor-pointer text-black' />
                                                                    )}
                                                                </span>
                                                            }
                                                        />
                                                    )}
                                                />
                                            </div>

                                            <div>
                                                <Controller
                                                    name="bloodGroup"
                                                    control={control}
                                                    rules={{
                                                        validate: (value) => {
                                                            if (value !== "" && value !== undefined && value !== null) {
                                                                const upper = value.toUpperCase();
                                                                return /^(A|B|AB|O)[+-]$/.test(upper) || 'Enter a valid blood group (e.g., A+, B-, AB+, O+, O-)';
                                                            }
                                                        },
                                                    }}
                                                    render={({ field }) => (
                                                        <Input
                                                            {...field}
                                                            label="Blood Group"
                                                            type="text"
                                                            error={errors?.bloodGroup}
                                                            onChange={(e) => {
                                                                if (e.target.value !== "" && e.target.value !== null && e.target.value !== undefined) {
                                                                    const upperValue = e.target.value.toUpperCase();
                                                                    field.onChange(upperValue);
                                                                }
                                                            }}
                                                            onFocus={(e) => {
                                                                if (e.target.value !== "" && e.target.value !== null && e.target.value !== undefined) {
                                                                    const upperValue = e.target.value.toUpperCase();
                                                                    field.onChange(upperValue);
                                                                }
                                                            }}
                                                        />
                                                    )}
                                                />
                                            </div>

                                            {
                                                (watch("embedding") && id) ? (
                                                    <div className='flex items-center justify-start'>
                                                        <Button useFor='error' text={'Delete Registered Face'} onClick={handleOpenFaceRegistrationDialog} />
                                                    </div>
                                                ) : id ? (
                                                    <div className='flex items-center justify-start'>
                                                        <Button text={'Set Face Registration'} onClick={handleOpenFaceRegistration} />
                                                    </div>
                                                ) : null
                                            }

                                            <div className='grid col-span-2'>
                                                <FileInputBox
                                                    onFileSelect={handleImageChangeAadhar}
                                                    onRemove={handleDeleteAadharImage}
                                                    value={watch("aadharImage")}
                                                    text="Click in this area to upload aadhar image"
                                                />
                                            </div>
                                        </div>

                                        <div className='my-6 text-base font-medium leading-snug font-["Inter"] text-[#262B43]'>
                                            <p style={{ color: theme.palette.primary.text.main, }}>Home Address Information</p>
                                        </div>

                                        <div>
                                            <Controller
                                                name="address1"
                                                rules={{
                                                    required: "Address1 is required",
                                                }}
                                                control={control}
                                                render={({ field }) => (
                                                    <Input
                                                        {...field}
                                                        label="Current Address"
                                                        type={`text`}
                                                        error={errors?.address1}
                                                        onChange={(e) => {
                                                            field.onChange(e);
                                                        }}
                                                    />
                                                )}
                                            />
                                        </div>

                                        <div className='my-6'>
                                            <Controller
                                                name="address2"
                                                control={control}
                                                render={({ field }) => (
                                                    <Input
                                                        {...field}
                                                        label="Permanent Address"
                                                        type={`text`}
                                                        onChange={(e) => {
                                                            field.onChange(e);
                                                        }}
                                                    />
                                                )}
                                            />
                                        </div>

                                        <div className='grid grid-cols-2 lg:grid-cols-2 gap-6'>
                                            <div>
                                                <Controller
                                                    name="city"
                                                    control={control}
                                                    rules={{
                                                        required: "City is required"
                                                    }}
                                                    render={({ field }) => (
                                                        <Input
                                                            {...field}
                                                            label="City"
                                                            type={`text`}
                                                            error={errors?.city}
                                                            onChange={(e) => {
                                                                field.onChange(e);
                                                            }}
                                                        />
                                                    )}
                                                />
                                            </div>

                                            <div>
                                                <Controller
                                                    name="country"
                                                    control={control}
                                                    rules={{
                                                        required: "Country is required"
                                                    }}
                                                    render={({ field }) => (
                                                        <Select
                                                            options={countryData}
                                                            label={"Country"}
                                                            placeholder="Select country"
                                                            value={countryData?.filter((row) => row.title === watch("country"))?.[0]?.id || null}
                                                            onChange={(_, newValue) => {
                                                                if (newValue?.id) {
                                                                    field.onChange(newValue.title);
                                                                    handleGetAllStatesByCountryId(newValue.id);
                                                                } else {
                                                                    setValue("country", null);
                                                                }
                                                            }}
                                                            error={errors?.country}
                                                        />
                                                    )}
                                                />
                                            </div>

                                            <div>
                                                <Controller
                                                    name="state"
                                                    control={control}
                                                    rules={{
                                                        required: "State is required"
                                                    }}
                                                    render={({ field }) => (
                                                        <Select
                                                            disabled={stateData?.length === 0}
                                                            options={stateData}
                                                            label={"State"}
                                                            placeholder="Select state"
                                                            value={stateData?.filter((row) => row.title === watch("state"))?.[0]?.id || null}
                                                            onChange={(_, newValue) => {
                                                                if (newValue?.id) {
                                                                    field.onChange(newValue.title);
                                                                } else {
                                                                    setValue("state", null);
                                                                }
                                                            }}
                                                            error={errors?.state}
                                                        />
                                                    )}
                                                />
                                            </div>

                                            <div>
                                                <Controller
                                                    name="zipCode"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Input
                                                            {...field}
                                                            label="Zip Code"
                                                            type={`text`}
                                                            onChange={(e) => {
                                                                const numericValue = e.target.value.replace(/[^0-9]/g, '');
                                                                field.onChange(numericValue);
                                                            }}
                                                        />
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </>
                                )
                            }
                            {
                                activeStep === 1 && (
                                    <>
                                        <div className='mb-2 font-medium text-center text-[28px] text-[#262B43]'>
                                            <p style={{ color: theme.palette.primary.text.main, }}>Employment Info</p>
                                        </div>

                                        <div className='my-6 text-base font-medium leading-snug text-[#262B43]'>
                                            <p style={{ color: theme.palette.primary.text.main, }}>Contact Information</p>
                                        </div>

                                        <div className='grid grid-row gap-6'>
                                            <div className='grid grid-cols-2 gap-6'>
                                                <div>
                                                    <Controller
                                                        name="email"
                                                        control={control}
                                                        rules={{
                                                            required: watch("email") ? "Email is required" : false,
                                                            pattern: {
                                                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                                message: "Invalid email address",
                                                            },
                                                        }}
                                                        render={({ field }) => (
                                                            <Input
                                                                {...field}
                                                                label="Email"
                                                                type={`text`}
                                                                error={errors?.email}
                                                                onChange={(e) => {
                                                                    field.onChange(e);
                                                                }}
                                                            />
                                                        )}
                                                    />
                                                </div>

                                                <div>
                                                    <Controller
                                                        name="phone"
                                                        control={control}
                                                        rules={{
                                                            required: "Phone is required",
                                                            maxLength: {
                                                                value: 10,
                                                                message: 'Enter valid phone number',
                                                            },
                                                            minLength: {
                                                                value: 10,
                                                                message: 'Enter valid phone number',
                                                            },
                                                        }}
                                                        render={({ field }) => (
                                                            <Input
                                                                {...field}
                                                                label="Phone Number"
                                                                type={`text`}
                                                                error={errors?.phone}
                                                                onChange={(e) => {
                                                                    const numericValue = e.target.value.replace(/[^0-9]/g, '');
                                                                    field.onChange(numericValue);
                                                                }}
                                                            />
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className='my-6 text-base font-medium leading-snug text-[#262B43]'>
                                            <p style={{ color: theme.palette.primary.text.main, }}>Hiring Information</p>
                                        </div>

                                        <div className='grid grid-cols-2 gap-6'>
                                            <div>
                                                <DatePickerComponent setValue={setValue} control={control} name='hiredDate' label={`Hire Date`} minDate={null} maxDate={new Date()} />
                                            </div>

                                            <div>
                                                <Controller
                                                    name="isActive"
                                                    control={control}
                                                    rules={{
                                                        required: "Status is required"
                                                    }}
                                                    render={({ field }) => (
                                                        <Select
                                                            options={statusOptions}
                                                            label="Status"
                                                            placeholder="Select status"
                                                            value={parseInt(watch("isActive") === 0 ? 2 : 1) || null}
                                                            onChange={(_, newValue) => {
                                                                if (newValue?.id) {
                                                                    field.onChange(newValue.id);
                                                                    if (newValue?.id === 2) {
                                                                        setValue("isActive", 0)
                                                                    }
                                                                }
                                                            }}
                                                            error={errors?.isActive}
                                                        />
                                                    )}
                                                />
                                            </div>

                                            <div>
                                                <Controller
                                                    name="payPeriod"
                                                    control={control}
                                                    rules={{
                                                        required: "Pay period is required"
                                                    }}
                                                    render={({ field }) => (
                                                        <Select
                                                            options={payScheduleOptions}
                                                            label={"Pay Period"}
                                                            placeholder="Select pay period"
                                                            value={parseInt(watch("payPeriod")) || null}
                                                            onChange={(_, newValue) => {
                                                                if (newValue?.id) {
                                                                    field.onChange(newValue.id);
                                                                } else {
                                                                    setValue("payPeriod", null);
                                                                }
                                                            }}
                                                            error={errors?.payPeriod}
                                                        />
                                                    )}
                                                />
                                            </div>

                                            <div>
                                                <Controller
                                                    name="employeeTypeId"
                                                    control={control}
                                                    rules={{
                                                        required: "Employee type is required"
                                                    }}
                                                    render={({ field }) => (
                                                        <Select
                                                            options={employeeType}
                                                            label={"Employee Type"}
                                                            placeholder="Select employee type"
                                                            value={parseInt(watch("employeeTypeId")) || null}
                                                            onChange={(_, newValue) => {
                                                                if (newValue?.id) {
                                                                    field.onChange(newValue.id);
                                                                    if (newValue.id === 3) {
                                                                        setValue("hourlyRate", "");
                                                                    }
                                                                } else {
                                                                    setValue("employeeTypeId", null);
                                                                }
                                                            }}
                                                            error={errors?.employeeTypeId}
                                                        />
                                                    )}
                                                />
                                            </div>

                                            <div>
                                                <Controller
                                                    name="hourlyRate"
                                                    control={control}
                                                    rules={{
                                                        required: watch("employeeTypeId") !== 3 ? "Hourly rate is required" : false,
                                                    }}
                                                    render={({ field }) => (
                                                        <Input
                                                            {...field}
                                                            label="Hourly Rate"
                                                            type={`text`}
                                                            disabled={watch("employeeTypeId") === 3}
                                                            endIcon={<CustomIcons iconName={`fa-solid fa-indian-rupee-sign`} css={'text-gray-500'} />}
                                                            error={errors?.hourlyRate}
                                                            onChange={(e) => {
                                                                const inputValue = e.target.value;
                                                                const numericValue = inputValue.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
                                                                field.onChange(numericValue);
                                                            }}
                                                        />
                                                    )}
                                                />
                                            </div>

                                            <div>
                                                <Controller
                                                    name="shiftId"
                                                    control={control}
                                                    rules={{
                                                        required: "Shift name is required",
                                                    }}
                                                    render={({ field }) => (
                                                        <Select
                                                            options={shifts}
                                                            label={"Shift"}
                                                            placeholder="Select shift"
                                                            value={parseInt(watch("shiftId")) || null}
                                                            onChange={(_, newValue) => {
                                                                if (newValue?.id) {
                                                                    field.onChange(newValue.id);
                                                                } else {
                                                                    setValue("shiftId", null);
                                                                }
                                                            }}
                                                            error={errors?.shiftId}
                                                        />
                                                    )}
                                                />
                                            </div>

                                            <div>
                                                <Controller
                                                    name="roleId"
                                                    control={control}
                                                    rules={{
                                                        required: "Role is required"
                                                    }}
                                                    render={({ field }) => (
                                                        <Select
                                                            options={roles}
                                                            label={"Role"}
                                                            placeholder="Select role"
                                                            value={parseInt(watch("roleId")) || null}
                                                            onChange={(_, newValue) => {
                                                                if (newValue?.id) {
                                                                    field.onChange(newValue.id);
                                                                } else {
                                                                    setValue("roleId", 1);
                                                                }
                                                            }}
                                                            error={errors?.roleId}
                                                        />
                                                    )}
                                                />
                                            </div>

                                            <div>
                                                <Controller
                                                    name="departmentId"
                                                    control={control}
                                                    rules={{
                                                        required: "Department is required"
                                                    }}
                                                    render={({ field }) => (
                                                        <Select
                                                            options={departments}
                                                            label={"Department"}
                                                            placeholder="Select department"
                                                            value={parseInt(watch("departmentId")) || null}
                                                            onChange={(_, newValue) => {
                                                                if (newValue?.id) {
                                                                    field.onChange(newValue.id);
                                                                } else {
                                                                    setValue("departmentId", null);
                                                                }
                                                            }}
                                                            error={errors?.departmentId}
                                                        />
                                                    )}
                                                />
                                            </div>

                                            <div className='col-span-2'>
                                                <Controller
                                                    name="companyLocation"
                                                    control={control}
                                                    rules={{
                                                        required: "Company location is required"
                                                    }}
                                                    render={({ field }) => (
                                                        <SelectMultiple
                                                            options={locations}
                                                            label={"Company Location"}
                                                            placeholder="Select company location"
                                                            value={field.value || []}
                                                            onChange={(newValue) => {
                                                                field.onChange(newValue);
                                                            }}
                                                            error={errors?.companyLocation}
                                                        />
                                                    )}
                                                />
                                            </div>

                                            <div className='flex items-center justify-start'>
                                                <p>Enable Geo-Fencing For Clock-In-Out</p>
                                            </div>

                                            <div className='flex justify-end items-center'>
                                                <Controller
                                                    name="checkGeofence"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Switch
                                                            onChange={field.onChange}
                                                            checked={field.value}
                                                            size="small"
                                                        />
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </>
                                )
                            }
                            {
                                activeStep === 2 && (
                                    <>
                                        <div className='mb-2 font-medium text-center text-[28px] text-[#262B43]'>
                                            <p style={{ color: theme.palette.primary.text.main, }}>PayRoll Info</p>
                                        </div>

                                        <div className='grid grid-cols-2 gap-6'>
                                            <div className='col-span-2'>
                                                <Controller
                                                    name="grossSalary"
                                                    control={control}
                                                    rules={{
                                                        required: "Gross Salary is required",
                                                    }}
                                                    render={({ field }) => (
                                                        <Input
                                                            {...field}
                                                            label="Gross Salary"
                                                            type={`text`}
                                                            error={errors?.grossSalary}
                                                            onChange={(e) => {
                                                                const numericValue = e.target.value.replace(/[^0-9]/g, '');
                                                                field.onChange(numericValue);
                                                            }}
                                                        />
                                                    )}
                                                />
                                            </div>

                                            <div className='col-span-2'>
                                                <Controller
                                                    name="isPf"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Checkbox
                                                            text={'PF(Provident Fund)'}
                                                            onChange={(e) => {
                                                                field.onChange(e.target.checked)
                                                                if (!e.target.checked) {
                                                                    setValue("pfPercentage", "");
                                                                    setValue("pfAmount", "");
                                                                    setValue("basicSalary", "");
                                                                }
                                                            }}
                                                            checked={field.value}
                                                        />
                                                    )}
                                                />
                                            </div>

                                            <div className={`col-span-2 transition-all duration-500 ${watch("isPf") ? "opacity-100 text-opacity-100 bg-opacity-100 block" : "opacity-0 hidden"}`}>
                                                <Controller
                                                    name="basicSalary"
                                                    control={control}
                                                    rules={{
                                                        required: watch("isPf") ? "Basic Salary is required" : false,
                                                    }}
                                                    render={({ field }) => (
                                                        <Input
                                                            {...field}
                                                            label="Basic Salary"
                                                            type={`text`}
                                                            error={errors?.basicSalary}
                                                            onChange={(e) => {
                                                                const numericValue = e.target.value.replace(/[^0-9]/g, '');
                                                                field.onChange(numericValue);
                                                            }}
                                                        />
                                                    )}
                                                />
                                            </div>

                                            <div className={`transition-all duration-500 ${watch("isPf") ? "opacity-100 text-opacity-100 bg-opacity-100 block" : "opacity-0 hidden"}`}>
                                                <Controller
                                                    name="pfPercentage"
                                                    control={control}
                                                    rules={{
                                                        required: (watch("isPf") && !watch("pfAmount")) ? "PF Percentage is required" : false,
                                                        min: {
                                                            value: 1,
                                                            message: "PF Percentage must be at least 1"
                                                        }
                                                    }}
                                                    render={({ field }) => (
                                                        <Input
                                                            {...field}
                                                            label="PF Percentage"
                                                            type={`text`}
                                                            error={errors?.pfPercentage}
                                                            disabled={watch("pfAmount")}
                                                            onChange={(e) => {
                                                                let value = e.target.value;
                                                                if (/^\d*\.?\d*$/.test(value)) {
                                                                    setValue("pfAmount", "");
                                                                    field.onChange(value);
                                                                }
                                                            }}
                                                            endIcon={<CustomIcons iconName={`fa-solid fa-percent`} css={'text-gray-500'} />}
                                                        />
                                                    )}
                                                />
                                            </div>

                                            <div className={`transition-all duration-500 ${watch("isPf") ? "opacity-100 text-opacity-100 bg-opacity-100 block" : "opacity-0 hidden"}`}>
                                                <Controller
                                                    name="pfAmount"
                                                    control={control}
                                                    rules={{
                                                        required: (watch("isPf") && !watch("pfPercentage")) ? "PF Amount is required" : false,
                                                        min: {
                                                            value: 1,
                                                            message: "PF Amount must be at least 1"
                                                        }
                                                    }}
                                                    render={({ field }) => (
                                                        <Input
                                                            {...field}
                                                            label="PF Amount"
                                                            type={`text`}
                                                            error={errors?.pfAmount}
                                                            disabled={watch("pfPercentage")}
                                                            onChange={(e) => {
                                                                let value = e.target.value;
                                                                if (/^\d*\.?\d*$/.test(value)) {
                                                                    setValue("pfPercentage", "");
                                                                    field.onChange(value);
                                                                }
                                                            }}
                                                            endIcon={<CustomIcons iconName={`fa-solid fa-indian-rupee-sign`} css={'text-gray-500'} />}
                                                        />
                                                    )}
                                                />
                                            </div>


                                            <div>
                                                <Controller
                                                    name="isPt"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Checkbox
                                                            text={'PT(Professional Tax)'}
                                                            onChange={(e) => {
                                                                field.onChange(e.target.checked)
                                                                if (!e.target.checked) {
                                                                    setValue("ptAmount", "");
                                                                }
                                                            }}
                                                            checked={field.value}
                                                        />
                                                    )}
                                                />
                                                <div className={`transition-all duration-500 ${watch("isPt") ? "mt-3 opacity-100 text-opacity-100 bg-opacity-100" : "opacity-0 mt-0"}`}>
                                                    <Controller
                                                        name="ptAmount"
                                                        control={control}
                                                        rules={{
                                                            required: watch("isPt") ? "PT Amount is required" : false,
                                                        }}
                                                        render={({ field }) => (
                                                            <Input
                                                                {...field}
                                                                label="PT Amount"
                                                                type={`text`}
                                                                error={errors?.ptAmount}
                                                                onChange={(e) => {
                                                                    let value = e.target.value;
                                                                    if (/^\d*\.?\d*$/.test(value)) {
                                                                        field.onChange(value);
                                                                    }
                                                                }}
                                                            />
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )
                            }
                            {
                                activeStep === 3 && (
                                    <>
                                        <div className='mb-2 font-medium text-center text-[28px] text-[#262B43]'>
                                            <p style={{ color: theme.palette.primary.text.main, }}>Direact Deposite</p>
                                        </div>

                                        <div className='my-6 text-base font-medium leading-snug text-[#262B43]'>
                                            <p style={{ color: theme.palette.primary.text.main, }}>Bank Information</p>
                                        </div>

                                        <div className='grid grid-cols-2 lg:grid-cols-2 gap-6'>
                                            <div>
                                                <Controller
                                                    name="accountType"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Select
                                                            options={accountTypeOptions}
                                                            label={"Account Type"}
                                                            placeholder="Select account type"
                                                            value={parseInt(watch("accountType")) || null}
                                                            onChange={(_, newValue) => {
                                                                if (newValue?.id) {
                                                                    field.onChange(newValue.id);
                                                                } else {
                                                                    setValue("accountType", null);
                                                                }
                                                            }}
                                                        />
                                                    )}
                                                />
                                            </div>

                                            <div>
                                                <Controller
                                                    name="bankName"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Input
                                                            {...field}
                                                            label="Bank Name"
                                                            type={`text`}
                                                            onChange={(e) => {
                                                                field.onChange(e.target.value);
                                                            }}
                                                        />
                                                    )}
                                                />
                                            </div>

                                            <div>
                                                <Controller
                                                    name="ifscCode"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Input
                                                            {...field}
                                                            label="IFSC Code"
                                                            type={`text`}
                                                            onChange={(e) => {
                                                                const numericValue = e.target.value.replace(/[^A-Z0-9]/g, '');
                                                                field.onChange(numericValue);
                                                            }}
                                                        />
                                                    )}
                                                />
                                            </div>

                                            <div>
                                                <Controller
                                                    name="accountNumber"
                                                    control={control}

                                                    render={({ field }) => (
                                                        <Input
                                                            {...field}
                                                            label="Account Number"
                                                            type={`text`}
                                                            onChange={(e) => {
                                                                const numericValue = e.target.value.replace(/[^0-9]/g, '');
                                                                field.onChange(numericValue);
                                                            }}
                                                        />
                                                    )}
                                                />
                                            </div>

                                            <div>
                                                <Controller
                                                    name="confirmAccountNumber"
                                                    control={control}
                                                    rules={{
                                                        validate: (value) => {
                                                            if (watch("accountNumber") && value !== watch("accountNumber")) {
                                                                return "Account number do not match";
                                                            }
                                                            return true;
                                                        },
                                                    }}
                                                    render={({ field }) => (
                                                        <Input
                                                            {...field}
                                                            label="Confirm Account Number"
                                                            type={`text`}
                                                            onChange={(e) => {
                                                                const numericValue = e.target.value.replace(/[^0-9]/g, '');
                                                                field.onChange(numericValue);
                                                            }}
                                                            error={errors?.confirmAccountNumber}
                                                        />
                                                    )}
                                                />
                                            </div>

                                            <div>
                                                <Controller
                                                    name="branch"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Input
                                                            {...field}
                                                            label="Branch Name"
                                                            type={`text`}
                                                            onChange={(e) => {
                                                                field.onChange(e.target.value);
                                                            }}
                                                        />
                                                    )}
                                                />
                                            </div>

                                            <div>
                                                <Controller
                                                    name="address"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Input
                                                            {...field}
                                                            label="Address"
                                                            type={`text`}
                                                            onChange={(e) => {
                                                                field.onChange(e.target.value);
                                                            }}
                                                        />
                                                    )}
                                                />
                                            </div>

                                            <div className='grid col-span-2'>
                                                <FileInputBox
                                                    onFileSelect={handleImageChangePassbook}
                                                    onRemove={handleDeletePassbookImage}
                                                    value={watch("passbookImage")}
                                                    text="Click in this area to upload passbook image"
                                                />
                                            </div>
                                        </div>
                                    </>
                                )
                            }
                            {
                                (!id && activeStep === 4) && (
                                    <>
                                        <div className='mb-5 font-medium text-center text-[28px] text-[#262B43]'>
                                            <p style={{ color: theme.palette.primary.text.main }}>
                                                Face Recognition
                                            </p>
                                        </div>

                                        <div className="flex flex-col items-center gap-6">
                                            <p className="text-lg text-gray-700 font-medium text-center">
                                                Do you want to set up Face Recognition for this employee now?
                                            </p>

                                            <div className="flex justify-center items-center gap-4">
                                                <Button
                                                    type="button"
                                                    text="Set Face Recognition"
                                                    onClick={() => setShowFaceRegistration(true)}
                                                    className="px-6 py-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-md"
                                                />

                                                <Button
                                                    useFor='disabled'
                                                    type="button"
                                                    text="Skip For Now"
                                                    onClick={() => navigate('/dashboard/manageemployees')}
                                                    className="px-6 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-md"
                                                />
                                            </div>
                                        </div>
                                    </>
                                )
                            }

                            <div className='flex justify-end gap-3 mt-6'>
                                {
                                    activeStep !== 4 && (
                                        <>
                                            <div>
                                                <Button useFor='disabled' type={'button'} text={activeStep === 0 ? "Cancel" : "Back"} onClick={handleBack} />
                                            </div>

                                            <div>
                                                <Button value="save" type={'submit'} text={activeStep === 3 ? "Submit" : "Next"} isLoading={loading} />
                                            </div>
                                            {
                                                (id && activeStep === 2) && (
                                                    <div>
                                                        <Button type={'submit'} value="saveAndExit" text={"Submit & Exit"} isLoading={loading} />
                                                    </div>
                                                )
                                            }
                                        </>
                                    )
                                }
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <AlertDialog open={dialog.open} title={dialog.title} message={dialog.message} actionButtonText={dialog.actionButtonText} handleAction={handleCreateShift} handleClose={handleCloseDialog} />
            <AlertDialog open={dialogFaceRegistration.open} title={dialogFaceRegistration.title} message={dialogFaceRegistration.message} actionButtonText={dialogFaceRegistration.actionButtonText} handleAction={handleDeleteFaceRegistration} handleClose={handleCloseFaceRegistrationDialog} />

            <FaceRegistration open={showFaceRegistration} handleClose={handleCloseFaceRegistration} employeeId={id} type="register" />
        </div>
    )
}

const mapDispatchToProps = {
    setAlert,
    handleSetTitle,
}

export default connect(null, mapDispatchToProps)(AddEmployeeComponent)
