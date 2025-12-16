import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SectionDetailPage from '../pages/SectionDetailPage';
import { sectionsService, enrollmentsService } from '../services/academicService';
import { AuthContext } from '../context/AuthContext';
import Swal from 'sweetalert2';

// Mock services
jest.mock('../services/academicService');
jest.mock('sweetalert2', () => ({
    fire: jest.fn()
}));

const mockUser = {
    id: 1,
    role: 'student',
    name: 'Test Student'
};

const mockSection = {
    id: 101,
    section_number: 1,
    course: { code: 'CENG101', name: 'Intro' },
    instructor: { full_name: 'Dr. Test' },
    semester: '2024-FALL',
    capacity: 50,
    enrolled_count: 10,
    is_full: false,
    available_spots: 40,
    schedule: [],
    enrollments: []
};

describe('Enrollment Flow Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        sectionsService.getById.mockResolvedValue(mockSection);
        enrollmentsService.enroll.mockResolvedValue({ success: true });
        Swal.fire.mockResolvedValue({ isConfirmed: true });
    });

    test('Student can enroll in a section successfully', async () => {
        render(
            <AuthContext.Provider value={{ user: mockUser }}>
                <MemoryRouter initialEntries={['/sections/101']}>
                    <Routes>
                        <Route path="/sections/:id" element={<SectionDetailPage />} />
                    </Routes>
                </MemoryRouter>
            </AuthContext.Provider>
        );

        // Wait for section load
        await waitFor(() => {
            expect(screen.getByText(/Intro/i)).toBeInTheDocument();
            expect(screen.getByText('Section 1')).toBeInTheDocument();
        });

        // Find Enroll button
        const enrollButton = screen.getByText('Kayıt Ol');
        expect(enrollButton).toBeInTheDocument();

        // Click Enroll
        fireEvent.click(enrollButton);

        // Verify Swal confirmation dialog appears
        await waitFor(() => {
            expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Derse Kayıt Ol',
                showCancelButton: true
            }));
        });

        // Verify service call
        await waitFor(() => {
            expect(enrollmentsService.enroll).toHaveBeenCalledWith(101);
        });

        // Verify success message
        await waitFor(() => {
            expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Talep Alındı ✅'
            }));
        });

        // Verify UI update (Pending badge)
        await waitFor(() => {
            expect(screen.getByText(/Danışman Onayı Bekliyor/i)).toBeInTheDocument();
        });
    });
});
