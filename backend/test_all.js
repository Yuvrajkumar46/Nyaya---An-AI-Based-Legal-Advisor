async function testAll() {
    try {
        console.log("Testing Login...");
        const loginRes = await fetch('http://localhost:5000/api/v1/auth/test-login', {
            method: 'POST', body: JSON.stringify({username: 'yuvraj', password: 'password123'}), headers: {'Content-Type': 'application/json'}
        });
        console.log("Login:", await loginRes.json());
        
        console.log("\nTesting Register...");
        const regRes = await fetch('http://localhost:5000/api/v1/users/register', {  // using authController.register
            method: 'POST', body: JSON.stringify({username: 'testusermysql', password: 'password123', fullName: 'Test User', email: 'test@mysql.com', phone: '1234567890'}), headers: {'Content-Type': 'application/json'}
        });
        console.log("Register:", await regRes.json());
        
    } catch(err) {
        console.error(err);
    }
}
testAll();
