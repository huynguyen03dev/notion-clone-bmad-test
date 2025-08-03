// Simple test script to test user login
const testCredentials = {
  email: "test@example.com",
  password: "testpassword123"
};

fetch('http://localhost:3000/api/auth/signin/credentials', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    email: testCredentials.email,
    password: testCredentials.password,
    redirect: 'false'
  })
})
.then(response => {
  console.log('Login response status:', response.status);
  return response.json();
})
.then(data => {
  console.log('Login response:', data);
})
.catch(error => {
  console.error('Error:', error);
});
