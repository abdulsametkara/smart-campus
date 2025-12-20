const { CourseSection } = require('./models');

async function checkSemesters() {
    try {
        const sections = await CourseSection.findAll({
            attributes: ['semester'],
            group: ['semester']
        });

        console.log('--- FOUND SEMESTERS IN DB ---');
        sections.forEach(s => console.log(`"${s.semester}"`));
        console.log('-----------------------------');

    } catch (error) {
        console.error('Error:', error);
    }
}

checkSemesters();
