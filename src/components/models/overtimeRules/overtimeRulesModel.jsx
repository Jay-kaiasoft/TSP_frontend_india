import React, { useEffect, useState } from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Components from '../../muiComponents/components';
import Button from '../../common/buttons/button';
import { Controller, useForm } from 'react-hook-form';
import Input from '../../common/input/input';
import { connect } from 'react-redux';
import { setAlert } from '../../../redux/commonReducers/commonReducers';
import CustomIcons from '../../common/icons/CustomIcons';
import InputTimePicker from '../../common/inputTimePicker/inputTimePicker';
import Select from '../../common/select/select';
import { createOvertimeRule, getOvertimeRule, updateOvertimeRule } from '../../../service/overtimeRules/overtimeRulesService';
import dayjs from 'dayjs';

const BootstrapDialog = styled(Components.Dialog)(({ theme }) => ({
    '& .MuiDialogContent-root': {
        padding: theme.spacing(2),
    },
    '& .MuiDialogActions-root': {
        padding: theme.spacing(1),
    },
}));

const overTimeTypes = [
    { id: 1, title: "Fixed Amount" },
    { id: 2, title: "Fixed Amount Per Hour" },
    { id: 3, title: "1x Salary" },
    { id: 4, title: "1.5x Salary" },
    { id: 5, title: "2x Salary" },
    { id: 6, title: "2.5x Salary" },
    { id: 7, title: "3x Salary" }
];

function OvertimeRulesModel({ setAlert, open, handleClose, companyId, overTimeId, handleGetAllOvertimeRules }) {
    const theme = useTheme()
    const [loading, setLoading] = useState(false);

    const {
        watch,
        setValue,
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm({
        defaultValues: {
            id: "",
            ruleName: "",
            otMinutes: "",
            otAmount: "",
            otType: 1,

            startTime: null,
            endTime: null,
        },
    });

    const onClose = () => {
        setLoading(false);
        reset({
            id: "",
            ruleName: "",
            otMinutes: "",
            otAmount: "",
            otType: 1,
            startTime: null,
            endTime: null,
        });
        handleClose();
    };

    const submit = async (data) => {
        const newData = {
            ...data,
            startTime: data.startTime ? new Date(data.startTime).toISOString() : null,
            endTime: data.endTime ? new Date(data.endTime).toISOString() : null,
            companyId: companyId,
            otType: overTimeTypes.find(type => type.id === data.otType)?.title || "",
            userIds: data.userIds?.length > 0 ? JSON.stringify(data.userIds) : null,
        }
        setLoading(true);
        if (overTimeId) {
            const response = await updateOvertimeRule(overTimeId, newData);
            if (response?.data?.status === 200) {
                handleGetAllOvertimeRules();
                onClose();
            } else {
                setLoading(false);
                setAlert({
                    open: true,
                    message: response?.data?.message || "Failed to update overtime rule",
                    type: "error",
                });
            }
        } else {
            const response = await createOvertimeRule(companyId, newData);
            if (response?.data?.status === 201) {
                handleGetAllOvertimeRules();
                onClose();
            } else {
                setLoading(false);
                setAlert({
                    open: true,
                    message: response?.data?.message || "Failed to create overtime rule",
                    type: "error",
                });
            }
        }
    }

    const handleGetOvertimeRuleById = async () => {
        if (overTimeId !== null && open) {
            const response = await getOvertimeRule(overTimeId);
            if (response?.data?.status === 200) {
                const data = response?.data?.result;
                reset({
                    id: data?.id || "",
                    ruleName: data?.ruleName || "",
                    otMinutes: data?.otMinutes || "",
                    otAmount: data?.otAmount || "",
                    otType: overTimeTypes.find(type => type.title === data?.otType)?.id || 1,
                    startTime: data?.startTime ? dayjs(data.startTime) : null,
                    endTime: data?.endTime ? dayjs(data.endTime) : null,
                    userIds: data?.userIds !== null ? JSON.parse(data?.userIds) : [],
                });
            }
        }
    }

    useEffect(() => {
        if (watch("startTime") && watch("endTime")) {
            const start = new Date(watch("startTime"));
            const end = new Date(watch("endTime"));

            let diffInMinutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));

            // If endTime is before startTime, assume it's the next day
            if (diffInMinutes < 0) {
                diffInMinutes += 24 * 60;
            }

            setValue("otMinutes", diffInMinutes.toString());
        } else {
            setValue("otMinutes", "");
        }
    }, [watch("startTime"), watch("endTime")]);

    useEffect(() => {
        handleGetOvertimeRuleById()
    }, [overTimeId])

    return (
        <React.Fragment>
            <BootstrapDialog
                open={open}
                aria-labelledby="customized-dialog-title"
                fullWidth
                maxWidth='md'
            >
                <Components.DialogTitle sx={{ m: 0, p: 2, color: theme.palette.primary.text.main }} id="customized-dialog-title">
                    {overTimeId ? "Update" : "Create"} Overtime Rule
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
                            <Input
                                label="Calculation Type"
                                type={`text`}
                                value={'Post Payable Hours/Shift End'}
                                InputLabelProps={{ shrink: true }}
                                disabled={true}
                            />
                            <Controller
                                name="otType"
                                control={control}
                                rules={{ required: "OT Type is required" }}
                                render={({ field }) => (
                                    <Select
                                        options={overTimeTypes}
                                        error={!!errors.otType}
                                        label="OT Type"
                                        placeholder="Select type"
                                        value={parseInt(watch("otType")) || null}
                                        onChange={(_, newValue) => {
                                            field.onChange(newValue?.id || null);
                                        }}
                                    />
                                )}
                            />
                        </div>
                        <div className='grid grid-cols-3 gap-4 mt-4'>
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
                                label="Total OT Minutes"
                                type={`text`}
                                value={watch("otMinutes") || 0}
                                InputLabelProps={{ shrink: true }}
                                disabled={true}
                            />
                            {
                                (watch("otType") === 1 || watch("otType") === 2) && (
                                    <Controller
                                        name="otAmount"
                                        control={control}
                                        rules={{
                                            required: watch("otType") !== 1 || watch("otType") !== 2 ? "OT Amount is required" : false,
                                        }}
                                        render={({ field }) => (
                                            <Input
                                                {...field}
                                                label="OT Amount"
                                                type={`text`}
                                                error={errors.otAmount}
                                                onChange={(e) => {
                                                    const numericValue = e.target.value.replace(/[^0-9]/g, '');
                                                    field.onChange(numericValue);
                                                }}
                                            />
                                        )}
                                        disabled={watch("otType") !== 1 && watch("otType") !== 2}
                                    />
                                )
                            }
                        </div>
                    </Components.DialogContent>

                    <Components.DialogActions>
                        <div className='flex justify-end'>
                            <Button type={`submit`} text={overTimeId ? "Update" : "Submit"} isLoading={loading} />
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

export default connect(null, mapDispatchToProps)(OvertimeRulesModel)
