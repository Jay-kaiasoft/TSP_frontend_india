import React, { useEffect, useState } from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Components from '../../muiComponents/components';
import Button from '../../common/buttons/button';
import { Controller, useForm } from 'react-hook-form';
import { connect } from 'react-redux';
import { setAlert } from '../../../redux/commonReducers/commonReducers';
import CustomIcons from '../../common/icons/CustomIcons';
import { getAllCompanyEmployee } from '../../../service/companyEmployee/companyEmployeeService';
import CheckBoxSelect from '../../common/select/checkBoxSelect';
import { assignHolidaysTemplate } from '../../../service/holidaysTemplates/holidaysTemplatesService';

const BootstrapDialog = styled(Components.Dialog)(({ theme }) => ({
    '& .MuiDialogContent-root': {
        padding: theme.spacing(2),
    },
    '& .MuiDialogActions-root': {
        padding: theme.spacing(1),
    },
}));

function AssignHolidayTemplate({ setAlert, open, handleClose, id, assignedEmployeeIds }) {
    const theme = useTheme()

    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState([]);
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    const {
        handleSubmit,
        control,
        reset,
        formState: { errors },
        setValue,
    } = useForm({
        defaultValues: {
            employeeIds: []
        },
    });

    const onClose = () => {
        setLoading(false);
        reset({
            employeeIds: []
        });
        handleClose();
    };

    const submit = async (data) => {
        const newData = {
            employeeIds: data.employeeIds,
            id: id
        }
        if (id) {
            setLoading(true)
            const response = await assignHolidaysTemplate(newData);
            if (response?.data?.status === 200) {
                setAlert({ open: true, message: response.data.message, type: "success" })
                onClose();
            } else {
                setAlert({ open: true, message: response.data.message, type: 'error' });
                setLoading(false);
            }

        }
    }

    const handleGetEmployees = async () => {
        setLoading(true);
        if (open) {
            const response = await getAllCompanyEmployee(userInfo?.companyId);
            if (response?.data?.status === 200) {
                const employeeList = response.data?.result?.map((employee) => ({
                    id: employee.employeeId,
                    title: employee.userName,
                }));
                setEmployees(employeeList);
                setValue('employeeIds', assignedEmployeeIds);
            } else {
                setAlert({ open: true, message: response.data.message, type: 'error' });
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        handleGetEmployees();
    }, [open]);

    return (
        <React.Fragment>
            <BootstrapDialog
                open={open}
                aria-labelledby="customized-dialog-title"
                fullWidth
                maxWidth='sm'
            >
                <Components.DialogTitle sx={{ m: 0, p: 2, color: theme.palette.primary.text.main }} id="customized-dialog-title">
                    Assign Holiday Template To Employees
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
                        <Controller
                            name="employeeIds"
                            control={control}
                            rules={{ required: 'Please select at least one employee' }}
                            render={({ field }) => {
                                const selectedOptions = employees.filter((emp) =>
                                    (field.value || []).includes(emp.id)
                                );

                                return (
                                    <CheckBoxSelect
                                        options={employees}
                                        label={"Select Employees"}
                                        placeholder="Select employees"
                                        value={selectedOptions}
                                        onChange={(event, newValue) => {
                                            // store only ids in form
                                            field.onChange(newValue.map((opt) => opt.id));
                                        }}
                                        error={errors.employeeIds}
                                        checkAll={true}
                                    />
                                );
                            }}
                        />
                    </Components.DialogContent>
                    <Components.DialogActions>
                        <div className='flex justify-end'>
                            <Button type={`submit`} text={"Assign"} isLoading={loading} />
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

export default connect(null, mapDispatchToProps)(AssignHolidayTemplate)
