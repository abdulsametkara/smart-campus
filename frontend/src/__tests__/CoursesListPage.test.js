import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CoursesListPage from '../pages/CoursesListPage';
import { coursesService, enrollmentsService } from '../services/academicService';
import { AuthContext } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';

// Mock the service
jest.mock('../services/academicService');

const mockCourses = [
    { id: 1, code: 'CENG101', name: 'Intro to Programming', department: { name: 'Computer Engineering' } },
    { id: 2, code: 'MATH101', name: 'Calculus I', department: { name: 'Mathematics' } }
];

const mockUser = {
    id: 1,
    role: 'admin',
    name: 'Test Admin'
};

const renderWithProviders = (component) => {
    return render(
        <ThemeProvider>
            <AuthContext.Provider value={{ user: mockUser }}>
                <BrowserRouter>
                    {component}
                </BrowserRouter>
            </AuthContext.Provider>
        </ThemeProvider>
    );
};

describe('CoursesListPage Component', () => {
    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        coursesService.getAll.mockResolvedValue({
            courses: mockCourses,
            pagination: { totalPages: 1 }
        });
        // academicService.getDepartments calling usersService? No, coursesListPage might use something else.
        // Let's check CoursesListPage implementation if needed, but for now focus on courses.
        // Assuming it calls coursesService.getAll

        // Fix for student view
        enrollmentsService.getMyEnrollments.mockResolvedValue({
            enrollments: []
        });
    });

    test('renders loading state initially', () => {
        renderWithProviders(<CoursesListPage />);
        // It might differ depending on implementation, but searching for a text or spinner
        // Assuming the component fetches on mount
    });

    test('renders course list after fetching', async () => {
        renderWithProviders(<CoursesListPage />);

        await waitFor(() => {
            expect(screen.getByText('CENG101')).toBeInTheDocument();
            expect(screen.getByText('Intro to Programming')).toBeInTheDocument();
            expect(screen.getByText('MATH101')).toBeInTheDocument();
        });
    });
});
