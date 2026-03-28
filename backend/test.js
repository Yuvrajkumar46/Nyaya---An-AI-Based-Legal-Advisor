try {
  require('./server.js');
} catch (e) {
  const fs = require('fs');
  fs.writeFileSync('crash.txt', e.stack || e.toString());
  console.log('CRASH CAUGHT AND WRITTEN TO crash.txt');
  process.exit(1);
}
