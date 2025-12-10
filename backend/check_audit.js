const fs = require('fs');
const path = require('path');
const LOG = path.join(__dirname, 'audit.log');

if (fs.existsSync(LOG)) {
    console.log('Audit Log Content:');
    console.log(fs.readFileSync(LOG, 'utf8'));
} else {
    console.error('Audit log not found!');
    process.exit(1);
}
