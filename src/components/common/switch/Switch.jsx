import React from "react";
import Components from "../../muiComponents/components";
import { useTheme } from "@mui/material";

const Switch = ({ text, onChange, checked = false, size }) => {
    const theme = useTheme();

    return (
        <Components.FormGroup>
            <Components.Switch
                size={size}
                checked={checked}
                onChange={onChange}
                inputProps={{ 'aria-label': 'controlled' }}
            />
        </Components.FormGroup>
    );
};

export default Switch;
