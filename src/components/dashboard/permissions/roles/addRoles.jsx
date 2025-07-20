import React, { useEffect, useState } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { getAllActions } from '../../../../service/actions/actionsService';
import Checkbox from '../../../common/checkBox/checkbox';
import { handleSetTitle, setAlert } from '../../../../redux/commonReducers/commonReducers';
import { connect } from 'react-redux';
import { createRole, getAllActionsByRole, getRole, updateRole } from '../../../../service/roles/roleService';
import Input from '../../../common/input/input';
import Button from '../../../common/buttons/button';
import { useParams, useNavigate } from 'react-router-dom';
import { createEmployeeRole, getAllEmployeeActionsByRole, getAllRoleActions, getEmployeeRole, updateEmployeeRole } from '../../../../service/companyEmployeeRole/companyEmployeeRoleService';
import { useTheme } from '@mui/material';

const AddRoles = ({ setAlert, handleSetTitle }) => {
    const theme = useTheme()

    const { id } = useParams();
    const navigate = useNavigate();
    const [headers, setHeaders] = useState([]);
    const [loading, setLoading] = useState(false);
    const userInfo = JSON.parse(localStorage.getItem("userInfo"))

    const {
        handleSubmit,
        control,
        setValue,
        watch,
        formState: { errors },
    } = useForm({
        defaultValues: {
            roleName: '',
            rolesActions: {
                functionalities: []
            }
        },
    });

    const { fields: functionalities, replace } = useFieldArray({
        control,
        name: 'functionalities',
    });

    const handleCheckboxChange = (funcIndex, moduleIndex, actionId, checked) => {
        const functionalities = watch('functionalities');

        const updatedModules = functionalities[funcIndex].modules.map((module, index) => {
            if (index === moduleIndex) {
                const updatedActions = checked
                    ? [...module.roleAssignedActions, actionId]
                    : module.roleAssignedActions.filter((id) => id !== actionId);

                return {
                    ...module,
                    roleAssignedActions: updatedActions,
                };
            }
            return module;
        });

        const updatedFunctionalities = functionalities?.map((func, index) => {
            if (index === funcIndex) {
                return {
                    ...func,
                    modules: updatedModules,
                };
            }
            return func;
        });

        setValue('functionalities', updatedFunctionalities);
    };

    const handleCheckAll = (checked) => {
        const updatedFunctionalities = watch('functionalities')?.map((func) => ({
            ...func,
            modules: func.modules.map((module) => ({
                ...module,
                roleAssignedActions: checked ? [...module.moduleAssignedActions] : [],
            })),
        }));

        setValue('functionalities', updatedFunctionalities);
    };

    const handleCheckAllFunctionalitiesModules = (funcIndex, checked) => {
        const updatedFunctionalities = [...watch('functionalities')];

        const modules = updatedFunctionalities[funcIndex]?.modules || [];

        modules.forEach((module) => {
            if (checked) {
                module.roleAssignedActions = [...new Set([...module.moduleAssignedActions])];
            } else {
                module.roleAssignedActions = [];
            }
        });
        setValue('functionalities', updatedFunctionalities);
    };

    const handleCheckAllModulesAction = (checked, actionId) => {
        const updatedFunctionalities = watch('functionalities').map((func) => ({
            ...func,
            modules: func.modules.map((module) => {
                const isActionAssignable = module.moduleAssignedActions.includes(actionId);
                return {
                    ...module,
                    roleAssignedActions: checked
                        ? isActionAssignable
                            ? [...new Set([...module.roleAssignedActions, actionId])] // Add actionId if assignable
                            : module.roleAssignedActions // No change if actionId is not assignable
                        : module.roleAssignedActions.filter((id) => id !== actionId), // Remove actionId if unchecked
                };
            }),
        }));

        setValue('functionalities', updatedFunctionalities);
    };

    const handleGetAllActions = async () => {
        if (userInfo?.employeeId && userInfo?.companyId) {
            const res = await getAllRoleActions();
            setHeaders(res.data.result);
        } else {
            const res = await getAllActions();
            setHeaders(res.data.result);
        }
    }

    const handleGetAllActionsByRole = async () => {
        if (id) {
            // handleSetTitle('Update Roles');
            if (!userInfo?.companyId && !userInfo?.employeeId) {
                const res = await getRole(id);
                setValue('roleName', res.data?.result?.role?.roleName);
                replace(res.data?.result?.role?.rolesActions?.functionalities);
            } else {
                const res = await getEmployeeRole(id);
                setValue('roleName', res.data?.result?.roleName);
                replace(res.data?.result?.rolesActions?.functionalities);
            }
        } else {
            // handleSetTitle('Add Roles');
            if (!userInfo?.companyId && !userInfo?.employeeId) {
                const res = await getAllActionsByRole(0);
                replace(res.data?.result?.functionalities);
            } else {
                const res = await getAllEmployeeActionsByRole(0)
                console.log("data?.result?.functionalities", res?.data?.result?.functionalities)
                replace(res.data?.result?.functionalities);
            }
        }
    }

    const handleSaveRole = async (data) => {
        setLoading(true);
        delete data.rolesActions
        if (id) {
            const newData = {
                roleName: data.roleName,
                roleId: id,
                companyId: userInfo?.companyId,
                rolesActions: {
                    functionalities: data.functionalities
                }
            }
            if (userInfo?.employeeId && userInfo?.companyId) {
                const res = await updateEmployeeRole(id, newData);
                if (res.data.status === 200) {
                    setLoading(false);
                
                    navigate('/dashboard/role');
                } else {
                    setLoading(false);
                    setAlert({ open: true, message: res.data.message, type: 'error' });
                }
            } else {
                const res = await updateRole(id, newData);
                if (res.data.status === 200) {
                    setLoading(false);
                    navigate('/dashboard/role');
                } else {
                    setLoading(false);
                    setAlert({ open: true, message: res.data.message, type: 'error' });
                }
            }
        } else {
            const newData = {
                roleName: data.roleName,
                companyId: userInfo?.companyId,
                rolesActions: {
                    functionalities: data.functionalities
                }
            }
            if (userInfo?.employeeId && userInfo?.companyId) {
                const res = await createEmployeeRole(newData);
                if (res.data.status === 201) {
                    // setAlert({ open: true, message: res.data.message, type: 'success' });
                    setLoading(false);
                    navigate('/dashboard/role');
                } else {
                    setLoading(false);
                    setAlert({ open: true, message: res.data.message, type: 'error' });
                }
            } else {
                const res = await createRole(newData);
                if (res.data.status === 201) {
                    setLoading(false);
                    navigate('/dashboard/role');
                } else {
                    setLoading(false);
                    setAlert({ open: true, message: res.data.message, type: 'error' });
                }
            }
        }
    }

    useEffect(() => {
        handleSetTitle("Role")
        handleGetAllActions();
        handleGetAllActionsByRole();
    }, []);

    return (
        <div className='px-3 lg:px-0'>
            <form onSubmit={handleSubmit(handleSaveRole)}>
                <div className='my-5 md:w-96'>
                    <Controller
                        name="roleName"
                        control={control}
                        rules={{
                            required: "Role name is required",
                        }}
                        render={({ field }) => (
                            <Input
                                {...field}
                                fullWidth
                                id="roleName"
                                placeholder="Enter role name"
                                label="Role Name*"
                                variant="outlined"
                                error={!!errors.roleName}
                                helperText={errors?.roleName?.message}
                            />
                        )}
                    />
                </div>
                <div className='overflow-x-auto'>
                    <table className="md:min-w-full border rounded-lg bg-white border-collapse border border-gray-300">
                        <thead>
                            <tr className="border-b static top-0">
                                <th style={{ color: theme.palette.primary.text.main, }} className="p-4 w-[30rem] text-left text-sm font-semibold">
                                    <div className='flex justify-start items-center'>
                                        <Checkbox
                                            checked={watch('functionalities')?.every((func) =>
                                                func.modules.every((module) =>
                                                    module.moduleAssignedActions.every((action) =>
                                                        module.roleAssignedActions.includes(action)
                                                    )
                                                )
                                            )}
                                            onChange={(e) => handleCheckAll(e.target.checked)}
                                        />
                                        <p>
                                            Functionality
                                        </p>
                                    </div>
                                </th>
                                <th style={{ color: theme.palette.primary.text.main, }} className="p-4 w-44 text-left text-sm font-semibold">Module</th>
                                {headers?.map((header, index) => (
                                    <th style={{ color: theme.palette.primary.text.main, }} key={index} className="p-4 text-sm font-semibold">
                                        <div>
                                            <p className='text-left mb-1'>{header?.actionName}</p>
                                            <Checkbox
                                                checked={watch('functionalities')?.every((func) =>
                                                    func.modules.every((module) =>
                                                        module.moduleAssignedActions.includes(header.actionId) &&
                                                        module.roleAssignedActions.includes(header.actionId))
                                                )}
                                                onChange={(e) => handleCheckAllModulesAction(e.target.checked, header.actionId)}
                                            />
                                        </div>
                                    </th>
                                ))}

                            </tr>
                        </thead>
                        <tbody>
                            {functionalities?.map((func, funcIndex) => (
                                <React.Fragment key={func.functionalityId}>
                                    <tr style={{ color: theme.palette.primary.text.main, }} className="border-b">
                                        <td
                                            className="p-4 text-sm font-medium"
                                            rowSpan={func.modules?.length + 1}
                                        >
                                            <div className='flex justify-start items-center'>
                                                <Checkbox
                                                    checked={func.modules?.every((module) =>
                                                        module.moduleAssignedActions.every((action) =>
                                                            module.roleAssignedActions.includes(action)
                                                        )
                                                    )}
                                                    onChange={(e) => handleCheckAllFunctionalitiesModules(funcIndex, e.target.checked)}
                                                />
                                                <p>
                                                    {func.functionalityName}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                    {func?.modules?.map((module, moduleIndex) => (
                                        <tr style={{ color: theme.palette.primary.text.main, }} key={module.moduleId} className="border-b">
                                            <td className="p-4 text-sm">{module.moduleName}</td>
                                            {headers?.map((header, headerIndex) => {
                                                const isActionAvailable = module.moduleAssignedActions.includes(header.actionId);

                                                // Explicitly return the <td> element
                                                return (
                                                    <td key={headerIndex} className="p-4 text-center">
                                                        {isActionAvailable ? (
                                                            <Controller
                                                                name={`functionalities.${funcIndex}.modules.${moduleIndex}.roleAssignedActions`}
                                                                control={control}
                                                                render={() => (
                                                                    <Checkbox
                                                                        checked={module.roleAssignedActions.includes(header.actionId)}
                                                                        onChange={(e) =>
                                                                            handleCheckboxChange(
                                                                                funcIndex,
                                                                                moduleIndex,
                                                                                header.actionId,
                                                                                e.target.checked
                                                                            )
                                                                        }
                                                                    />
                                                                )}
                                                            />
                                                        ) : null /* Render nothing if action is not available */}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}

                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className='flex justify-end mt-5 gap-3'>
                    <div>
                        <Button type="button" text={"Back"} variant="contained" color="primary" onClick={() => navigate("/dashboard/role")} />
                    </div>
                    <div>
                        <Button type="submit" text={id ? "Update role" : "Add role"} variant="contained" color="primary" isLoading={loading} />
                    </div>
                </div>
            </form>
        </div>
    )
}

const mapDispatchToProps = {
    setAlert,
    handleSetTitle
};

export default connect(null, mapDispatchToProps)(AddRoles)