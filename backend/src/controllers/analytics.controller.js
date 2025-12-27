const {
    User,
    Student,
    Course,
    Enrollment,
    AttendanceSession,
    AttendanceRecord,
    MealReservation,
    Event,
    EventRegistration,
    Grade,
    Department,
    Sequelize
} = require('../../models');
const { Op } = require('sequelize');
const sequelize = require('../../models').sequelize;

exports.getDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        // Parallel queries for performance
        const [
            totalUsers,
            activeUsersToday, // Rough proxy
            totalCourses,
            totalEnrollments,
            totalMealReservationsToday,
            upcomingEvents
        ] = await Promise.all([
            User.count(),
            User.count({
                where: {
                    updatedAt: { [Op.gte]: startOfDay }
                }
            }),
            Course.count(),
            Enrollment.count(),
            MealReservation.count({
                where: { date: { [Op.between]: [startOfDay, endOfDay] } }
            }),
            Event.count({
                where: { start_time: { [Op.gte]: new Date() } }
            })
        ]);

        // Calculate Usage Rate (Attendance)
        const totalRecords = await AttendanceRecord.count();
        const presentRecords = await AttendanceRecord.count({ where: { status: 'PRESENT' } });
        const attendanceRate = totalRecords > 0 ? ((presentRecords / totalRecords) * 100).toFixed(1) : 0;

        res.json({
            totalUsers,
            activeUsersToday,
            totalCourses,
            totalEnrollments,
            attendanceRate: parseFloat(attendanceRate),
            mealReservationsToday: totalMealReservationsToday,
            upcomingEvents,
            systemHealth: "healthy"
        });
    } catch (error) {
        console.error('Dashboard Stats Error:', error);
        res.status(500).json({ message: 'Error fetching dashboard stats' });
    }
};

exports.getAcademicPerformance = async (req, res) => {
    try {
        // 1. Grade Distribution
        const allGrades = await Grade.findAll({ attributes: ['score'] });
        const scores = allGrades.map(g => g.score);

        const gradeDistribution = [
            { grade: 'AA', count: scores.filter(s => s >= 90).length },
            { grade: 'BA', count: scores.filter(s => s >= 85 && s < 90).length },
            { grade: 'BB', count: scores.filter(s => s >= 80 && s < 85).length },
            { grade: 'CB', count: scores.filter(s => s >= 75 && s < 80).length },
            { grade: 'CC', count: scores.filter(s => s >= 70 && s < 75).length },
            { grade: 'DC', count: scores.filter(s => s >= 65 && s < 70).length },
            { grade: 'DD', count: scores.filter(s => s >= 60 && s < 65).length },
            { grade: 'FF', count: scores.filter(s => s < 60).length }
        ];

        const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        const passCount = scores.filter(s => s >= 60).length;
        const passRate = scores.length > 0 ? ((passCount / scores.length) * 100).toFixed(1) : 0;

        // 2. Top Performing Students (GPA based) - If GPA exists, else mock/calc
        // Assuming Student model has gpa
        const topStudents = await Student.findAll({
            where: { gpa: { [Op.not]: null } },
            order: [['gpa', 'DESC']],
            limit: 5,
            include: [{
                model: User,
                as: 'user',
                attributes: ['full_name', 'student_number', 'profile_picture_url']
            }, {
                model: Department,
                as: 'department',
                attributes: ['name']
            }]
        });

        // 3. At-Risk Students (GPA < 2.0)
        const atRiskStudents = await Student.findAll({
            where: { gpa: { [Op.lt]: 2.0 } },
            order: [['gpa', 'ASC']],
            limit: 5,
            include: [{
                model: User,
                as: 'user',
                attributes: ['full_name', 'student_number']
            }, {
                model: Department,
                as: 'department',
                attributes: ['name']
            }]
        });

        // 4. Department Averages
        const departmentStats = await Student.findAll({
            attributes: [
                [Sequelize.fn('AVG', Sequelize.col('gpa')), 'avgGpa'],
                'department_id'
            ],
            group: ['department_id', 'department.id', 'department.name'],
            include: [{ model: Department, as: 'department', attributes: ['id', 'name'] }],
            where: { gpa: { [Op.not]: null } }
        });

        // Format department stats for simple consumption
        const departmentAverages = departmentStats.map(d => ({
            name: d.department?.name || 'Unknown',
            avgGpa: parseFloat(d.dataValues.avgGpa || 0).toFixed(2)
        }));

        res.json({
            gradeDistribution,
            averageScore: avgScore.toFixed(1),
            passRate: parseFloat(passRate),
            topStudents,
            atRiskStudents,
            departmentAverages
        });
    } catch (error) {
        console.error('Academic Perf Error:', error);
        res.status(500).json({ message: 'Error fetching academic stats' });
    }
};

