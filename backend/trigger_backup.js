const { backupDatabase } = require('./backup');
console.log('Triggering manual backup...');
const file = backupDatabase();
if (file) {
    console.log('Backup created successfully:', file);
} else {
    console.error('Backup failed.');
    process.exit(1);
}
