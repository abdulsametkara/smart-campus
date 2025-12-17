const CURRICULUM = {
    'CENG': [
        { code: 'CENG101', name: 'Introduction to Computer Engineering', credits: 3, ects: 5, prereq: null },
        { code: 'CENG102', name: 'Programming Concepts', credits: 4, ects: 6, prereq: 'CENG101' },
        { code: 'CENG201', name: 'Data Structures', credits: 4, ects: 6, prereq: 'CENG102' },
        { code: 'CENG202', name: 'Algorithms', credits: 3, ects: 5, prereq: 'CENG201' },
        { code: 'CENG301', name: 'Operating Systems', credits: 3, ects: 5, prereq: 'CENG102' },
        { code: 'CENG302', name: 'Database Management Systems', credits: 3, ects: 5, prereq: 'CENG201' },
        { code: 'CENG401', name: 'Computer Networks', credits: 3, ects: 5, prereq: 'CENG301' },
        { code: 'CENG402', name: 'Software Engineering', credits: 3, ects: 5, prereq: 'CENG201' }
    ],
    'EEE': [
        { code: 'EEE101', name: 'Introduction to Electrical Engineering', credits: 3, ects: 5, prereq: null },
        { code: 'EEE102', name: 'Circuit Theory I', credits: 4, ects: 6, prereq: 'EEE101' },
        { code: 'EEE201', name: 'Circuit Theory II', credits: 4, ects: 6, prereq: 'EEE102' },
        { code: 'EEE202', name: 'Digital Logic Design', credits: 3, ects: 5, prereq: null },
        { code: 'EEE301', name: 'Electronics I', credits: 3, ects: 5, prereq: 'EEE201' },
        { code: 'EEE302', name: 'Electromagnetics', credits: 3, ects: 5, prereq: 'EEE101' },
        { code: 'EEE401', name: 'Signals and Systems', credits: 3, ects: 5, prereq: 'EEE301' },
        { code: 'EEE402', name: 'Control Systems', credits: 3, ects: 5, prereq: 'EEE401' }
    ],
    'ME': [
        { code: 'ME101', name: 'Introduction to Mechanical Engineering', credits: 3, ects: 5, prereq: null },
        { code: 'ME102', name: 'Statics', credits: 3, ects: 5, prereq: null },
        { code: 'ME201', name: 'Dynamics', credits: 3, ects: 5, prereq: 'ME102' },
        { code: 'ME202', name: 'Thermodynamics I', credits: 3, ects: 5, prereq: null },
        { code: 'ME301', name: 'Fluid Mechanics', credits: 4, ects: 6, prereq: 'ME201' },
        { code: 'ME302', name: 'Machine Design', credits: 4, ects: 6, prereq: 'ME102' },
        { code: 'ME401', name: 'Heat Transfer', credits: 3, ects: 5, prereq: 'ME202' },
        { code: 'ME402', name: 'Materials Science', credits: 3, ects: 5, prereq: null }
    ],
    'IE': [
        { code: 'IE101', name: 'Introduction to Industrial Engineering', credits: 3, ects: 5, prereq: null },
        { code: 'IE102', name: 'Probability', credits: 3, ects: 5, prereq: null },
        { code: 'IE201', name: 'Engineering Statistics', credits: 3, ects: 5, prereq: 'IE102' },
        { code: 'IE202', name: 'Operations Research I', credits: 4, ects: 6, prereq: 'IE201' },
        { code: 'IE301', name: 'Operations Research II', credits: 4, ects: 6, prereq: 'IE202' },
        { code: 'IE302', name: 'Production Planning', credits: 3, ects: 5, prereq: 'IE201' },
        { code: 'IE401', name: 'Simulation', credits: 3, ects: 5, prereq: 'IE201' },
        { code: 'IE402', name: 'Quality Control', credits: 3, ects: 5, prereq: 'IE201' }
    ],
    'MED': [
        { code: 'MED101', name: 'Medical Biology', credits: 3, ects: 5, prereq: null },
        { code: 'MED102', name: 'Anatomy I', credits: 4, ects: 7, prereq: null },
        { code: 'MED201', name: 'Physiology', credits: 4, ects: 7, prereq: 'MED102' },
        { code: 'MED202', name: 'Biochemistry', credits: 3, ects: 5, prereq: 'MED101' },
        { code: 'MED301', name: 'Pathology', credits: 3, ects: 5, prereq: 'MED201' },
        { code: 'MED302', name: 'Pharmacology', credits: 3, ects: 5, prereq: 'MED202' },
        { code: 'MED401', name: 'Internal Medicine', credits: 5, ects: 8, prereq: 'MED301' },
        { code: 'MED402', name: 'General Surgery', credits: 5, ects: 8, prereq: 'MED301' }
    ],
    'LAW': [
        { code: 'LAW101', name: 'Introduction to Law', credits: 3, ects: 5, prereq: null },
        { code: 'LAW102', name: 'Roman Law', credits: 3, ects: 5, prereq: null },
        { code: 'LAW201', name: 'Constitutional Law', credits: 4, ects: 6, prereq: 'LAW101' },
        { code: 'LAW202', name: 'Civil Law', credits: 4, ects: 6, prereq: 'LAW101' },
        { code: 'LAW301', name: 'Criminal Law', credits: 3, ects: 5, prereq: 'LAW201' },
        { code: 'LAW302', name: 'Administrative Law', credits: 3, ects: 5, prereq: 'LAW201' },
        { code: 'LAW401', name: 'Commercial Law', credits: 3, ects: 5, prereq: 'LAW202' },
        { code: 'LAW402', name: 'International Law', credits: 3, ects: 5, prereq: 'LAW201' }
    ],
    'PSY': [
        { code: 'PSY101', name: 'Introduction to Psychology', credits: 3, ects: 5, prereq: null },
        { code: 'PSY102', name: 'Statistics for Psychology', credits: 3, ects: 5, prereq: null },
        { code: 'PSY201', name: 'Developmental Psychology', credits: 3, ects: 5, prereq: 'PSY101' },
        { code: 'PSY202', name: 'Social Psychology', credits: 3, ects: 5, prereq: 'PSY101' },
        { code: 'PSY301', name: 'Cognitive Psychology', credits: 3, ects: 5, prereq: null },
        { code: 'PSY302', name: 'Personality Theories', credits: 3, ects: 5, prereq: 'PSY101' },
        { code: 'PSY401', name: 'Abnormal Psychology', credits: 3, ects: 6, prereq: 'PSY201' },
        { code: 'PSY402', name: 'Clinical Psychology', credits: 3, ects: 6, prereq: 'PSY401' }
    ],
    'BUS': [
        { code: 'BUS101', name: 'Introduction to Business', credits: 3, ects: 5, prereq: null },
        { code: 'BUS102', name: 'Microeconomics', credits: 3, ects: 5, prereq: null },
        { code: 'BUS201', name: 'Macroeconomics', credits: 3, ects: 5, prereq: 'BUS102' },
        { code: 'BUS202', name: 'Financial Accounting', credits: 4, ects: 6, prereq: null },
        { code: 'BUS301', name: 'Marketing Management', credits: 3, ects: 5, prereq: 'BUS101' },
        { code: 'BUS302', name: 'Human Resource Management', credits: 3, ects: 5, prereq: 'BUS101' },
        { code: 'BUS401', name: 'Financial Management', credits: 3, ects: 5, prereq: 'BUS202' },
        { code: 'BUS402', name: 'Strategic Management', credits: 3, ects: 5, prereq: 'BUS301' }
    ]
};

module.exports = CURRICULUM;
