const fs = require('fs');
const files = [
    './src/pages/billing/BillingPage.jsx',
    './src/pages/billing/AddMoneyPage.jsx',
    './src/pages/DashboardPage.jsx'
];
for (let f of files) {
    let doc = fs.readFileSync(f, 'utf8');
    doc = doc.replace(/\\`/g, '`').replace(/\\\$/g, '$');
    fs.writeFileSync(f, doc);
    console.log('Fixed ' + f);
}
