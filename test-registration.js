// Simple test script to test user registration
const testUser = {
  name: "Test User",
  email: "test@example.com",
  password: "testpassword123"
};

fetch('http://localhost:3000/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testUser)
})
.then(response => response.json())
.then(data => {
  console.log('Registration response:', data);
})
.catch(error => {
  console.error('Error:', error);
});
