import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { toast } from 'react-toastify';
import axios from 'axios';
import Papa from 'papaparse';

// Define Zod schema for validation
const TeacherSubjectSchema = z.object({
    email: z.string().email("Invalid email address"),
    course_code: z.string().min(1, "Course code is required")
});

const AllotmentFormSchema = z.object({
    teachers_data: z.array(TeacherSubjectSchema).min(1, "At least one faculty-subject pair is required"),
    year: z.number().int().min(2025, "Year must be 2025 or later").max(new Date().getFullYear(), "Year cannot be in the future"),
    sem: z.number().int().min(0, "Invalid semester value").max(1, "Invalid semester value")
});

type TeacherSubject = z.infer<typeof TeacherSubjectSchema>;
type AllotmentForm = z.infer<typeof AllotmentFormSchema>;

type AllotmentResult = {
    email: string;
    success: boolean;
    message: string;
    course_code: string;
};

type ApiResponse = {
    results: AllotmentResult[]
};

const FacultySubjects: React.FC = () => {
    const [teacherSubjects, setTeacherSubjects] = useState<TeacherSubject[]>([
        { email: '', course_code: '' }
    ]);
    const [year, setYear] = useState<number>(new Date().getFullYear());
    const [semester, setSemester] = useState<number>(0);
    const [inputMode, setInputMode] = useState<'manual' | 'csv'>('manual');
    const [operationMode, setOperationMode] = useState<'allot' | 'change'>('allot');
    const [csvData, setCsvData] = useState<TeacherSubject[]>([]);
    
    // API state management
    const [apiCalled, setApiCalled] = useState(false);
    const [successCount, setSuccessCount] = useState(0);
    const [errorResults, setErrorResults] = useState<AllotmentResult[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Generate years array from 2025 to current year
    const currentYear = new Date().getFullYear();
    const yearsArray = Array.from(
        { length: currentYear - 2025 + 1 },
        (_, i) => currentYear - i
    ).reverse();

    // Mutation for allotting teacher to subject (POST)
    const allotMutation = useMutation<
        ApiResponse,
        Error,
        AllotmentForm
    >({
        mutationFn: async (data) => {
            const apiUrl = import.meta.env.VITE_API_URL;
            const response = await axios.post(
                `${apiUrl}/admin/allot/teacher-subject`,
                data.teachers_data,
                {
                    params: {
                        year: data.year,
                        sem: data.sem
                    },
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    withCredentials: true,
                }
            );

            return response.data;
        },
        onSuccess: (data) => {
            handleMutationSuccess(data);
        },
        onError: (error) => {
            toast.error(`Failed to allot faculty: ${error.message}`);
            setIsSubmitting(false);
        },
    });

    // Mutation for changing faculty for subject (PUT)
    const changeMutation = useMutation<
        ApiResponse,
        Error,
        AllotmentForm
    >({
        mutationFn: async (data) => {
            const apiUrl = import.meta.env.VITE_API_URL;
            const response = await axios.put(
                `${apiUrl}/admin/allot/teacher-subject`,
                data.teachers_data,
                {
                    params: {
                        year: data.year,
                        sem: data.sem
                    },
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    withCredentials: true,
                }
            );

            return response.data;
        },
        onSuccess: (data) => {
            handleMutationSuccess(data);
        },
        onError: (error) => {
            toast.error(`Failed to change faculty: ${error.message}`);
            setIsSubmitting(false);
        },
    });

    const handleMutationSuccess = (data: ApiResponse) => {
        setApiCalled(true);
        
        let localSuccessCount = 0;
        const failedResults: AllotmentResult[] = [];

        data.results.forEach((result) => {
            if (result.success) {
                localSuccessCount += 1;
            } else {
                failedResults.push(result);
            }
        });

        setSuccessCount(localSuccessCount);
        setErrorResults(failedResults);

        if (localSuccessCount > 0) {
            const action = operationMode === 'allot' ? 'allotted' : 'changed';
            toast.success(`Successfully ${action} ${localSuccessCount} faculty-subject pairs`);
        }
        
        setTeacherSubjects([{ email: '', course_code: '' }]);
        setCsvData([]);
        setIsSubmitting(false);
    };

    const handleAddTeacherSubject = () => {
        setTeacherSubjects([...teacherSubjects, { email: '', course_code: '' }]);
    };

    const handleRemoveTeacherSubject = (index: number) => {
        const updatedTeacherSubjects = [...teacherSubjects];
        updatedTeacherSubjects.splice(index, 1);
        setTeacherSubjects(updatedTeacherSubjects);
    };

    const handleTeacherSubjectChange = (index: number, field: keyof TeacherSubject, value: string) => {
        const updatedTeacherSubjects = [...teacherSubjects];
        updatedTeacherSubjects[index] = {
            ...updatedTeacherSubjects[index],
            [field]: field === 'email' ? value.toLowerCase() : value,
        };
        setTeacherSubjects(updatedTeacherSubjects);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const formData: AllotmentForm = {
                teachers_data: teacherSubjects,
                year,
                sem: semester
            };

            AllotmentFormSchema.parse(formData);

            // Show confirmation for change operation
            if (operationMode === 'change') {
                const confirmChange = window.confirm(
                    'This will replace existing faculty assignments for these subjects. Are you sure you want to continue?'
                );
                if (!confirmChange) {
                    return;
                }
            }

            setIsSubmitting(true);
            
            // Call appropriate mutation based on operation mode
            if (operationMode === 'allot') {
                allotMutation.mutate(formData);
            } else {
                changeMutation.mutate(formData);
            }
        } catch (error) {
            if (error instanceof z.ZodError) {
                error.errors.forEach(err => {
                    toast.error(`Validation error: ${err.message}`);
                });
            }
        }
    };

    const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            toast.error('Please upload a valid CSV file');
            return;
        }

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                try {
                    const parsedData = results.data as any[];
                    const validatedData: TeacherSubject[] = [];

                    parsedData.forEach((row, index) => {
                        try {
                            if (!row.email || !row.course_code) {
                                throw new Error(`Row ${index + 1}: Missing required columns (email, course_code)`);
                            }

                            const validatedRow = TeacherSubjectSchema.parse({
                                email: row.email.trim().toLowerCase(),
                                course_code: row.course_code.trim()
                            });
                            validatedData.push(validatedRow);
                        } catch (error) {
                            if (error instanceof z.ZodError) {
                                toast.error(`Row ${index + 1}: ${error.errors[0].message}`);
                            } else {
                                toast.error(`${error}`);
                            }
                        }
                    });

                    if (validatedData.length > 0) {
                        setCsvData(validatedData);
                        setTeacherSubjects(validatedData);
                        toast.success(`Successfully parsed ${validatedData.length} faculty-subject pairs from CSV`);
                    }
                } catch (error) {
                    toast.error('Error parsing CSV file');
                }
            },
            error: (error) => {
                toast.error(`CSV parsing error: ${error.message}`);
            }
        });

        event.target.value = '';
    };

    const downloadCsvTemplate = () => {
        const template = [
            { email: 'faculty1@example.com', course_code: 'CS101' },
            { email: 'faculty2@example.com', course_code: 'CS102' }
        ];

        const csv = Papa.unparse(template);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'faculty_subjects_template.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleModeChange = (mode: 'manual' | 'csv') => {
        setInputMode(mode);
        if (mode === 'manual') {
            setTeacherSubjects([{ email: '', course_code: '' }]);
            setCsvData([]);
        }
    };

    const isPending = allotMutation.isPending || changeMutation.isPending;

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6">
                {operationMode === 'allot' ? 'Allot Faculty to Subjects' : 'Change Faculty for Subjects'}
            </h2>

            {apiCalled && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Successfully {operationMode === 'allot' ? 'Allotted' : 'Changed'}: </strong>
                    <span className="block sm:inline">{successCount} faculty-subject pairs</span>
                </div>
            )}

            {isPending && (
                <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-2">Processing {operationMode === 'allot' ? 'allotments' : 'changes'}...</span>
                </div>
            )}

            {errorResults.length > 0 && (
                <div className="mt-6 bg-white p-6 rounded-lg shadow-md mb-6">
                    <h3 className="text-lg font-medium mb-4 text-red-600">Failed Operations ({errorResults.length})</h3>
                    <div className="border rounded-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Faculty Email
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Course Code
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Error Message
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {errorResults.map((result, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {result.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {result.course_code}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                            {result.message}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Operation Mode Toggle */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Operation Type</label>
                    <div className="flex space-x-4">
                        <button
                            type="button"
                            onClick={() => setOperationMode('allot')}
                            className={`px-4 py-2 rounded-md ${operationMode === 'allot' 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                            Allot New Faculty
                        </button>
                        <button
                            type="button"
                            onClick={() => setOperationMode('change')}
                            className={`px-4 py-2 rounded-md ${operationMode === 'change' 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                            Change Faculty
                        </button>
                    </div>
                    {operationMode === 'change' && (
                        <p className="text-sm text-orange-600 mt-2">
                            ⚠️ This will replace existing faculty assignments for the selected subjects
                        </p>
                    )}
                </div>

                <div className="mb-6 grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                        <select
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value))}
                            className="w-full p-2 border border-gray-300 rounded-md"
                        >
                            {yearsArray.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Semester Type</label>
                        <select
                            value={semester}
                            onChange={(e) => setSemester(parseInt(e.target.value))}
                            className="w-full p-2 border border-gray-300 rounded-md"
                        >
                            <option value={1}>Odd Semester</option>
                            <option value={0}>Even Semester</option>
                        </select>
                    </div>
                </div>

                {/* Input Mode Toggle */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Input Method</label>
                    <div className="flex space-x-4">
                        <button
                            type="button"
                            onClick={() => handleModeChange('manual')}
                            className={`px-4 py-2 rounded-md ${inputMode === 'manual' 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                            Manual Entry
                        </button>
                        <button
                            type="button"
                            onClick={() => handleModeChange('csv')}
                            className={`px-4 py-2 rounded-md ${inputMode === 'csv' 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                            CSV Upload
                        </button>
                    </div>
                </div>

                {/* CSV Upload Section */}
                {inputMode === 'csv' && (
                    <div className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-lg font-semibold">CSV Upload</h3>
                            <button
                                type="button"
                                onClick={downloadCsvTemplate}
                                className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
                            >
                                Download Template
                            </button>
                        </div>
                        
                        <div className="mb-3">
                            <p className="text-sm text-gray-600 mb-2">
                                Upload a CSV file with columns: <strong>email</strong>, <strong>course_code</strong>
                            </p>
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleCsvUpload}
                                className="w-full p-2 border border-gray-300 rounded-md"
                            />
                        </div>

                        {csvData.length > 0 && (
                            <div className="mt-3">
                                <p className="text-sm text-green-600">
                                    ✓ {csvData.length} faculty-subject pairs loaded from CSV
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Manual Entry Section */}
                {inputMode === 'manual' && (
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-lg font-semibold">Faculty-Subject Pairs</h3>
                            <button
                                type="button"
                                onClick={handleAddTeacherSubject}
                                className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                            >
                                Add Pair
                            </button>
                        </div>

                        {teacherSubjects.map((pair, index) => (
                            <div key={index} className="mb-4 p-4 border border-gray-200 rounded-md">
                                <div className="grid grid-cols-2 gap-4 mb-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Teacher Email</label>
                                        <input
                                            type="email"
                                            value={pair.email}
                                            onChange={(e) => handleTeacherSubjectChange(index, 'email', e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                            placeholder="faculty@example.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code</label>
                                        <input
                                            type="text"
                                            value={pair.course_code}
                                            onChange={(e) => handleTeacherSubjectChange(index, 'course_code', e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                            placeholder="CS101"
                                        />
                                    </div>
                                </div>

                                {teacherSubjects.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTeacherSubject(index)}
                                        className="text-red-500 text-sm hover:text-red-700"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Show parsed data for both modes */}
                {teacherSubjects.length > 0 && teacherSubjects[0].email && (
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3">Preview ({teacherSubjects.length} pairs)</h3>
                        <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left">Email</th>
                                        <th className="px-3 py-2 text-left">Course Code</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {teacherSubjects.map((pair, index) => (
                                        <tr key={index} className="border-b border-gray-100">
                                            <td className="px-3 py-2">{pair.email}</td>
                                            <td className="px-3 py-2">{pair.course_code}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    className={`w-full py-2 rounded-md transition-colors ${
                        isSubmitting 
                            ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                            : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                    disabled={isSubmitting || teacherSubjects.length === 0 || !teacherSubjects[0].email}
                >
                    {isSubmitting 
                        ? 'Processing...' 
                        : operationMode === 'allot' 
                            ? 'Allot Faculty to Subjects' 
                            : 'Change Faculty for Subjects'}
                </button>
            </form>
        </div>
    );
};

export default FacultySubjects;