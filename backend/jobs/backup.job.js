const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const backupDatabase = () => {
    console.log('Running Daily Backup...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '../backups');

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const fileName = `daily_backup_${timestamp}.sql`;
    const filePath = path.join(backupDir, fileName);

    // Command assumes pg_dump is in PATH and .env has DB credentials
    const command = `pg_dump -U ${process.env.DB_USER || 'admin'} -h ${process.env.DB_HOST || 'localhost'} ${process.env.DB_NAME || 'campus_db'} > "${filePath}"`;

    // Note: Password prompt might be an issue. PGPASSWORD env var should be set or .pgpass used.
    // For this implementation, we assume PGPASSWORD is set in process.env

    const env = { ...process.env, PGPASSWORD: process.env.DB_PASSWORD || 'campus123' };

    exec(command, { env }, (error, stdout, stderr) => {
        if (error) {
            console.error(`Backup failed: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`Backup stderr: ${stderr}`);
        }
        console.log(`Backup created successfully at ${filePath}`);
    });
};

// Run every night at 03:00
const job = cron.schedule('0 3 * * *', backupDatabase, {
    scheduled: false
});

module.exports = job;
