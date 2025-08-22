import React from 'react'
import { connect } from 'react-redux';
import { setAlert } from '../../../../../redux/commonReducers/commonReducers';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '@mui/material';
import CustomIcons from '../../../../common/icons/CustomIcons';
import { Controller, useForm, useFieldArray } from 'react-hook-form';
import Input from '../../../../common/input/input';
import DatePickerComponent from '../../../../common/datePickerComponent/datePickerComponent';
import Components from '../../../../muiComponents/components';
import Button from '../../../../common/buttons/button';

function AddHolidaysTemplates({ setAlert }) {
    const navigate = useNavigate();
    const theme = useTheme();
    const { id } = useParams();
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));

    const {
        control,
        reset,
        setValue,
        handleSubmit,
        formState: { errors },
    } = useForm({
        defaultValues: {
            id: "",
            name: "",
            holidayTemplateDetails: [
                { id: "", name: "", date: null }
            ]
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "holidayTemplateDetails",
    });

    const onSubmit = (data) => {
        console.log("Holiday Template Data:", data);
    };

    return (
        <div className="px-4 lg:px-0">
            <div className="mb-4 w-60">
                <NavLink to={"/dashboard/automationrules/holidays/templates"}>
                    <div className="flex justify-start items-center gap-3">
                        <div style={{ color: theme.palette.primary.main }}>
                            <CustomIcons
                                iconName={"fa-solid fa-arrow-left"}
                                css="cursor-pointer h-4 w-4"
                            />
                        </div>
                        <p className="text-md capitalize">Back to templates</p>
                    </div>
                </NavLink>
            </div>

            <div className='border rounded-lg bg-white w-screen lg:w-full p-4'>
                <div className='grow mb-4'>
                    <h2 className='text-lg font-semibold'>Holidays Templates</h2>
                    <p className='text-gray-600'>
                        Create templates to auto-assign paid leave on public holidays.
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* Template Name */}
                    <div className='mb-4 w-60'>
                        <Controller
                            name="name"
                            control={control}
                            rules={{ required: "Template name is required" }}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    label="Template Name"
                                    type="text"
                                    error={errors.name}
                                />
                            )}
                        />
                    </div>

                    {/* List of Holidays */}
                    <div className='border-t border-gray-200'>
                        <div className='p-4 border-b border-gray-200 w-[35rem]'>
                            <div className='mb-3 flex justify-start items-center gap-3'>
                                <div className='grow'>
                                    <h3 className='text-md font-semibold capitalize'>List of Holidays</h3>
                                </div>
                                <div>
                                    <div
                                        onClick={() => append({ id: "", name: "", date: null })}
                                        className='bg-green-600 h-8 w-8 flex justify-center items-center rounded-full text-white cursor-pointer'
                                    >
                                        <Components.IconButton>
                                            <CustomIcons iconName={'fa-solid fa-plus'} css='text-white h-4 w-4' />
                                        </Components.IconButton>
                                    </div>
                                </div>
                            </div>

                            {fields.map((item, index) => (
                                <div key={item.id} className='flex justify-start items-center gap-3 mb-3'>
                                    <div>
                                        <Controller
                                            name={`holidayTemplateDetails.${index}.name`}
                                            control={control}
                                            rules={{ required: "Holiday name is required" }}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    label="Holiday Name"
                                                    type="text"
                                                    error={errors.holidayTemplateDetails?.[index]?.name}
                                                />
                                            )}
                                        />
                                    </div>

                                    <div>
                                        <DatePickerComponent
                                            setValue={setValue}
                                            control={control}
                                            name={`holidayTemplateDetails.${index}.date`}
                                            label="Holiday Date"
                                            minDate={null}
                                            maxDate={new Date(new Date().getFullYear(), 11, 31)}
                                            required={true}
                                        />
                                    </div>

                                    <div>
                                        <Components.IconButton onClick={() => remove(index)}>
                                            <CustomIcons iconName={'fa-solid fa-trash'} css='cursor-pointer text-red-600 h-4 w-4' />
                                        </Components.IconButton>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <div>
                            <Button
                                type="button"
                                useFor="disabled"
                                text="Cancel"
                                onClick={() => navigate("/dashboard/automationrules/holidays/templates")}
                            />
                        </div>
                        <div>
                            <Button type="submit" text="Submit" />
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}

const mapDispatchToProps = {
    setAlert,
};

export default connect(null, mapDispatchToProps)(AddHolidaysTemplates);
