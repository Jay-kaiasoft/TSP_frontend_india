import React, { useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import Components from '../../muiComponents/components';
import Button from '../../common/buttons/button';
import { Controller, useForm } from 'react-hook-form';
import Input from '../../common/input/input';
import { connect } from 'react-redux';
import { setAlert } from '../../../redux/commonReducers/commonReducers';
import CustomIcons from '../../common/icons/CustomIcons';
import { getHistory, updateSalaryStatement } from '../../../service/salaryStatementHistory/salaryStatementHistoryService';

const BootstrapDialog = styled(Components.Dialog)(({ theme }) => ({
    '& .MuiDialogContent-root': {
        padding: theme.spacing(2),
    },
    '& .MuiDialogActions-root': {
        padding: theme.spacing(1),
    },
}));

const filterOptions = [
    { id: 1, title: 'January', value: 1 },
    { id: 2, title: 'February', value: 2 },
    { id: 3, title: 'March', value: 3 },
    { id: 4, title: 'April', value: 4 },
    { id: 5, title: 'May', value: 5 },
    { id: 6, title: 'June', value: 6 },
    { id: 7, title: 'July', value: 7 },
    { id: 8, title: 'August', value: 8 },
    { id: 9, title: 'September', value: 9 },
    { id: 10, title: 'October', value: 10 },
    { id: 11, title: 'November', value: 11 },
    { id: 12, title: 'December', value: 12 }
];

function SalaryStatementModel({ setAlert, open, handleClose, id, handleGetStatements }) {

    const [loading, setLoading] = useState(false);
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));

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
            companyId: "",
            employeeId: "",
            employeeName: "",
            departmentId: "",
            departmentName: "",
            basicSalary: "",
            otAmount: "",
            pfAmount: "",
            totalPfAmount: "",
            pfPercentage: "",
            ptAmount: "",
            totalEarnings: "",
            otherDeductions: "",
            totalDeductions: "",
            netSalary: "",
            month: "",
            totalDays: "",
            totalWorkingDays: "",
            note: "",
        },
    });

    const onClose = () => {
        setLoading(false);
        reset({
            id: "",
            companyId: "",
            employeeId: "",
            employeeName: "",
            departmentId: "",
            departmentName: "",
            basicSalary: "",
            otAmount: "",
            pfAmount: "",
            totalPfAmount: "",
            pfPercentage: "",
            ptAmount: "",
            totalEarnings: "",
            otherDeductions: "",
            totalDeductions: "",
            netSalary: "",
            month: "",
            totalDays: "",
            totalWorkingDays: "",
        });
        handleClose();
    };

    const submit = async (data) => {
        const newData = {
            ...data,
            employeeId: userInfo.employeeId,
            companyId: userInfo.companyId,
            monthNumber: filterOptions?.find(option => option.title === data.monthYear?.split("-")[0])?.value || "",
            year: data.monthYear?.split("-")[1] || ""
        }
        if (id) {
            setLoading(true)
            const response = await updateSalaryStatement(id, newData);
            if (response?.data?.status === 200) {
                setAlert({ open: true, message: response.data.message, type: "success" })
                handleGetStatements()
                onClose();
            } else {
                setAlert({ open: true, message: response.data.message, type: 'error' });
                setLoading(false);
            }
        }
    }

    const handleGetData = async () => {
        if (!id) return;

        const response = await getHistory(id);
        if (response.data.status === 200) {
            reset(response.data.result);
        } else {
            setAlert({ message: response.data.message, type: 'error' });
        }
    };


    const calculateTotalEarnings = () => {
        const basicSalary = parseInt(watch("basicSalary")) || 0;
        const totalPaidDays = parseInt(watch("totalPaidDays")) || 0;
        const otAmount = parseInt(watch("otAmount")) || 0;

        const totalWorkingDays = parseInt(watch("totalWorkingDays")) || 0;

        const daySalary = parseInt(basicSalary / 30) || 0;
        const totalSalary = parseInt(daySalary * (totalWorkingDays + totalPaidDays));
        const totalEarnings = otAmount + totalSalary;

        setValue("totalEarnings", parseInt(totalEarnings) || 0);
    };

    const calculateNetSalary = () => {
        const totalEarnings = parseInt(watch("totalEarnings")) || 0;
        const totalDeductions = parseInt(watch("totalDeductions")) || 0;

        const netSalary = totalEarnings - totalDeductions;
        setValue("netSalary", parseInt(netSalary) || 0);
    };

    const calculateTotalPFPercentage = () => {
        const basicSalary = parseInt(watch("basicSalary")) || 0;
        const pfPercentage = parseInt(watch("pfPercentage")) || 0;
        const pfAmount = parseInt(watch("pfAmount")) || 0
        const ptAmount = parseInt(watch("ptAmount")) || 0;
        const otherDeductions = parseInt(watch("otherDeductions")) || 0;

        let totalPF = 0;
        if (pfPercentage > 0) {
            totalPF = parseInt((basicSalary * pfPercentage) / 100) > 900 ? 900 : parseInt((basicSalary * pfPercentage) / 100);
            setValue("totalPfAmount", parseInt(totalPF) > 900 ? 900 : parseInt(totalPF));
        }
        if (pfAmount > 0) {
            setValue("totalPfAmount", parseInt(pfAmount) > 200 ? 200 : parseInt(pfAmount));
        }

        const totalDeductions = totalPF + ptAmount + otherDeductions;
        setValue("totalDeductions", parseInt(totalDeductions) || 0);
    };


    useEffect(() => {
        calculateTotalEarnings();
        calculateTotalPFPercentage();
    }, [watch("otAmount"), watch("totalWorkingDays")]);

    useEffect(() => {
        calculateNetSalary();
    }, [watch("totalEarnings"), watch("otherDeductions"), watch("totalDeductions")]);

    useEffect(() => {
        calculateTotalPFPercentage();
    }, [watch("pfPercentage"), watch("pfAmount"), watch("ptAmount")]);

    useEffect(() => {
        handleGetData();
    }, [id])

    return (
        <React.Fragment>
            <BootstrapDialog
                open={open}
                aria-labelledby="customized-dialog-title"
                fullWidth
                maxWidth='md'
            >
                <Components.DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
                    Update Salary Statement
                </Components.DialogTitle>

                <Components.IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={(theme) => ({
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: theme.palette.grey[500],
                    })}
                >
                    <CustomIcons iconName={'fa-solid fa-xmark'} css='cursor-pointer text-black w-5 h-5' />
                </Components.IconButton>

                <form noValidate onSubmit={handleSubmit(submit)}>
                    <Components.DialogContent dividers>
                        <div className='grid grid-cols-6 mb-4 gap-4'>
                            <div className='flex justify-start items-center gap-2 col-span-2'>
                                <p>Employee Name :</p>
                                <span className='font-semibold'>{watch("employeeName")}</span>
                            </div>                       
                            <div className='flex justify-start items-center gap-2 col-span-2'>
                                <p>Basic Salary :</p>
                                <span className='font-semibold'>₹{parseInt(watch("basicSalary")).toLocaleString("en-IN")}</span>
                            </div>
                            <div className='flex justify-start items-center gap-2 col-span-2'>
                                <p>Total Paid Days :</p>
                                <span className='font-semibold'>{watch("totalPaidDays")}</span>
                            </div>
                        </div>

                        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                            <Controller
                                name="totalWorkingDays"
                                control={control}
                                rules={{
                                    required: "Working days is required",
                                }}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        label="Working Days"
                                        type="text"
                                        error={errors.totalWorkingDays}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/[^0-9]/g, '');
                                            if (parseInt(value) > parseInt(31)) {
                                                return;
                                            } else {
                                                field.onChange(value);
                                            }
                                        }}
                                    />
                                )}
                            />
                            <Controller
                                name="otAmount"
                                control={control}
                                rules={{
                                    required: "OT amount is required",
                                }}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        label="OT Amount"
                                        type={`text`}
                                        error={errors.otAmount}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/[^0-9]/g, '');
                                            field.onChange(value);
                                        }}
                                        endIcon={<CustomIcons iconName={`fa-solid fa-indian-rupee-sign`} css={'text-gray-500'} />}
                                    />
                                )}
                            />
                            {
                                watch("pfAmount") !== null ? (
                                    <Controller
                                        name="pfAmount"
                                        control={control}
                                        rules={{
                                            required: "PF amount is required",
                                        }}
                                        render={({ field }) => (
                                            <Input
                                                {...field}
                                                label="PF Amount"
                                                type={`text`}
                                                error={errors.pfAmount}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                                    if (parseInt(value) > 0) {
                                                        field.onChange(value);
                                                    }
                                                }}
                                                endIcon={<CustomIcons iconName={`fa-solid fa-indian-rupee-sign`} css={'text-gray-500'} />}
                                            />
                                        )}
                                    />
                                ) : watch("pfPercentage") !== null ? (
                                    <Controller
                                        name="pfPercentage"
                                        control={control}
                                        rules={{
                                            required: "PF percentage is required",
                                        }}
                                        render={({ field }) => (
                                            <Input
                                                {...field}
                                                label="PF Percentage"
                                                type={`text`}
                                                error={errors.pfPercentage}
                                                value={watch("pfPercentage") || ""}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                                    field.onChange(value);
                                                }}
                                                endIcon={<CustomIcons iconName={`fa-solid fa-percent`} css={'text-gray-500'} />}
                                            />
                                        )}
                                    />
                                ) : null
                            }
                            {
                                (watch("pfPercentage") !== null || watch("pfAmount") !== null) ? (
                                    <Input
                                        label="Total PF Amount"
                                        type={`text`}
                                        value={watch("totalPfAmount")}
                                        disabled
                                        endIcon={<CustomIcons iconName={`fa-solid fa-indian-rupee-sign`} css={'text-gray-500'} />}
                                    />
                                ) : null
                            }
                            <Controller
                                name="ptAmount"
                                control={control}
                                rules={{
                                    required: "PT amount is required",
                                }}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        label="PT Amount"
                                        type={`text`}
                                        error={errors.ptAmount}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/[^0-9]/g, '');
                                            field.onChange(value);
                                        }}
                                        endIcon={<CustomIcons iconName={`fa-solid fa-indian-rupee-sign`} css={'text-gray-500'} />}
                                    />
                                )}
                            />
                            <Controller
                                name="otherDeductions"
                                control={control}
                                rules={{
                                    required: "Other deductions is required",
                                }}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        label="Other Deductions"
                                        type={`text`}
                                        error={errors.otherDeductions}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/[^0-9]/g, '');
                                            field.onChange(value);
                                            calculateTotalPFPercentage();
                                        }}
                                        endIcon={<CustomIcons iconName={`fa-solid fa-indian-rupee-sign`} css={'text-gray-500'} />}
                                    />
                                )}
                            />
                        </div>

                        <div className='flex justify-start items-center my-2 gap-5'>
                            <div className='flex justify-start items-center gap-2'>
                                <p>Total Earnings :</p>
                                <span className='font-semibold'>₹{parseInt(watch("totalEarnings")).toLocaleString("en-IN")}</span>
                            </div>

                            <div className='flex justify-start items-center gap-2'>
                                <p>Total Deductions :</p>
                                <span className='font-semibold'>₹{parseInt(watch("totalDeductions")).toLocaleString("en-IN")}</span>
                            </div>

                            <div className='flex justify-start items-center gap-2'>
                                <p>Net Salary :</p>
                                <span className='font-semibold'>₹{parseInt(watch("netSalary")).toLocaleString("en-IN")}</span>
                            </div>
                        </div>

                        <div className='flex justify-start items-center my-2 gap-5'>
                            <Controller
                                name="note"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        label="Note"
                                        type="text"
                                        multiline={true}
                                        onChange={(e) => {
                                            field.onChange(e.target.value);
                                        }}
                                    />
                                )}
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

export default connect(null, mapDispatchToProps)(SalaryStatementModel)