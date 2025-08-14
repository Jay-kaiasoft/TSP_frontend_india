import { useState, useEffect } from "react";

const Salesforce = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [accessToken, setAccessToken] = useState(null);
    const [instanceUrl, setInstanceUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [accounts, setAccounts] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [opportunities, setOpportunities] = useState([]);

    const handleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("http://localhost:8081/salesforce/connectToSalesforce", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            const data = await res.json();
            if (data.result?.url) {
                // Open Salesforce login in a popup window
                const width = 600;
                const height = 700;
                const left = window.screenX + (window.outerWidth - width) / 2;
                const top = window.screenY + (window.outerHeight - height) / 2;
                const popup = window.open(
                    data.result.url,
                    "Salesforce Login",
                    `width=${width},height=${height},left=${left},top=${top}`
                );

                // Poll the popup until it redirects back
                const popupInterval = setInterval(() => {
                    try {
                        if (!popup || popup.closed) {
                            clearInterval(popupInterval);
                            setLoading(false);
                            return;
                        }
                        // Check if the popup URL contains access_token
                        const popupUrl = popup.location.href;
                        if (popupUrl.includes("access_token=")) {
                            const params = new URLSearchParams(
                                popupUrl.split("#")[1] || popupUrl.split("?")[1]
                            );
                            const token = params.get("access_token");
                            const url = params.get("instance_url");

                            if (token && url) {
                                setAccessToken(token);
                                setInstanceUrl(url);
                                setIsLoggedIn(true);
                                popup.close();
                                clearInterval(popupInterval);
                                setLoading(false);
                            }
                        }
                        if (popupUrl.includes("error=")) {
                            setError("Salesforce authentication failed.");
                            popup.close();
                            clearInterval(popupInterval);
                            setLoading(false);
                        }
                    } catch (err) {
                        // Ignore cross-origin until redirect back
                    }
                }, 500);
            } else {
                setError("Failed to get Salesforce login URL.");
                setLoading(false);
            }
        } catch (err) {
            setError("Error connecting to the backend service.");
            setLoading(false);
        }
    };

    const fetchSalesforceData = async () => {
        try {

            // Fetch accounts
            const accRes = await fetch(`http://localhost:8081/salesforce/accounts?access_token=${accessToken}&instance_url=${encodeURIComponent(instanceUrl)}`, {
                method: "GET",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            const accData = await accRes.json();
            setAccounts(accData.result?.records || []);

            // Fetch contacts
            const conRes = await fetch(`http://localhost:8081/salesforce/contacts?access_token=${accessToken}&instance_url=${encodeURIComponent(instanceUrl)}`, {
                method: "GET",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            const conData = await conRes.json();
            setContacts(conData.result?.records || []);

            // Fetch opportunities
            const oppRes = await fetch(`http://localhost:8081/salesforce/opportunities?access_token=${accessToken}&instance_url=${encodeURIComponent(instanceUrl)}`,
                {
                    method: "GET",
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
            const oppData = await oppRes.json();
            setOpportunities(oppData.result?.records || []);
        } catch (err) {
            setError("Error fetching Salesforce data.");
        }
    };

    useEffect(() => {
        if (accessToken && instanceUrl) {
            fetchSalesforceData();
        }
    }, [accessToken, instanceUrl]);

    return (
        <div className="p-4">
            {loading && (
                <div className="flex justify-center items-center absolute h-screen bg-gray-200 w-screen opacity-50">
                    <p>Loading...</p>
                </div>
            )}
            <h2 className="text-xl font-bold mb-2">Salesforce Integration</h2>
            {error && <p className="text-red-500">Error: {error}</p>}
            <p>Access Token: {accessToken}</p>
            <p>Instance URL: {instanceUrl}</p>

            {!isLoggedIn ? (
                <button
                    onClick={handleLogin}
                    className="bg-blue-500 text-white p-2 rounded"
                >
                    Login with Salesforce
                </button>
            ) : (
                <>
                    <p className="mt-4">✅ Logged in to Salesforce</p>

                    <h3 className="text-lg font-semibold mt-4">Accounts</h3>
                    <table className="table-auto border-collapse border border-gray-300">
                        <thead>
                            <tr>
                                <th className="border p-2">Id</th>
                                <th className="border p-2">Name</th>
                            </tr>
                        </thead>
                        <tbody>
                            {accounts.map((acc) => (
                                <tr key={acc.Id}>
                                    <td className="border p-2">{acc.Id}</td>
                                    <td className="border p-2">{acc.Name}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <h3 className="text-lg font-semibold mt-4">Contacts</h3>
                    <table className="table-auto border-collapse border border-gray-300">
                        <thead>
                            <tr>
                                <th className="border p-2">Id</th>
                                <th className="border p-2">Name</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contacts.map((con) => (
                                <tr key={con.Id}>
                                    <td className="border p-2">{con.Id}</td>
                                    <td className="border p-2">{con.Name}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <h3 className="text-lg font-semibold mt-4">Opportunities</h3>
                    <table className="table-auto border-collapse border border-gray-300">
                        <thead>
                            <tr>
                                <th className="border p-2">Id</th>
                                <th className="border p-2">Name</th>
                            </tr>
                        </thead>
                        <tbody>
                            {opportunities.map((opp) => (
                                <tr key={opp.Id}>
                                    <td className="border p-2">{opp.Id}</td>
                                    <td className="border p-2">{opp.Name}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}
        </div>
    );
};

export default Salesforce;





// import React, { useState, useEffect } from 'react';

// const CLIENT_ID = "3MVG9dAEux2v1sLuQIep.f1x20O7jQa2bEavwD3fvCChoBlZAfO6Tkf.JWGX7B3ryuvweux2IHtPGrRygNITK";
// const REDIRECT_URI = "http://localhost:5000/oauth/callback";
// const LOGIN_URL = "https://login.salesforce.com";

// const Salesforce = () => {
//     const [isLoggedIn, setIsLoggedIn] = useState(false);
//     const [loading, setLoading] = useState(false);
//     const [accounts, setAccounts] = useState([]);
//     const [contacts, setContacts] = useState([]);
//     const [opportunities, setOpportunities] = useState([]);
//     // Check token status on component mount
//     useEffect(() => {
//         const checkAuthStatus = async () => {
//             try {
//                 const res = await fetch("http://localhost:5000/api/token-status");
//                 const data = await res.json();
//                 setIsLoggedIn(data.isAuthenticated);
//             } catch (error) {
//                 console.error("Failed to fetch auth status:", error);
//             }
//         };
//         checkAuthStatus();
//     }, []);

//     const handleLogin = () => {
//         window.location.href = `${LOGIN_URL}/services/oauth2/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=api refresh_token`;
//     };

//     const createAccount = async () => {
//         if (!isLoggedIn) return alert("Please log in first");

//         try {
//             const accountData = {
//                 name: "Acme Corporation",
//                 industry: "Technology",
//                 phone: "1234567890"
//             };

//             const res = await fetch("http://localhost:5000/create-account", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify(accountData)
//             });

//             const data = await res.json();
//             console.log("Account Created:", data);
//             alert("Account created successfully!");
//         } catch (error) {
//             console.error("Error creating account:", error);
//             alert("Failed to create account. Check console for details.");
//         }
//     };

//     const getAccountDetails = async () => {
//         const res = await fetch("http://localhost:5000/getAccount?id=001gL00000GxEifQAF");
//         const data = await res.json();
//         console.log("Account Details:", data);
//     }

//     const createOpportunity = async () => {
//         const res = await fetch("http://localhost:5000/create-opportunity", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" }
//         });

//         const data = await res.json();
//         console.log("Opportunity Created:", data);
//     };

//     const getOpportunityDetails = async () => {
//         const res = await fetch("http://localhost:5000/get-opportunity");
//         const data = await res.json();
//         console.log("Opportunity Details:", data);
//     }

//     const createContact = async () => {
//         try {
//             const res = await fetch("http://localhost:5000/create-contact", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//             });

//             const data = await res.json();
//             console.log("Contact Created:", data);
//             alert("Contact created successfully!");
//         } catch (error) {
//             console.error("Error creating contact:", error);
//             alert("Failed to create contact. Check console for details.");
//         }
//     }

//     const createOpportunityRole = async () => {
//         try {

//             const res = await fetch("http://localhost:5000/create-opportunitycontactrole", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//             });

//             const data = await res.json();
//             console.log("Opportunity Role Created:", data);
//             alert("Opportunity role created successfully!");
//         } catch (error) {
//             console.error("Error creating opportunity role:", error);
//             alert("Failed to create opportunity role. Check console for details.");
//         }
//     }

//     const getContactDetails = async () => {
//         const res = await fetch("http://localhost:5000/get-contact");
//         const data = await res.json();
//         console.log("Contact Details:", data);
//     }

//     const getAllData = async () => {
//         if (!isLoggedIn) {
//             return;
//         }
//         setLoading(true);
//         const accounts = await fetch("http://localhost:5000/accounts");
//         const opportunities = await fetch("http://localhost:5000/opportunities");
//         const contacts = await fetch("http://localhost:5000/contacts");

//         const [accountsData, opportunitiesData, contactsData] = await Promise.all([
//             accounts.json(),
//             opportunities.json(),
//             contacts.json()
//         ]);
//         setLoading(false);
//         console.log("All Data:", { accountsData, opportunitiesData, contactsData });
//         setAccounts(accountsData);
//         setOpportunities(opportunitiesData);
//         setContacts(contactsData);
//     }

//     useEffect(() => {
//         getAllData();
//     }, [isLoggedIn]);

//     return (
//         <div>
//             {
//                 loading && (
//                     <div className='flex justify-center items-center absolute h-screen bg-gray-200 w-screen opacity-50'>
//                         <p>Loading...</p>
//                     </div>
//                 )
//             }
//             <h2>Salesforce Integration</h2>
//             {!isLoggedIn ? (
//                 <button onClick={handleLogin} className="bg-blue-500 text-white p-2 rounded">
//                     Login with Salesforce
//                 </button>
//             ) : (
//                 <>
//                     <p>✅ Logged in to Salesforce</p>
//                     <h2 className="text-lg font-bold text-center"> =============== Accounts ===========</h2>
//                     <pre>{JSON.stringify(accounts, null, 2)}</pre>

//                     <h2 className="text-lg font-bold text-center"> =============== Contacts ===========</h2>
//                     <pre>{JSON.stringify(contacts, null, 2)}</pre>

//                     <h2 className="text-lg font-bold text-center"> =============== Opportunities ===========</h2>
//                     <pre>{JSON.stringify(opportunities, null, 2)}</pre>
//                     {/* <div className='flex justify-start items-center gap-4'>
//                         <button onClick={createAccount} className="bg-green-500 text-white p-2 rounded">
//                             Create Account
//                         </button>
//                         <button onClick={getAccountDetails} className="bg-blue-500 text-white p-2 rounded">
//                             Get Account Details
//                         </button>
//                         <button onClick={createOpportunity} className="bg-red-500 text-white p-2 rounded">
//                             Create Opportunity
//                         </button>
//                         <button onClick={getOpportunityDetails} className="bg-yellow-500 text-white p-2 rounded">
//                             Get Opportunity
//                         </button>
//                         <button onClick={createContact} className="bg-purple-500 text-white p-2 rounded">
//                             Create Contact
//                         </button>
//                         <button onClick={getContactDetails} className="bg-gray-500 text-white p-2 rounded">
//                             Get Contact
//                         </button>
//                         <button onClick={createOpportunityRole} className="bg-purple-500 text-white p-2 rounded">
//                             Create Opportunity Role
//                         </button>
//                     </div> */}
//                 </>
//             )}
//         </div>
//     );
// };

// export default Salesforce;