import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { useTheme } from "@mui/material";
import CustomIcons from "../../../../common/icons/CustomIcons";
import Input from "../../../../common/input/input";
import Checkbox from "../../../../common/checkBox/checkbox";
import Button from "../../../../common/buttons/button";
import { setAlert } from "../../../../../redux/commonReducers/commonReducers";
import { connect } from "react-redux";
import { createWeekOffTemplate, getWeekOffTemplate, updateWeekOffTemplate } from "../../../../../service/weeklyOff/WeeklyOffService";
import Components from "../../../../muiComponents/components";

const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
];

const weekColumns = [
    { key: "All", label: "All" },
    { key: "1st", label: "1st Week" },
    { key: "2nd", label: "2nd Week" },
    { key: "3rd", label: "3rd Week" },
    { key: "4th", label: "4th Week" },
    { key: "5th", label: "5th Week" },
];

const defaultWeeklyOff = days.reduce((acc, day) => {
    weekColumns.forEach((week) => {
        acc[`${day.toLowerCase()}${week.key}`] = false;
    });
    return acc;
}, {});

const AddWeekOfTemplates = ({ setAlert }) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { id } = useParams();
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));

    const {
        watch,
        control,
        reset,
        setValue,
        handleSubmit,
        formState: { errors },
    } = useForm({
        defaultValues: {
            id: "",
            name: "",
            description: "",
            ...defaultWeeklyOff,
        },
    });

    const onSubmit = async (data) => {
        const isAnyChecked = Object.keys(data).some(
            (key) => key !== "name" && data[key] === true
        );

        if (!isAnyChecked) {
            setAlert({ open: true, type: "warning", message: "Select at least one week" });
            return;
        }

        const newData = {
            ...data, createdBy: userInfo?.employeeId, companyId: userInfo?.companyId
        };

        if (id) {
            const response = await updateWeekOffTemplate(id, newData);
            if (response?.data?.status === 200) {
                navigate("/dashboard/automationrules/week-off/templates");
            } else {
                setAlert({ open: true, type: "error", message: "Failed to update template" });
            }
        } else {
            const response = await createWeekOffTemplate(newData);
            if (response?.data?.status === 201) {
                navigate("/dashboard/automationrules/week-off/templates");
            } else {
                setAlert({ open: true, type: "error", message: "Failed to create template" });
            }
        }
    };

    const handleAllChange = (day, checked) => {
        setValue(`${day.toLowerCase()}All`, checked);
        weekColumns.slice(1).forEach((week) => {
            setValue(`${day.toLowerCase()}${week.key}`, checked);
        });
    };

    const handleGetWeekOff = async () => {
        if (id) {
            const response = await getWeekOffTemplate(id);
            if (response?.data?.status === 200) {
                reset(response.data?.result);
            } else {
                setAlert({ open: true, type: "error", message: response?.data?.message || "Failed to fetch template" });
            }
        }
    }

    useEffect(() => {
        handleGetWeekOff();
    }, [id])

    return (
        <div className="px-4 lg:px-0">
            <div className="mb-4 w-60">
                <NavLink to={"/dashboard/automationrules/week-off/templates"}>
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

            <form
                onSubmit={handleSubmit(onSubmit)}
                className="border rounded-lg bg-white w-screen lg:w-full p-4"
            >
                <div className="grow mb-4">
                    <h2 className="text-lg font-semibold">Weekly Off Configuration</h2>
                </div>

                <div className="mb-4 flex justify-start items-center gap-4">
                    <div className="w-60">
                        <Controller
                            name="name"
                            control={control}
                            rules={{
                                required: "Template name is required",
                            }}
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
                    <div className="w-96">
                        <Controller
                            name="description"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    label="Template Description"
                                    type="text"
                                />
                            )}
                        />
                    </div>
                </div>

                <p className="text-sm mb-2 text-gray-600">
                    Select day and frequency for weekly off
                    <Components.Tooltip
                        title="Define which days of the week are designated as rest days. You can set a global weekly off by selecting 'All' or specify particular weeks for rotating schedules."
                        arrow
                        placement="top"
                    >
                        <span className="ml-3">
                            <CustomIcons
                                iconName={'fa-solid fa-circle-info'}
                                css='cursor-pointer text-gray-600 h-4 w-4'
                            />
                        </span>
                    </Components.Tooltip>
                </p>

                <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full text-sm border-collapse">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-3 text-left font-medium">Days</th>
                                {weekColumns.map((week) => (
                                    <th
                                        key={week.key}
                                        className="p-3 text-center font-medium whitespace-nowrap"
                                    >
                                        {week.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {days.map((day) => {
                                const allChecked = watch(`${day.toLowerCase()}All`);
                                return (
                                    <tr key={day} className="border-b">
                                        <td className="p-3">{day}</td>
                                        {weekColumns.map((week, index) => (
                                            <td key={week.key} className="p-3">
                                                <Controller
                                                    name={`${day.toLowerCase()}${week.key}`}
                                                    control={control}
                                                    render={({ field }) => (
                                                        <div className="flex justify-center">
                                                            <Checkbox
                                                                checked={field.value || false}
                                                                onChange={(e) => {
                                                                    if (week.key === "All") {
                                                                        handleAllChange(day, e.target.checked);
                                                                    } else {
                                                                        field.onChange(e.target.checked);
                                                                    }
                                                                }}
                                                                disabled={week.key !== "All" && allChecked}
                                                            />
                                                        </div>
                                                    )}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <div>
                        <Button
                            type="button"
                            useFor="disabled"
                            text="Cancel"
                            onClick={() => navigate("/dashboard/automationrules/week-off/templates")}
                        />
                    </div>
                    <div>
                        <Button type="submit" text="Submit" />
                    </div>
                </div>
            </form>
        </div>
    );
};

const mapDispatchToProps = {
    setAlert,
};

export default connect(null, mapDispatchToProps)(AddWeekOfTemplates);
