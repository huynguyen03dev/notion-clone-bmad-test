// Test registration flow with a new user
const testUser = {
  name: "New Test User",
  email: "newuser@example.com",
  password: "testpassword123"
};

async function testRegistrationFlow() {
  try {
    console.log('Testing registration flow...');
    
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Registration successful:', data);
      console.log('User should now be redirected to /signin (not /auth/signin)');
    } else {
      console.log('❌ Registration failed:', data);
    }
    
  } catch (error) {
    console.error('Error testing registration:', error);
  }
}

testRegistrationFlow();
