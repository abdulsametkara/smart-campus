import api from './api';

// Sections API
export const sectionsService = {
  // Get all sections with filtering and pagination
  getAll: async (params = {}) => {
    const { course_id, semester, instructor_id, page = 1, limit = 20 } = params;
    const queryParams = new URLSearchParams();

    if (course_id) queryParams.append('course_id', course_id);
    if (semester) queryParams.append('semester', semester);
    if (instructor_id) queryParams.append('instructor_id', instructor_id);
    queryParams.append('page', page);
    queryParams.append('limit', limit);

    const response = await api.get(`/academic/sections?${queryParams.toString()}`);
    return response.data;
  },

  // Get section by ID
  getById: async (id) => {
    const response = await api.get(`/academic/sections/${id}`);
    return response.data;
  },

  // Create new section
  create: async (sectionData) => {
    const response = await api.post('/academic/sections', sectionData);
    return response.data;
  },

  // Update section
  update: async (id, sectionData) => {
    const response = await api.put(`/academic/sections/${id}`, sectionData);
    return response.data;
  },

  // Delete section
  delete: async (id) => {
    const response = await api.delete(`/academic/sections/${id}`);
    return response.data;
  },

  // Get students in a section
  getStudents: async (sectionId) => {
    const response = await api.get(`/academic/sections/${sectionId}/students`);
    return response.data;
  },

  // Assign instructor to section
  assignInstructor: async (sectionId, instructorId) => {
    const response = await api.put(`/academic/sections/${sectionId}/instructor`, {
      instructorId
    });
    return response.data;
  },

  // Enroll student to section
  enrollStudent: async (sectionId, email) => {
    const response = await api.post(`/academic/sections/${sectionId}/enroll`, {
      email
    });
    return response.data;
  },

  // Get instructor's own sections
  getMySections: async () => {
    const response = await api.get('/attendance/sections/my');
    return response.data;
  },

  // Get academic settings
  getSettings: async () => {
    const response = await api.get('/academic/settings');
    return response.data;
  },

  // Update settings
  updateSettings: async (key, value) => {
    const response = await api.put('/academic/settings', { key, value });
    return response.data;
  },

  // Trigger auto scheduling
  generateSchedule: async (semester = '2025-SPRING') => {
    const response = await api.post('/scheduling/generate', { semester });
    return response.data;
  }
};

// Courses API
export const coursesService = {
  // Get all courses with filtering and pagination
  getAll: async (params = {}) => {
    const { department_id, search, page = 1, limit = 20 } = params;
    const queryParams = new URLSearchParams();

    if (department_id) queryParams.append('department_id', department_id);
    if (search) queryParams.append('search', search);
    queryParams.append('page', page);
    queryParams.append('limit', limit);

    const response = await api.get(`/academic/courses?${queryParams.toString()}`);
    return response.data;
  },

  // Get course by ID
  getById: async (id) => {
    const response = await api.get(`/academic/courses/${id}`);
    return response.data;
  },

  // Create new course
  create: async (courseData) => {
    const response = await api.post('/academic/courses', courseData);
    return response.data;
  },

  // Update course
  update: async (id, courseData) => {
    const response = await api.put(`/academic/courses/${id}`, courseData);
    return response.data;
  },

  // Delete course
  delete: async (id) => {
    const response = await api.delete(`/academic/courses/${id}`);
    return response.data;
  }
};

// Enrollments API
export const enrollmentsService = {
  // Enroll to a section
  enroll: async (sectionId) => {
    const response = await api.post('/academic/enrollments', {
      section_id: sectionId
    });
    return response.data;
  },

  // Get my enrollments
  getMyEnrollments: async () => {
    const response = await api.get('/academic/enrollments/my-enrollments');
    return response.data;
  },

  // Drop enrollment
  drop: async (enrollmentId) => {
    const response = await api.delete(`/academic/enrollments/${enrollmentId}`);
    return response.data;
  }
};

// Classrooms API (for schedule)
export const classroomsService = {
  getAll: async () => {
    const response = await api.get('/academic/classrooms');
    return response.data;
  }
};

// Faculty API (for instructor dropdown)
export const usersService = {
  getFaculty: async () => {
    const response = await api.get('/academic/faculty');
    return response.data;
  }
};

