// Test the complete authentication flow
const testUser = {
  email: "test@example.com",
  password: "testpassword123"
};

async function testAuthFlow() {
  try {
    console.log('Testing authentication flow...');
    
    // Test login via NextAuth
    const loginResponse = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: testUser.email,
        password: testUser.password,
        redirect: 'false',
        json: 'true'
      })
    });
    
    console.log('Login response status:', loginResponse.status);
    console.log('Login response headers:', Object.fromEntries(loginResponse.headers.entries()));
    
    const loginData = await loginResponse.text();
    console.log('Login response body:', loginData);
    
    // Test session endpoint
    const sessionResponse = await fetch('http://localhost:3000/api/auth/session');
    const sessionData = await sessionResponse.json();
    console.log('Session data:', sessionData);
    
  } catch (error) {
    console.error('Error testing auth flow:', error);
  }
}

testAuthFlow();
