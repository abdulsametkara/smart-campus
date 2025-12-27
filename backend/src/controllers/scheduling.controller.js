'use strict';

const schedulingService = require('../services/scheduling.service');

exports.generateSchedule = async (req, res) => {
    try {
        const { semester } = req.body;

        if (!semester) {
            return res.status(400).json({ message: 'Semester is required.' });
        }

        const schedule = await schedulingService.generateSchedule(semester);

        res.status(200).json({
            message: 'Schedule generated successfully',
            schedule
        });
    } catch (error) {
        console.error('Schedule generation error:', error);
        res.status(500).json({ message: error.message || 'Error generating schedule' });
    }
};

exports.saveSchedule = async (req, res) => {
    try {
        const { assignments } = req.body;

        if (!assignments) {
            return res.status(400).json({ message: 'Assignments data is required.' });
        }

        await schedulingService.saveSchedule(assignments);

        res.status(200).json({ message: 'Schedule saved successfully' });
    } catch (error) {
        console.error('Schedule save error:', error);
        res.status(500).json({ message: error.message || 'Error saving schedule' });
    }
};
