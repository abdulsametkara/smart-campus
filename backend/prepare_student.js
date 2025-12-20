const { User } = require('./models');
const { hashPassword } = require('./src/utils/password');

async function prepareStudent() {
    try {
        const email = 'test_student@campus.edu.tr';
        let user = await User.findOne({ where: { email } });
        const passwordHash = await hashPassword('Campus123!');

        if (user) {
            console.log(`Updating existing student: ${email}`);
            user.password_hash = passwordHash;
            user.failed_login_attempts = 0;
            user.account_locked_until = null;
            user.is_email_verified = true;
            await user.save();
        } else {
            console.log(`Creating new student: ${email}`);
            user = await User.create({
                full_name: 'Test Öğrenci',
                email: email,
                password_hash: passwordHash,
                role: 'student',
                is_email_verified: true
            });
        }

        console.log('✅ Student account ready.');
        console.log(`   - Email: ${email}`);
        console.log('   - Password: Campus123!');

    } catch (error) {
        console.error('Error:', error);
    }
}

prepareStudent();
