// Test password reset functionality
const testEmail = "test@example.com";

fetch('http://localhost:3000/api/auth/reset-password', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ email: testEmail })
})
.then(response => response.json())
.then(data => {
  console.log('Password reset response:', data);
  
  if (data.resetUrl) {
    console.log('Reset URL for testing:', data.resetUrl);
  }
})
.catch(error => {
  console.error('Error:', error);
});
