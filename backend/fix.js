const fs = require('fs');
let code = fs.readFileSync('e:/legal assitant/backend/src/controllers/billingController.js', 'utf8');
code = code.replace(/\\`/g, '`').replace(/\\\$/g, '$');
fs.writeFileSync('e:/legal assitant/backend/src/controllers/billingController.js', code);
console.log('Fixed');
