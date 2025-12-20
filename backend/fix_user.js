const { User } = require('./models');
const { hashPassword } = require('./src/utils/password');

async function fixUser() {
    try {
        const email = 'omersahan_sofu22@erdogan.edu.tr';
        const user = await User.findOne({ where: { email } });

        if (!user) {
            console.log('User not found!');
            return;
        }

        console.log(`Updating user: ${email}`);

        // 1. Reset Password
        const newPassword = 'Campus123!';
        user.password_hash = await hashPassword(newPassword);

        // 2. Clear Locks and Verify
        user.failed_login_attempts = 0;
        user.account_locked_until = null;
        user.is_email_verified = true;

        await user.save();

        console.log('✅ User updated successfully.');
        console.log(`   - Password set to: ${newPassword}`);
        console.log('   - Account unlocked.');
        console.log('   - Email verified.');

    } catch (error) {
        console.error('Error:', error);
    }
}

fixUser();
