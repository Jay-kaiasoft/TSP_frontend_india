export const baseURL = process.env.REACT_APP_MAIN_BASE_URL

export const timeZoneBaseURL = "https://timeapi.io/api"

export const availableTimeZonesURL = `${timeZoneBaseURL}/timezone/availabletimezones`;
export const currentTimeZoneURL = `${timeZoneBaseURL}/Time/current/zone?timeZone=`;

export const faceRecognitionAPIBaseURL = process.env.REACT_APP_FACE_RECOGNITION_API_BASE_URL
export const faceRecognitionModelURL = process.env.REACT_APP_FACE_RECOGNITION_MODEL_URL

export const radarAPIURL = "https://api.radar.io/v1"
export const radarSKAPIKey = "prj_live_sk_6d98dc8a1d5176a349d7226de83908980e1d9a12"
export const radarPKAPIKey = "prj_live_pk_52c928de8697ee80316163c20c3708b53c3b3410"
export const googleMapAPIKey = "AIzaSyBcUSPQk75SXsr0aoSXt-cJNt06bqhNMEo"

export const timeZoneURL = baseURL + '/getTimezones'
export const userURL = baseURL + '/user'
export const departmentURL = baseURL + '/department'
export const rolesURL = baseURL + '/roles'
export const userShiftURL = baseURL + '/usershift'
export const contractorURL = baseURL + '/contractor'
export const employeeURL = baseURL + '/employee'
export const employeeTypeURL = baseURL + '/employeeType'
export const userInOutURL = baseURL + '/inout'
export const functionalityURL = baseURL + '/functionality'
export const moduleURL = baseURL + '/module'
export const actionURL = baseURL + '/actions'
export const fileUploadURL = baseURL + '/uploadFile'
export const locationURL = baseURL + '/location'
export const companyDetailsURL = baseURL + '/companyDetails'
export const companyThemeURL = baseURL + '/companyTheme'
export const companyEmployeeURL = baseURL + '/companyEmployee'
export const employeeRoleURL = baseURL + '/employeeRole'
export const employeeRoleActionURL = baseURL + '/companyRoleActions'

export const employeeTextInfoURL = baseURL + '/employeeTextInfo'
export const employeeBankInfoURL = baseURL + '/employeeBankInfo'
export const employeeEarningsURL = baseURL + '/employeeEarnings'
export const employeePayrollInfoURL = baseURL + '/employeePayrollInfo'
export const employmentInfoURL = baseURL + '/employmentInfo'
export const companyShiftURL = baseURL + '/companyShift'
export const companyFunctionalityURL = baseURL + '/companyFunctionality'
export const companyModuleURL = baseURL + '/companyModule'
export const companyActionsURL = baseURL + '/companyActions'
export const overtimeRulesURL = baseURL + '/overtimerules'

export const countryURL = baseURL + '/country'
export const stateURL = baseURL + '/state'
