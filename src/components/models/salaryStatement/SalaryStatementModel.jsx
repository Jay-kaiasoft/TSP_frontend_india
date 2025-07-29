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

function SalaryStatementModel({ setAlert, open, handleClose, id, handleGetStatements }) {

    const [loading, setLoading] = useState(false);

    const {
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
            otAmount: 0,
            pfAmount: 0,
            totalPfAmount: 0,
            pfPercentage: 0,
            ptAmount: 0,
            totalEarnings: 0,
            otherDeductions: 0,
            totalDeductions: 0,
            netSalary: 0,
            month: "",
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
            otAmount: 0,
            pfAmount: 0,
            totalPfAmount: 0,
            pfPercentage: 0,
            ptAmount: 0,
            totalEarnings: 0,
            otherDeductions: 0,
            totalDeductions: 0,
            netSalary: 0,
            month: "",
        });
        handleClose();
    };

    const submit = async (data) => {
        if (id) {
            setLoading(true)
            const response = await updateSalaryStatement(id, data);
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
                        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                            <Controller
                                name="employeeName"
                                control={control}
                                rules={{
                                    required: "Employee name is required",
                                }}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        label="Employee Name"
                                        type={`text`}
                                        error={errors.employeeName}
                                        onChange={(e) => {
                                            field.onChange(e);
                                        }}
                                    />
                                )}
                            />
                            <Controller
                                name="departmentName"
                                control={control}
                                rules={{
                                    required: "Department name is required",
                                }}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        label="Department Name"
                                        type={`text`}
                                        error={errors.departmentName}
                                        onChange={(e) => {
                                            field.onChange(e);
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
                                            const value = e.target.value.replace(/[^0-9.]/g, '');
                                            field.onChange(value);
                                        }}
                                    />
                                )}
                            />
                            <Controller
                                name="totalPfAmount"
                                control={control}
                                rules={{
                                    required: "PF amount is required",
                                }}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        label="PF Amount"
                                        type={`text`}
                                        error={errors.totalPfAmount}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/[^0-9.]/g, '');
                                            field.onChange(value);
                                        }}
                                    />
                                )}
                            />
                            <Controller
                                name="totalEarnings"
                                control={control}
                                rules={{
                                    required: "Total earnings is required",
                                }}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        label="Total Earnings"
                                        type={`text`}
                                        error={errors.totalEarnings}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/[^0-9.]/g, '');
                                            field.onChange(value);
                                        }}
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
                                            const value = e.target.value.replace(/[^0-9.]/g, '');
                                            field.onChange(value);
                                        }}
                                    />
                                )}
                            />
                            <Controller
                                name="totalDeductions"
                                control={control}
                                rules={{
                                    required: "Total deductions is required",
                                }}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        label="Total Deductions"
                                        type={`text`}
                                        error={errors.totalDeductions}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/[^0-9.]/g, '');
                                            field.onChange(value);
                                        }}
                                    />
                                )}
                            />
                            <Controller
                                name="netSalary"
                                control={control}
                                rules={{
                                    required: "Net salary is required",
                                }}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        label="Net Salary"
                                        type={`text`}
                                        error={errors.netSalary}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/[^0-9.]/g, '');
                                            field.onChange(value);
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
