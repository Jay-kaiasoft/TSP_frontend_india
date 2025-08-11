import React, { useEffect } from 'react';
import axios from 'axios';

const OAuthCallback = () => {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    console.log("code",code)
    if (code) {
      // This is forwarding the code to the Express server on port 5000
      axios.get(`http://localhost:5000/oauth/callback?code=${code}`)
        .then(res => {
          alert('Access token retrieved!');
        })
        .catch(err => {
          alert('OAuth error: ' + err.response?.data || err.message);
        });
    } else {
      alert('Missing code in URL');
    }
  }, []);

  return <div>Processing Salesforce login...</div>;
};

export default OAuthCallback;