import React, { useEffect, useState } from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Components from '../../muiComponents/components';
import Button from '../../common/buttons/button';
import { Controller, useForm } from 'react-hook-form';
import Input from '../../common/input/input';
import { connect } from 'react-redux';
import { setAlert } from '../../../redux/commonReducers/commonReducers';
import CustomIcons from '../../common/icons/CustomIcons';
import { createAttendancePenaltyRule, getAttendancePenaltyRuleById, updateAttendancePenaltyRule } from '../../../service/attendancePenaltyRules/attendancePenaltyRuleService';
import Select from '../../common/select/select';
import InputTimePicker from '../../common/inputTimePicker/inputTimePicker';
import dayjs from 'dayjs';

const BootstrapDialog = styled(Components.Dialog)(({ theme }) => ({
    '& .MuiDialogContent-root': {
        padding: theme.spacing(2),
    },
    '& .MuiDialogActions-root': {
        padding: theme.spacing(1),
    },
}));

const attendancePenaltyRuleTypes = [
    { id: 1, title: "Fixed Amount" },
    { id: 2, title: "Half Day Salary" },
    { id: 3, title: "5 Min Salary" },
    { id: 4, title: "15 Min Salary" },
    { id: 5, title: "30 Min Salary" },
    { id: 6, title: "1 Hour Salary" },
    { id: 7, title: "1 Day Salary" },
    { id: 8, title: "1.5 Day Salary" },
    { id: 9, title: "2 Day Salary" },
    { id: 10, title: "2.5 Day Salary" },
    { id: 11, title: "3 Day Salary" }
];

