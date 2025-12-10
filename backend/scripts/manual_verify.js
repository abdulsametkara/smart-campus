const db = require('../models');

const email = process.argv[2];

if (!email) {
    console.error('Please provide an email address.');
    console.log('Usage: node scripts/manual_verify.js <email>');
    process.exit(1);
}

const verifyUser = async () => {
    try {
        const user = await db.User.findOne({ where: { email } });
        if (!user) {
            console.error(`User with email ${email} not found.`);
            process.exit(1);
        }

        if (user.is_email_verified) {
            console.log(`User ${email} is already verified.`);
            process.exit(0);
        }

        user.is_email_verified = true;
        await user.save();
        console.log(`Successfully verified email for user: ${email}`);
        process.exit(0);
    } catch (error) {
        console.error('Error verifying user:', error);
        process.exit(1);
    }
};

verifyUser();
