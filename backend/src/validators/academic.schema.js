const Joi = require('joi');

// Schedule item schema
const scheduleItem = Joi.object({
    day: Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday').required(),
    start: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).required().messages({
        'string.pattern.base': 'Start time must be in HH:MM format (24-hour)'
    }),
    end: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).required().messages({
        'string.pattern.base': 'End time must be in HH:MM format (24-hour)'
    }),
    room_id: Joi.number().integer().positive().optional()
});

// Create section schema
const createSection = Joi.object({
    body: Joi.object({
        course_id: Joi.number().integer().positive().required(),
        section_number: Joi.number().integer().positive().required(),
        semester: Joi.string().max(20).required().pattern(/^\d{4}-(FALL|SPRING|SUMMER)$/).messages({
            'string.pattern.base': 'Semester must be in format: YYYY-FALL, YYYY-SPRING, or YYYY-SUMMER'
        }),
        instructor_id: Joi.number().integer().positive().required(),
        capacity: Joi.number().integer().positive().required(),
        schedule: Joi.array().items(scheduleItem).optional().default([])
    }),
    query: Joi.object().empty({}),
    params: Joi.object().empty({})
});

// Update section schema
const updateSection = Joi.object({
    body: Joi.object({
        capacity: Joi.number().integer().positive().optional(),
        instructor_id: Joi.number().integer().positive().optional(),
        schedule: Joi.array().items(scheduleItem).optional()
    }).min(1).messages({
        'object.min': 'At least one field must be provided for update'
    }),
    query: Joi.object().empty({}),
    params: Joi.object({
        id: Joi.number().integer().positive().required()
    })
});

// Get sections query schema
const getSections = Joi.object({
    body: Joi.object().empty({}),
    query: Joi.object({
        course_id: Joi.number().integer().positive().optional(),
        semester: Joi.string().max(20).optional(),
        instructor_id: Joi.number().integer().positive().optional(),
        page: Joi.number().integer().positive().optional().default(1),
        limit: Joi.number().integer().positive().max(100).optional().default(20)
    }),
    params: Joi.object().empty({})
});

// Get section by ID schema
const getSectionById = Joi.object({
    body: Joi.object().empty({}),
    query: Joi.object().empty({}),
    params: Joi.object({
        id: Joi.number().integer().positive().required()
    })
});

// Delete section schema
const deleteSection = Joi.object({
    body: Joi.object().empty({}),
    query: Joi.object().empty({}),
    params: Joi.object({
        id: Joi.number().integer().positive().required()
    })
});

// Enrollment schemas
const enrollToSection = Joi.object({
    body: Joi.object({
        section_id: Joi.number().integer().positive().required()
    }),
    query: Joi.object().empty({}),
    params: Joi.object().empty({})
});

const getMyEnrollments = Joi.object({
    body: Joi.object().empty({}),
    query: Joi.object().empty({}),
    params: Joi.object().empty({})
});

const dropEnrollment = Joi.object({
    body: Joi.object().empty({}),
    query: Joi.object().empty({}),
    params: Joi.object({
        id: Joi.number().integer().positive().required()
    })
});

// Course schemas
const getCourses = Joi.object({
    body: Joi.object().empty({}),
    query: Joi.object({
        department_id: Joi.number().integer().positive().optional(),
        search: Joi.string().max(100).optional(),
        page: Joi.number().integer().positive().optional().default(1),
        limit: Joi.number().integer().positive().max(100).optional().default(20)
    }),
    params: Joi.object().empty({})
});

const getCourseById = Joi.object({
    body: Joi.object().empty({}),
    query: Joi.object().empty({}),
    params: Joi.object({
        id: Joi.number().integer().positive().required()
    })
});

const createCourse = Joi.object({
    body: Joi.object({
        code: Joi.string().max(20).required(),
        name: Joi.string().max(150).required(),
        description: Joi.string().optional(),
        credits: Joi.number().integer().positive().required(),
        ects: Joi.number().integer().positive().required(),
        department_id: Joi.number().integer().positive().required(),
        syllabus_url: Joi.string().uri().optional(),
        prerequisites: Joi.array().items(Joi.number().integer().positive()).optional()
    }),
    query: Joi.object().empty({}),
    params: Joi.object().empty({})
});

const updateCourse = Joi.object({
    body: Joi.object({
        name: Joi.string().max(150).optional(),
        description: Joi.string().optional(),
        credits: Joi.number().integer().positive().optional(),
        ects: Joi.number().integer().positive().optional(),
        department_id: Joi.number().integer().positive().optional(),
        syllabus_url: Joi.string().uri().optional(),
        prerequisites: Joi.array().items(Joi.number().integer().positive()).optional()
    }).min(1).messages({
        'object.min': 'At least one field must be provided for update'
    }),
    query: Joi.object().empty({}),
    params: Joi.object({
        id: Joi.number().integer().positive().required()
    })
});

const deleteCourse = Joi.object({
    body: Joi.object().empty({}),
    query: Joi.object().empty({}),
    params: Joi.object({
        id: Joi.number().integer().positive().required()
    })
});

module.exports = {
    createSection,
    updateSection,
    getSections,
    getSectionById,
    deleteSection,
    enrollToSection,
    getMyEnrollments,
    dropEnrollment,
    getCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse
};