function AddEarlyExit({ setAlert, open, handleClose, id, handleAttendancePenaltyRule }) {
    const theme = useTheme()

    const [loading, setLoading] = useState(false);
    const userInfo = JSON.parse(localStorage.getItem("userInfo"))

    const {
        handleSubmit,
        control,
        reset,
        formState: { errors },
        watch,
        setValue,
    } = useForm({
        defaultValues: {
            ruleName: "",
            minutes: "",
            amount: "",
            deductionType: 1,
            count: 0,
            startTime: null,
            endTime: null
        },
    });

    const onClose = () => {
        setLoading(false);
        reset({
            ruleName: "",
            minutes: "",
            amount: "",
            deductionType: 1,
            count: 0,
            startTime: null,
            endTime: null
        });
        handleClose();
    };

    const submit = async (data) => {
        const newData = {
            ...data,
            startTime: data.startTime ? new Date(data.startTime).toISOString() : null,
            endTime: data.endTime ? new Date(data.endTime).toISOString() : null,
            companyId: userInfo?.companyId,
            createdBy: userInfo?.employeeId,
            deductionType: attendancePenaltyRuleTypes.find(type => type.id === data.deductionType)?.title || "",
            amount: data.deductionType === 1 ? data.amount : null,
            isEarlyExit: true,
        }
        if (id) {
            setLoading(true)
            const response = await updateAttendancePenaltyRule(id, newData);
            if (response?.data?.status === 200) {
                // setAlert({ open: true, message: response.data.message, type: "success" })
                handleAttendancePenaltyRule()
                onClose();
            } else {
                setAlert({ open: true, message: response.data.message, type: 'error' });
                setLoading(false);
            }

        } else {
            setLoading(true)
            const response = await createAttendancePenaltyRule(newData);
            if (response?.data?.status === 201) {
                handleAttendancePenaltyRule()
                onClose();
            } else {
                setAlert({ open: true, message: response.data.message, type: 'error' });
                setLoading(false);
            }
        }
    }

    const handleGetAttendancePenaltyRuleById = async () => {
        if (!id && !open) return;

        const response = await getAttendancePenaltyRuleById(id);
        if (response.data.status === 200) {
            reset({
                id: response?.data?.result?.id || "",
                ruleName: response?.data?.result?.ruleName || "",
                minutes: response?.data?.result?.minutes || "",
                amount: response?.data?.result?.amount || "",
                deductionType: attendancePenaltyRuleTypes.find(type => type.title === response?.data?.result?.deductionType)?.id || 1,
                count: response?.data?.result?.count || "",
                startTime: response?.data?.result?.startTime ? dayjs(response.data.result.startTime) : null,
                endTime: response?.data?.result?.endTime ? dayjs(response.data.result.endTime) : null,
            });
        } else {
            setAlert({ message: response.data.message, type: 'error' });
        }
    };

    useEffect(() => {
        if (watch("startTime") && watch("endTime")) {
            const start = new Date(watch("startTime"));
            const end = new Date(watch("endTime"));
            let diffInMinutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));

            // If endTime is before startTime, assume it's the next day
            if (diffInMinutes < 0) {
                diffInMinutes += 24 * 60;
            }
            setValue("minutes", diffInMinutes.toString());
        } else {
            setValue("minutes", "");
        }
    }, [watch("startTime"), watch("endTime")]);

    useEffect(() => {
        handleGetAttendancePenaltyRuleById();
    }, [id])


    return (
        <React.Fragment>
            <BootstrapDialog
                open={open}
                aria-labelledby="customized-dialog-title"
                fullWidth
                maxWidth='md'
            >
                <Components.DialogTitle sx={{ m: 0, p: 2, color: theme.palette.primary.text.main }} id="customized-dialog-title">
                    {id ? "Update" : "Create"} Early Exit Rule
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

                <form noValidate onSubmit={handleSubmit(submit)}>
                    <Components.DialogContent dividers>
                        <div className='grid grid-cols-3 gap-4'>
                            <Controller
                                name="ruleName"
                                control={control}
                                rules={{
                                    required: "Rule name is required",
                                }}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        label="Rule Name"
                                        type={`text`}
                                        error={errors.ruleName}
                                        onChange={(e) => {
                                            field.onChange(e);
                                        }}
                                    />
                                )}
                            />
                            <Controller
                                name="deductionType"
                                control={control}
                                rules={{ required: "Deduction Type is required" }}
                                render={({ field }) => (
                                    <Select
                                        options={attendancePenaltyRuleTypes}
                                        error={!!errors.deductionType}
                                        label="Deduction Type"
                                        placeholder="Select type"
                                        value={parseInt(watch("deductionType")) || null}
                                        onChange={(_, newValue) => {
                                            field.onChange(newValue?.id || null);
                                        }}
                                    />
                                )}
                            />
                            {
                                watch("deductionType") === 1 && (
                                    <Controller
                                        name="amount"
                                        control={control}
                                        rules={{
                                            required: watch("deductionType") === 1 ? "Deduction Amount is required" : false,
                                        }}
                                        render={({ field }) => (
                                            <Input
                                                {...field}
                                                label="Deduction Amount"
                                                type={`text`}
                                                error={errors.amount}
                                                onChange={(e) => {
                                                    const numericValue = e.target.value.replace(/[^0-9]/g, '');
                                                    field.onChange(numericValue);
                                                }}
                                            />
                                        )}
                                        disabled={watch("deductionType") !== 1}
                                    />
                                )
                            }
                            <InputTimePicker
                                label="Start Time"
                                name="startTime"
                                control={control}
                                rules={{
                                    required: "Start time is required",
                                }}
                                maxTime={watch("endTime")}
                            />
                            <InputTimePicker
                                label="End Time"
                                name="endTime"
                                control={control}
                                rules={{
                                    required: "End time is required",
                                }}
                                minTime={watch("startTime")}
                            />
                            <Input
                                label="Total Minutes"
                                type={`text`}
                                value={watch("minutes") || 0}
                                InputLabelProps={{ shrink: true }}
                                disabled={true}
                            />
                            <Controller
                                name="count"
                                control={control}
                                render={({ field }) => (
                                    <div className=''>
                                        <Input
                                            {...field}
                                            label="Minimum Occurrences(Exclusive)"
                                            type={`text`}
                                            onChange={(e) => {
                                                const numericValue = e.target.value.replace(/[^0-9]/g, '');
                                                field.onChange(numericValue);
                                            }}
                                        />
                                        <span className='text-xs text-gray-500 ml-2'>Fine will be pardoned upto {watch("count") || 0} times</span>
                                    </div>
                                )}
                            />
                        </div>
                    </Components.DialogContent>
                    <Components.DialogActions>
                        <div className='flex justify-end'>
                            <Button type={`submit`} text={id ? "Update" : "Submit"} isLoading={loading} />
                        </div>
                    </Components.DialogActions>
                </form>
            </BootstrapDialog>
        </React.Fragment>
    );
}

const mapDispatchToProps = {
    setAlert,
};

export default connect(null, mapDispatchToProps)(AddEarlyExit)
