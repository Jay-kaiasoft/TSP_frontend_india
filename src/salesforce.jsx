import { create } from '@mui/material/styles/createTransitions';
import React, { useState, useEffect } from 'react';

const CLIENT_ID = "3MVG9dAEux2v1sLuQIep.f1x20O7jQa2bEavwD3fvCChoBlZAfO6Tkf.JWGX7B3ryuvweux2IHtPGrRygNITK";
const REDIRECT_URI = "http://localhost:5000/oauth/callback";
const LOGIN_URL = "https://login.salesforce.com";

const Salesforce = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Check token status on component mount
    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                const res = await fetch("http://localhost:5000/api/token-status");
                const data = await res.json();
                setIsLoggedIn(data.isAuthenticated);
            } catch (error) {
                console.error("Failed to fetch auth status:", error);
            }
        };
        checkAuthStatus();
    }, []);

    const handleLogin = () => {
        window.location.href = `${LOGIN_URL}/services/oauth2/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=api refresh_token`;
    };

    const createAccount = async () => {
        if (!isLoggedIn) return alert("Please log in first");

        try {
            const accountData = {
                name: "Acme Corporation",
                industry: "Technology",
                phone: "1234567890"
            };

            const res = await fetch("http://localhost:5000/create-account", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(accountData)
            });

            const data = await res.json();
            console.log("Account Created:", data);
            alert("Account created successfully!");
        } catch (error) {
            console.error("Error creating account:", error);
            alert("Failed to create account. Check console for details.");
        }
    };

    const getAccountDetails = async () => {
        const res = await fetch("http://localhost:5000/getAccount?id=001gL00000GxEifQAF");
        const data = await res.json();
        console.log("Account Details:", data);
    }

    const createOpportunity = async () => {
        const res = await fetch("http://localhost:5000/create-opportunity", {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });

        const data = await res.json();
        console.log("Opportunity Created:", data);
    };

    const getOpportunityDetails = async () => {
        const res = await fetch("http://localhost:5000/get-opportunity");
        const data = await res.json();
        console.log("Opportunity Details:", data);
    }

    const createContact = async () => {
        try {
            const res = await fetch("http://localhost:5000/create-contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });

            const data = await res.json();
            console.log("Contact Created:", data);
            alert("Contact created successfully!");
        } catch (error) {
            console.error("Error creating contact:", error);
            alert("Failed to create contact. Check console for details.");
        }
    }

    const createOpportunityRole = async () => {
        try {

            const res = await fetch("http://localhost:5000/create-opportunitycontactrole", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });

            const data = await res.json();
            console.log("Opportunity Role Created:", data);
            alert("Opportunity role created successfully!");
        } catch (error) {
            console.error("Error creating opportunity role:", error);
            alert("Failed to create opportunity role. Check console for details.");
        }
    }
    return (
        <div>
            <h2>Salesforce Integration</h2>
            {!isLoggedIn ? (
                <button onClick={handleLogin} className="bg-blue-500 text-white p-2 rounded">
                    Login with Salesforce
                </button>
            ) : (
                <>
                    <p>✅ Logged in to Salesforce</p>
                    <div className='flex justify-start items-center gap-4'>
                        <button onClick={createAccount} className="bg-green-500 text-white p-2 rounded">
                            Create Account
                        </button>
                        <button onClick={getAccountDetails} className="bg-blue-500 text-white p-2 rounded">
                            Get Account Details
                        </button>
                        <button onClick={createOpportunity} className="bg-red-500 text-white p-2 rounded">
                            Create Opportunity
                        </button>
                        <button onClick={getOpportunityDetails} className="bg-yellow-500 text-white p-2 rounded">
                            Get Opportunity
                        </button>
                        <button onClick={createContact} className="bg-purple-500 text-white p-2 rounded">
                            Create Contact
                        </button>
                        <button onClick={createOpportunityRole} className="bg-purple-500 text-white p-2 rounded">
                            Create Opportunity Role
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default Salesforce;