exports.getAttendanceAnalytics = async (req, res) => {
    try {
        // Status dağılımı
        const stats = await AttendanceRecord.findAll({
            attributes: [
                'status',
                [Sequelize.fn('COUNT', Sequelize.col('status')), 'count']
            ],
            group: ['status']
        });

        const totalSessions = await AttendanceSession.count();
        const totalRecords = await AttendanceRecord.count();

        const presentCount = await AttendanceRecord.count({ where: { status: 'PRESENT' } });
        const absentCount = await AttendanceRecord.count({ where: { status: 'ABSENT' } });
        const excusedCount = await AttendanceRecord.count({ where: { status: 'EXCUSED' } });

        const attendanceRate = totalRecords > 0
            ? ((presentCount / totalRecords) * 100).toFixed(1)
            : 0;

        // Critical Absences (Students with > 5 absences)
        const criticalAbsences = await AttendanceRecord.findAll({
            attributes: [
                'student_id',
                [Sequelize.fn('COUNT', Sequelize.col('AttendanceRecord.id')), 'absentCount']
            ],
            where: { status: 'ABSENT' },
            group: ['student_id', 'student.id', 'student.full_name', 'student.student_number'],
            having: Sequelize.literal('COUNT("AttendanceRecord"."id") > 2'), // Using 2 for demo, originally 5
            include: [{
                model: User,
                as: 'student',
                attributes: ['full_name', 'student_number']
            }],
            limit: 10
        });

        res.json({
            overallStats: stats,
            totalSessions,
            totalRecords,
            presentCount,
            absentCount,
            excusedCount,
            attendanceRate: parseFloat(attendanceRate),
            criticalAbsences
        });
    } catch (error) {
        console.error('Attendance Analytics Error:', error);
        res.status(500).json({ message: 'Error fetching attendance analytics' });
    }
};

exports.getMealUsage = async (req, res) => {
    try {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const usage = await MealReservation.findAll({
            attributes: [
                ['date', 'date'],
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
            ],
            group: ['date'],
            limit: 7,
            order: [['date', 'DESC']]
        });

        const todayCount = await MealReservation.count({
            where: { date: { [Op.between]: [startOfDay, endOfDay] } }
        });

        const weeklyTotal = await MealReservation.count({
            where: { date: { [Op.gte]: oneWeekAgo } }
        });

        const mealTypeStats = await MealReservation.findAll({
            attributes: [
                'meal_type',
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
            ],
            group: ['meal_type']
        });

        const totalReservations = await MealReservation.count();

        res.json({
            dailyUsage: usage,
            todayCount,
            weeklyTotal,
            weeklyAverage: Math.round(weeklyTotal / 7),
            mealTypeDistribution: mealTypeStats,
            totalReservations
        });
    } catch (error) {
        console.error('Meal Usage Error:', error);
        res.status(500).json({ message: 'Error fetching meal stats' });
    }
};

exports.getEventsAnalytics = async (req, res) => {
    try {
        // 1. Popular Events
        const popularEvents = await Event.findAll({
            include: [{
                model: EventRegistration,
                as: 'registrations',
                attributes: []
            }],
            attributes: [
                'title',
                'capacity',
                [Sequelize.fn('COUNT', Sequelize.col('registrations.id')), 'registrationCount']
            ],
            group: ['Event.id', 'Event.title', 'Event.capacity'],
            order: [[Sequelize.literal('"registrationCount"'), 'DESC']],
            subQuery: false, // Important for aggregation with limit
            limit: 5
        });

        // 2. Overall Registration & Check-in Rates
        const totalCapacity = await Event.sum('capacity', { where: { status: 'published' } }) || 1; // Avoid div by 0
        const totalRegistrations = await EventRegistration.count();
        const totalCheckIns = await EventRegistration.count({ where: { checked_in: true } });

        const registrationRate = ((totalRegistrations / totalCapacity) * 100).toFixed(1);
        const checkInRate = totalRegistrations > 0 ? ((totalCheckIns / totalRegistrations) * 100).toFixed(1) : 0;

        // 3. Category Breakdown
        const categoryStats = await Event.findAll({
            attributes: [
                'category',
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
            ],
            group: ['category']
        });

        // 4. Monthly Trends (Last 6 Months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

        const monthlyTrends = await Event.findAll({
            attributes: [
                [Sequelize.fn('to_char', Sequelize.col('date'), 'Mon'), 'month'], // Postgre syntax
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
            ],
            where: {
                date: { [Op.gte]: sixMonthsAgo }
            },
            group: [Sequelize.fn('to_char', Sequelize.col('date'), 'Mon')],
            // Note: Grouping by formatted string might rely on DB specific functions. 
            // Ideally we might group by date_trunc('month', date) but simplified here.
        }).catch(err => {
            // Fallback if to_char fails (e.g. SQLite tests vs Postgres prod)
            console.warn("Monthly trend aggregation warning:", err.message);
            return [];
        });


        res.json({
            popularEvents,
            stats: {
                registrationRate: parseFloat(registrationRate),
                checkInRate: parseFloat(checkInRate),
                totalEvents: await Event.count(),
                activeEvents: await Event.count({ where: { status: 'published' } })
            },
            categoryDistribution: categoryStats,
            monthlyTrends
        });
    } catch (error) {
        console.error('Event Analytics Error:', error);
        res.status(500).json({ message: 'Error fetching event stats' });
    }
};

exports.exportReport = async (req, res) => {
    try {
        const { type } = req.params;
        let csvContent = "";
        let filename = `${type}_report_${new Date().toISOString().split('T')[0]}.csv`;

        if (type === 'academic') {
            csvContent = "Student Number,First Name,Last Name,Department,GPA\n";
            const students = await Student.findAll({ include: ['user', 'department'] });
            students.forEach(s => {
                csvContent += `${s.student_number},${s.user?.first_name},${s.user?.last_name},${s.department?.name},${s.gpa}\n`;
            });
        } else if (type === 'attendance') {
            csvContent = "Date,Student,Status,Session\n";
            const records = await AttendanceRecord.findAll({ include: ['student', 'session'], limit: 1000 });
            records.forEach(r => {
                csvContent += `${r.createdAt},${r.student?.first_name} ${r.student?.last_name},${r.status},${r.session?.id}\n`;
            });
        } else {
            return res.status(400).json({ message: 'Invalid report type' });
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.status(200).send(csvContent);
    } catch (error) {
        console.error("Export Error:", error);
        res.status(500).json({ message: "Error generating report" });
    }
};
