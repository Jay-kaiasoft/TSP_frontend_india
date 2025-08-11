import React, { useEffect, useState } from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Components from '../../muiComponents/components';
import Button from '../../common/buttons/button';
import { Controller, useForm } from 'react-hook-form';
import Input from '../../common/input/input';
import { connect } from 'react-redux';
import { setAlert } from '../../../redux/commonReducers/commonReducers';
import CustomIcons from '../../common/icons/CustomIcons';
import Select from '../../common/select/select';
import { addClockInOut } from '../../../service/userInOut/userInOut';
import InputTimePicker from '../../common/inputTimePicker/inputTimePicker';

const BootstrapDialog = styled(Components.Dialog)(({ theme }) => ({
    '& .MuiDialogContent-root': {
        padding: theme.spacing(2),
    },
    '& .MuiDialogActions-root': {
        padding: theme.spacing(1),
    },
}));

export function AddClockInOut({ open, handleClose, employeeList, getRecords }) {
    const theme = useTheme()

    const [loading, setLoading] = useState(false);
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
            timeIn: null,
            timeOut: null,
            userId: "",
        },
    });

    const onClose = () => {
        reset({
            timeIn: null,
            timeOut: null,
            userId: null,
        });
        setLoading(false);
        handleClose();
    };

    const submit = async (data) => {
        let newData = {
            ...data,
            companyId: userInfo?.companyId,
        }
        setLoading(true);
        try {
            const response = await addClockInOut(newData);
            if (response?.data?.status === 201) {
                setLoading(false);
                getRecords()
                onClose();
            } else {
                setLoading(false);
                setAlert({
                    open: true,
                    message: response?.data?.message || "Failed to add clock in/out",
                    type: "error",
                });
            }
        } catch (error) {
            console.error("Error submitting clock in/out:", error);
            setLoading(false);
            return;
        }
    }


    return (
        <React.Fragment>
            <BootstrapDialog
                open={open}
                // onClose={onClose}
                aria-labelledby="customized-dialog-title"
                fullWidth
                maxWidth='sm'
            >
                <Components.DialogTitle sx={{ m: 0, p: 2, color: theme.palette.primary.text.main }} id="customized-dialog-title">
                    Add Clock In/Out
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
                                name="userId"
                                control={control}
                                rules={{ required: "Employee is required" }}
                                render={({ field }) => (
                                    <Select
                                        options={employeeList || []}
                                        label={"Employee List"}
                                        placeholder="Select employees"
                                        value={parseInt(watch("userId")) || null}
                                        onChange={(_, newValue) => {
                                            if (newValue?.id) {
                                                field.onChange(newValue.id);
                                            } else {
                                                setValue("userId", null);
                                            }
                                        }}
                                        errors={errors?.userId}
                                    />
                                )}
                            />
                            <InputTimePicker
                                label="Clock In Time"
                                name="timeIn"
                                control={control}
                                rules={{
                                    required: "Clock in time is required",
                                }}
                                maxTime={watch("timeOut")}
                            />
                            <InputTimePicker
                                label="Clock Out Time"
                                name="timeOut"
                                control={control}
                                   rules={{
                                    required: "Clock out time is required",
                                }}
                                minTime={watch("timeIn")}
                            />
                        </div>
                    </Components.DialogContent>
                    <Components.DialogActions>
                        <div className='flex justify-end'>
                            <Button type={`submit`} text={"Submit"} isLoading={loading} />
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

export default connect(null, mapDispatchToProps)(AddClockInOut)
