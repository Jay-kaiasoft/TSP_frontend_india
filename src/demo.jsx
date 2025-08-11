const Demo = () => {
  const clientId = '';
  const redirectUri = 'http://localhost:3000/oauth/callback'; // <-- This is correct

  const handleLogin = () => {
    const authUrl = `https://login.salesforce.com/services/oauth2/authorize` +
      `?response_type=code` +
      `&client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent('api refresh_token')}`;

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