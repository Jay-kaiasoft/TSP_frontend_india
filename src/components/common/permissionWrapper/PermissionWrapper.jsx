// import React from 'react';

// const PermissionWrapper = ({ component, functionalityName, moduleName, actionId }) => {
//     const permissionsData = JSON.parse(localStorage.getItem("permissions")) || [];
//     const userData = JSON.parse(localStorage.getItem("userInfo")) || [];

//     if (userData?.roleName === "Admin") {
//         return <>{component}</>;
//     }
        
//     const hasPermission = permissionsData?.some((item) =>
//         item?.functionalityName?.toLowerCase() === functionalityName?.toLowerCase() &&
//         item?.modules?.some((row) =>
//             row?.moduleName?.toLowerCase() === moduleName?.toLowerCase() &&
//             row?.roleAssignedActions?.length > 0 &&
//             row?.roleAssignedActions?.includes(actionId)
//         )
//     );

//     if (hasPermission) {
//         return <>{component}</>;
//     } else {
//         return null;
//     }
// };

// export default PermissionWrapper;

import React from 'react';

const PermissionWrapper = ({
    component,
    fallbackComponent = null,
    functionalityName,
    moduleName,
    actionId
}) => {
    const permissionsData = JSON.parse(localStorage.getItem("permissions")) || [];
    const userData = JSON.parse(localStorage.getItem("userInfo")) || [];

    // Allow Admins
    if (userData?.roleName === "Admin" || userData?.roleName === "Owner") {
        return <>{component}</>;
    }

    // Check permission
    const hasPermission = permissionsData?.some((item) =>
        item?.functionalityName?.toLowerCase() === functionalityName?.toLowerCase() &&
        item?.modules?.some((row) =>
            row?.moduleName?.toLowerCase() === moduleName?.toLowerCase() &&
            row?.roleAssignedActions?.includes(actionId)
        )
    );

    return hasPermission ? <>{component}</> : fallbackComponent;
};

export default PermissionWrapper;