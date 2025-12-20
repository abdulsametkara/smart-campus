const { User } = require('./models');
const { comparePassword } = require('./src/utils/password');
const bcrypt = require('bcrypt');

async function debugLogin(email, password) {
    try {
        console.log(`\n--- Debugging Login for: ${email} ---`);

        // 1. Check User Existence
        const user = await User.findOne({ where: { email } });
        if (!user) {
            console.log('❌ User NOT found in database.');
            return;
        }
        console.log('✅ User found.');
        console.log(`   - ID: ${user.id}`);
        console.log(`   - Role: ${user.role}`);
        console.log(`   - Email Verified: ${user.is_email_verified}`);
        console.log(`   - Failed Attempts: ${user.failed_login_attempts}`);
        console.log(`   - Account Locked Until: ${user.account_locked_until}`);
        console.log(`   - Password Hash in DB: ${user.password_hash.substring(0, 10)}...`);

        // 2. Check Password
        console.log(`\nTesting password: "${password}"`);

        // Manual bcrypt compare to be sure
        const compareResult = await bcrypt.compare(password, user.password_hash);
        console.log(`   - bcrypt.compare result: ${compareResult}`);

        if (compareResult) {
            console.log('✅ Password matches.');
        } else {
            console.log('❌ Password DOES NOT match.');

            // Try generating hash again to see what it looks like
            const newHash = await bcrypt.hash(password, 10);
            console.log(`   - If we re-hash '${password}', result: ${newHash.substring(0, 10)}...`);
        }

        // 3. Check App Logic Constraints
        if (!user.is_email_verified) {
            console.log('❌ Login blocked: is_email_verified is FALSE.');
        }

        if (user.account_locked_until && user.account_locked_until > new Date()) {
            console.log('❌ Login blocked: Account is LOCKED.');
        }

    } catch (error) {
        console.error('Debug Error:', error);
    }
}

// Check both the Admin and Student accounts created
async function run() {
    await debugLogin('omersahan_sofu22@erdogan.edu.tr', 'Campus123!');
    await debugLogin('test_student@campus.edu.tr', 'Campus123!');
}

run();
