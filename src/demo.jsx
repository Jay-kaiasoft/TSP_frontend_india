const Demo = () => {
  const clientId = '';
  const redirectUri = 'http://localhost:3000/oauth/callback'; // <-- This is correct
  const loginUrl = 'https://login.salesforce.com';

  const handleLogin = () => {
    const authUrl = `${loginUrl}/services/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=api20refresh_token`;
    window.location.href = authUrl;
  };

  return (
    <div>
      <h2>Login with Salesforce</h2>
      <button onClick={() => handleLogin()}>Login</button>
    </div>
  );
};

export default Demo;