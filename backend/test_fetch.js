const fs = require('fs');

async function testLogin() {
  try {
    const res = await fetch('http://localhost:5000/api/v1/auth/test-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: "yuvraj", password: "password123" }) 
    });
    const data = await res.json();
    fs.writeFileSync('fetch_output.json', JSON.stringify({ status: res.status, data }, null, 2));
  } catch (err) {
    fs.writeFileSync('fetch_output.json', JSON.stringify({ error: err.message }));
  }
}
testLogin();
