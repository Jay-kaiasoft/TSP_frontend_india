import React, { useEffect, useState } from 'react'
import AlertDialog from '../../common/alertDialog/alertDialog';
import { Controller, useForm } from 'react-hook-form';
import { createShift, deleteShift, getAllShifts, getShift, updateShift } from '../../../service/companyShift/companyShiftService';
import PermissionWrapper from '../../common/permissionWrapper/PermissionWrapper';
import Components from '../../muiComponents/components';
import CustomIcons from '../../common/icons/CustomIcons';
import DataTable from '../../common/table/table';
import Select from '../../common/select/select';
import Input from '../../common/input/input';
import InputTimePicker from '../../common/inputTimePicker/inputTimePicker';
import Button from '../../common/buttons/button';
import dayjs from 'dayjs';
import { connect } from 'react-redux';
import { setAlert, handleSetTitle } from '../../../redux/commonReducers/commonReducers';

const type = [
    {
        id: 1,
        title: "Hourly",
    },
    {
        id: 2,
        title: "Time Based",
    }
]

const ManageShift = ({ setAlert, handleSetTitle }) => {
    const [dialog, setDialog] = useState({ open: false, title: '', message: '', actionButtonText: '' });

    const [shifts, setShifts] = useState([])
    const [shiftId, setShiftId] = useState(null)
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const userInfo = JSON.parse(localStorage.getItem("userInfo"))

    const {
        handleSubmit,
        control,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm({
        defaultValues: {
            id: "",
            companyId: "",
            shiftName: "",
            shiftType: "",
            shiftTypeId: "",
            startTime: null,
            endTime: null,
            hours: "",
            totalHours: 0,
        },
    });

    const submit = async (data) => {
        const payload = {
            ...data,
            companyId: userInfo?.companyId,
            totalHours: parseFloat(data.totalHours) || 0,
            startTime: data.startTime
                ? new Date(data.startTime).toISOString()
                : null,
            endTime: data.endTime
                ? new Date(data.endTime).toISOString()
                : null,
            autoTimeInAfterHours: data.autoTimeInAfterHours ? parseFloat(data.autoTimeInAfterHours) : null
        };

        setLoading(true)
        if (shiftId) {
            const response = await updateShift(shiftId, payload)
            if (response.data.status === 200) {
                handleGetAllShifts()
                reset()
                setOpen(false)
                setLoading(false)
            } else {
                setLoading(false)
                setAlert({
                    open: true,
                    message: response.data.message,
                    type: "error",
                })
            }
        } else {
            const response = await createShift(payload)
            if (response.data.status === 201) {
                handleGetAllShifts()
                reset()
                setOpen(false)
            } else {
                setAlert({
                    open: true,
                    message: response.data.message,
                    type: "error",
                })
            }
        }
    }

    const hanndleClose = () => {
        setOpen(false)
        reset()
        setShiftId(null)
    }

    const handleAddShift = () => {
        setShiftId(null)
        reset()
        setOpen(true)
    }

    const handleCloseDialog = () => {
        setDialog({ ...dialog, open: false })
    }

    const handleOpenDeleteShiftModel = (id) => {
        setShiftId(id)
        setDialog({
            open: true,
            title: "Delete Shift",
            message: "Are you sure ! Do you want to delete this shift?",
            actionButtonText: "Delete",
        });
    }

    const handleDeleteShift = async () => {
        if (!shiftId) return
        setLoading(true)
        const response = await deleteShift(shiftId)
        if (response.data.status === 200) {
            setDialog({ ...dialog, open: false })
            handleGetAllShifts()
            setLoading(false)
            setShiftId(null)
        } else {
            setLoading(false)
            setAlert({
                open: true,
                message: response.data.message,
                type: "error",
            })
        }
    }

    const handleGetAllShifts = async () => {
        if (!userInfo?.companyId) return
        const response = await getAllShifts(userInfo?.companyId)
        if (response.data.status === 200) {
            setShifts(response.data.result)
        }
    }

    const handleGetShift = async () => {
        if (shiftId) {
            const response = await getShift(shiftId)
            if (response.data.status === 200) {
                const result = response.data.result;
                setValue("shiftName", result?.shiftName);
                setValue("shiftType", result?.shiftType);
                setValue("shiftTypeId", type.find(item => item.title === result?.shiftType)?.id);
                if (result?.startTime) {
                    setValue("startTime", dayjs(result?.startTime))
                }
                if (result?.endTime) {
                    setValue("endTime", dayjs(result?.endTime))
                }
                setValue("hours", result?.hours);
                setValue("totalHours", parseFloat(result?.totalHours) || 0);
                setValue("autoTimeInAfterHours", parseFloat(result?.autoTimeInAfterHours) || null);
            }
        }
    }

    const handleSelectShift = (id) => {
        reset()
        setShiftId(id)
        setOpen(true)
    }

    useEffect(() => {
        handleGetAllShifts()
        handleSetTitle("Manage Shifts")
    }, [])

    useEffect(() => {
        handleGetShift()
    }, [shiftId])

    useEffect(() => {
        if (watch("startTime") && watch("endTime")) {
            const start = dayjs(watch("startTime"));
            const end = dayjs(watch("endTime"));

            let diff = end.diff(start, "minute");

            if (diff < 0) {
                diff += 24 * 60;
            }

            const hours = Math.floor(diff / 60);
            const minutes = diff % 60;

            const total = `${hours}.${minutes.toString().padStart(2, '0')}`;
            setValue("totalHours", isNaN(total) ? 0.00 : parseFloat(total));
        }
        else {
            if (!watch("hours")) {
                setValue("totalHours", 0);
            }
        }
    }, [watch("startTime"), watch("endTime")]);

    const columns = [
        {
            field: 'shiftName',
            headerName: 'shift Name',
            headerClassName: 'uppercase',
            flex: 1,
            maxWidth: 150,
            sortable: false,
        },
        {
            field: 'shiftType',
            headerName: 'shift Type',
            headerClassName: 'uppercase',
            flex: 1,
            minWidth: 150
        },
        {
            field: 'startTime',
            headerName: 'duration',
            sortable: false,
            headerClassName: 'uppercase',
            flex: 1,
            minWidth: 190,
            renderCell: (params) => {
                return (
                    <div>
                        {params.row.startTime ? dayjs(params.row?.startTime).format("hh:mm A") : ""} - {params.row.endTime ? dayjs(params.row?.endTime).format("hh:mm A") : ""}
                    </div>
                );
            },
        },
        {
            field: 'totalHours',
            headerName: 'totalHours',
            headerClassName: 'uppercase',
            flex: 1,
            minWidth: 120,
            sortable: false,
            renderCell: (params) => {
                return (
                    <div>
                        {parseFloat(params.row.totalHours)}
                    </div>
                );
            },
        },
        {
            field: 'autoTimeInAfterHours',
            headerName: 'Auto Time In After Hours',
            headerClassName: 'uppercase',
            flex: 1,
            minWidth: 120,
            sortable: false,
            renderCell: (params) => {
                return (
                    <div>
                        {params.row.autoTimeInAfterHours ? parseFloat(params.row.autoTimeInAfterHours) : "-"}
                    </div>
                );
            },
        },
        {
            field: 'action',
            headerName: 'action',
            headerClassName: 'uppercase',
            sortable: false,
            renderCell: (params) => {
                return (
                    <div className='flex items-center gap-2 justify-center h-full'>
                        <PermissionWrapper
                            functionalityName="Company"
                            moduleName="Manage Shifts"
                            actionId={2}
                            component={
                                <div className='bg-blue-600 h-8 w-8 flex justify-center items-center rounded-full text-white'>
                                    <Components.IconButton onClick={() => handleSelectShift(params.row.id)}>
                                        <CustomIcons iconName={'fa-solid fa-pen-to-square'} css='cursor-pointer text-white h-4 w-4' />
                                    </Components.IconButton>
                                </div>
                            }
                        />
                        <PermissionWrapper
                            functionalityName="Company"
                            moduleName="Manage Shifts"
                            actionId={3}
                            component={
                                <div className='bg-red-600 h-8 w-8 flex justify-center items-center rounded-full text-white'>
                                    <Components.IconButton onClick={() => handleOpenDeleteShiftModel(params.row.id)}>
                                        <CustomIcons iconName={'fa-solid fa-trash'} css='cursor-pointer text-white h-4 w-4' />
                                    </Components.IconButton>
                                </div>
                            }
                        />
                    </div>
                );
            },
        },
    ];

    const getRowId = (row) => {
        return row.id;
    }

    const actionButtons = () => {
        return (
            <PermissionWrapper
                functionalityName="Company"
                moduleName="Manage Shifts"
                actionId={1}
                component={
                    <div>
                        <Button type={`button`} text={'Add Shift'} onClick={() => handleAddShift()} startIcon={<CustomIcons iconName="fa-solid fa-plus" css="h-5 w-5" />} />
                    </div>
                }
            />
        )
    }


    return (
        <div className='px-4 lg:px-0'>
            <div className={`border rounded-lg bg-white w-full lg:w-full mb-5 transform transition-all duration-500 ease-in-out ${open ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-5 pointer-events-none'}`}>
                {
                    open && (
                        <div className='p-4'>
                            <form noValidate onSubmit={handleSubmit(submit)}>
                                <div className='md:flex justify-start items-center gap-4'>
                                    <div className='grid md:grid-cols-7 gap-3 w-full'>
                                        <div>
                                            <Controller
                                                name="shiftName"
                                                control={control}
                                                rules={{
                                                    required: "Shift name is required",
                                                }}
                                                render={({ field }) => (
                                                    <Input
                                                        {...field}
                                                        label="Shift name"
                                                        type={`text`}
                                                        error={errors.shiftName}
                                                        onChange={(e) => {
                                                            field.onChange(e);
                                                        }}
                                                    />
                                                )}
                                            />
                                        </div>

                                        <div>
                                            <Controller
                                                name="shiftTypeId"
                                                control={control}
                                                rules={{ required: "Shift Type is required" }}
                                                render={({ field }) => (
                                                    <Select
                                                        options={type}
                                                        error={!!errors.shiftTypeId}
                                                        label="Shift Type"
                                                        placeholder="Select type"
                                                        value={parseInt(watch("shiftTypeId")) || null}
                                                        onChange={(_, newValue) => {
                                                            field.onChange(newValue?.id || null);
                                                            setValue("shiftType", newValue?.title || null);
                                                            setValue("shiftTypeId", newValue?.id || null);
                                                            if (newValue?.title === "Hourly") {
                                                                setValue("startTime", null);
                                                                setValue("endTime", null);
                                                            } else if (newValue?.title === "Time Based") {
                                                                setValue("hours", 0);
                                                            } else {
                                                                setValue("hours", 0);
                                                                setValue("startTime", null);
                                                                setValue("endTime", null);
                                                            }
                                                        }}
                                                    />
                                                )}
                                            />
                                        </div>

                                        <div>
                                            <Controller
                                                name="hours"
                                                control={control}
                                                rules={{
                                                    required: watch("shiftTypeId") === 1 ? "Hours is required" : null,
                                                }}
                                                render={({ field }) => (
                                                    <Input
                                                        {...field}
                                                        label="Shift Hours"
                                                        type="text"
                                                        error={errors.hours}
                                                        value={field.value}
                                                        onChange={(e) => {
                                                            let value = e.target.value;

                                                            // Allow only numbers and one decimal point
                                                            value = value.replace(/[^0-9.]/g, '');

                                                            // Prevent multiple dots
                                                            const parts = value.split('.');
                                                            if (parts.length > 2) {
                                                                value = parts[0] + '.' + parts[1];
                                                            }

                                                            // Limit to 2 decimal places
                                                            if (parts[1]?.length > 2) {
                                                                value = parts[0] + '.' + parts[1].slice(0, 2);
                                                            }

                                                            field.onChange(value);
                                                            setValue("totalHours", value);
                                                        }}
                                                        disabled={watch("shiftTypeId") !== 1}
                                                    />
                                                )}
                                            />
                                        </div>

                                        <div>
                                            <InputTimePicker
                                                label="Start Time"
                                                name="startTime"
                                                control={control}
                                                disabled={watch("shiftTypeId") !== 2 ? true : false}
                                                rules={{
                                                    required: watch("shiftTypeId") === 2 ? "Start time is required" : null,
                                                }}
                                                maxTime={watch("endTime")}
                                            />
                                        </div>

                                        <div>
                                            <InputTimePicker
                                                label="End Time"
                                                name="endTime"
                                                control={control}
                                                disabled={watch("shiftTypeId") !== 2 ? true : false}
                                                rules={{
                                                    required: watch("shiftTypeId") === 2 ? "End time is required" : null,
                                                }}
                                                minTime={watch("startTime")}
                                            />
                                        </div>

                                        <div>
                                            <Controller
                                                name="totalHours"
                                                control={control}
                                                render={({ field }) => (
                                                    <Input
                                                        {...field}
                                                        label="Total hours"
                                                        type={`text`}
                                                        disabled={true}
                                                    />
                                                )}
                                            />
                                        </div>

                                        <div>
                                            <Controller
                                                name="autoTimeInAfterHours"
                                                control={control}
                                                render={({ field }) => (
                                                    <Input
                                                        {...field}
                                                        label="Auto Time In After Hours"
                                                        type={`text`}
                                                        onChange={(e) => {
                                                            let value = e.target.value;

                                                            // Allow only numbers and one decimal point
                                                            value = value.replace(/[^0-9.]/g, '');

                                                            // Prevent multiple dots
                                                            const parts = value.split('.');
                                                            if (parts.length > 2) {
                                                                value = parts[0] + '.' + parts[1];
                                                            }

                                                            // Limit to 2 decimal places
                                                            if (parts[1]?.length > 2) {
                                                                value = parts[0] + '.' + parts[1].slice(0, 2);
                                                            }

                                                            field.onChange(value);
                                                            setValue("autoTimeInAfterHours", value);
                                                        }}
                                                    />
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <div className='mt-3 md:mt-0 flex justify-start items-center gap-4'>
                                        <div>
                                            <Button useFor={"disabled"} type={'button'} text={"Cancel"} onClick={hanndleClose} />
                                        </div>

                                        <div>
                                            <Button type={'submit'} text={shiftId ? "Update" : "Add"} />
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    )
                }
            </div>
            <div className='border rounded-lg bg-white w-full lg:w-full '>
                <DataTable columns={columns} rows={shifts} getRowId={getRowId} showButtons={true} buttons={actionButtons} />
            </div>
            <AlertDialog open={dialog.open} title={dialog.title} message={dialog.message} actionButtonText={dialog.actionButtonText} handleAction={handleDeleteShift} handleClose={handleCloseDialog} loading={loading} />
        </div>
    )
}

const mapDispatchToProps = {
    setAlert,
    handleSetTitle
};

export default connect(null, mapDispatchToProps)(ManageShift)
