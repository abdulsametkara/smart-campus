import api from './api';

const gradingService = {
    // Exams
    createExam: (data) => api.post('/grading/exams', data),
    getSectionExams: (sectionId) => api.get(`/grading/exams/section/${sectionId}`),
    deleteExam: (id) => api.delete(`/grading/exams/${id}`),
    publishExam: (id, isPublished) => api.put(`/grading/exams/${id}/publish`, { is_published: isPublished }),

    // Grades
    submitGrades: (data) => api.post('/grading/grades', data), // data: { exam_id, grades: [] }
    getExamGrades: (examId) => api.get(`/grading/grades/exam/${examId}`),

    // Student
    getMyGrades: () => api.get('/grading/my-grades')
};

export default gradingService;
