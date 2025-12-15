const db = require('../models');

async function addPrereqs() {
    const courses = await db.Course.findAll();
    const codeToId = {};
    courses.forEach(c => { codeToId[c.code] = c.id; });

    console.log('Course map:', codeToId);

    const prereqs = [
        { course: 'CENG201', prereq: 'CENG101' },
        { course: 'CENG301', prereq: 'CENG201' },
        { course: 'CENG302', prereq: 'CENG201' },
        { course: 'CENG401', prereq: 'CENG301' },
        { course: 'EEE201', prereq: 'EEE101' },
        { course: 'MATH102', prereq: 'MATH101' }
    ];

    for (const p of prereqs) {
        const courseId = codeToId[p.course];
        const prereqId = codeToId[p.prereq];
        if (courseId && prereqId) {
            try {
                const sql = `INSERT INTO course_prerequisites (course_id, prerequisite_id, created_at, updated_at) VALUES (${courseId}, ${prereqId}, NOW(), NOW()) ON CONFLICT DO NOTHING`;
                await db.sequelize.query(sql);
                console.log('Added:', p.course, '<-', p.prereq);
            } catch (e) {
                console.log('Skip:', p.course, e.message);
            }
        } else {
            console.log('Missing course:', p.course, 'or prereq:', p.prereq);
        }
    }
    console.log('Done');
    process.exit();
}

addPrereqs().catch(e => { console.error(e); process.exit(1); });
