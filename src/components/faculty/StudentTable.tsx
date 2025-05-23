import { FaArrowLeft } from "react-icons/fa";
import { Link, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import Pagination from "./Pagination";

const headings = ["Select", "Student Name", "NSUT Roll No.", "Email"];

export type Student = {
    id: string;
    name: string;
    email: string;
    roll_number: string;
};

export type ApiResponse = {
    enrolled_students: Student[];
};

export type Result = {
    message: string;
    request_id: null;
    student_id: string;
    subject_id: string;
    success: boolean;
};

export type FileUploadResponse = {
    results: Result[];
};

export default function StudentTable() {
    const { subjectCode: urlSubjectCode } = useParams<{
        subjectCode: string;
    }>();
    const [error, setError] = useState(false);
    const [submitted, setSubmitted] = useState(0);
    const [isLoadingPost, setIsLoadingPost] = useState(false);
    const [apiCalled, setApiCalled] = useState(false);
    const location = useLocation();
    const subjectCode = urlSubjectCode;
    const subjectId = location.state?.subjectId;

    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [studentsNotSubmitted, setStudentsNotSubmitted] = useState<string[]>(
        []
    );
    const [dueDate, setDueDate] = useState(getDefaultDueDate());

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    function getDefaultDueDate() {
        const today = new Date();
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + 7);
        return futureDate.toISOString().split("T")[0];
    }

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleSelectAll = () => {
        if (!apiData?.enrolled_students) return;

        const allStudentIds = apiData.enrolled_students.map(
            (student) => student.id
        );
        const allSelected = allStudentIds.every((id) =>
            selectedStudents.includes(id)
        );

        if (allSelected) {
            setSelectedStudents([]);
        } else {
            // Otherwise, select all students
            setSelectedStudents(allStudentIds);
        }
    };

    // Function to handle student selection
    const handleStudentSelection = (studentId: string) => {
        setSelectedStudents((prev) => {
            if (prev.includes(studentId)) {
                return prev.filter((id) => id !== studentId);
            } else {
                return [...prev, studentId];
            }
        });
    };

    // Function to handle form submission (updated to use selected due date)
    const handleSubmit = async () => {
        if (selectedStudents.length === 0) {
            alert("Please select at least one student");
            return;
        }

        if (!dueDate) {
            alert("Please select a due date");
            return;
        }

        const dueDateObj = new Date(dueDate);
        dueDateObj.setMinutes(dueDateObj.getMinutes() - 330);

        const formattedData = {
            student_request_data_list: selectedStudents.map((studentId) => ({
                student_id: studentId,
                subject_id: subjectId,
                due_date: dueDateObj.toISOString(),
            })),
        };

        const apiUrl = import.meta.env.VITE_API_URL;
        setIsLoadingPost(true);
        try {
            console.log(formattedData)
            setStudentsNotSubmitted([])
            const response = await axios.post<FileUploadResponse>(
                `${apiUrl}/teacher/students/request`,
                formattedData,
                {
                    withCredentials: true,
                    headers: { "Content-Type": "application/json" },
                }
            );

            response.data.results.forEach((obj) => {
                if (obj.success === false) {
                    setStudentsNotSubmitted((prev) => [
                        ...prev,
                        obj.student_id,
                    ]);
                }

                if (obj.success === true) {
                    setSubmitted((prev) => prev + 1);
                }
            });
            
            setApiCalled(true);
            setSelectedStudents([]);
        } catch (error) {
            console.error("Error submitting request:", error);
            setError(true);
        }
        setIsLoadingPost(false);
    };

    const fetchData = async () => {
        const apiUrl = import.meta.env.VITE_API_URL;

        const { data } = await axios.get<ApiResponse>(
            `${apiUrl}/teacher/students/${subjectId}`,
            {
                withCredentials: true,
            }
        );

        return data;
    };

    const {
        data: apiData,
        error: apiError,
        isLoading,
    } = useQuery({
        queryKey: ["teacherRequestsStudents", subjectId],
        queryFn: fetchData,
        refetchOnWindowFocus: false,
    });

    const paginationData = useMemo(() => {
        if (!apiData?.enrolled_students) {
            return {
                currentPageData: [],
                totalPages: 0,
                totalItems: 0,
            };
        }

        const totalItems = apiData.enrolled_students.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentPageData = apiData.enrolled_students.slice(
            startIndex,
            endIndex
        );

        return {
            currentPageData,
            totalPages,
            totalItems,
        };
    }, [apiData?.enrolled_students, currentPage, itemsPerPage]);

    // Check if all students on current page are selected
    const areAllCurrentPageSelected = useMemo(() => {
        if (paginationData.currentPageData.length === 0) return false;
        return paginationData.currentPageData.every((student) =>
            selectedStudents.includes(student.id)
        );
    }, [paginationData.currentPageData, selectedStudents]);

    return (
        <>
            <div className="px-4 py-8 max-w-7xl mx-auto">
                <h1 className="text-center text-2xl font-semibold text-gray-800 mb-10 tracking-wider">
                    Student List
                </h1>

                {apiCalled && (
                    <div
                        className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4"
                        role="alert"
                    >
                        <span className="block sm:inline">
                            {" "}
                            {`Request submitted ${submitted}`}
                        </span>
                    </div>
                )}

                                {apiCalled && submitted > 0 && (
                    <div
                        className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4"
                        role="alert"
                    >
                        <span className="block sm:inline">
                            {`Request successfully sent to ${submitted} student${submitted !== 1 ? 's' : ''}`}
                        </span>
                    </div>
                )}

                {apiCalled && studentsNotSubmitted.length > 0 && (
                    <div
                        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
                        role="alert"
                    >
                        <span className="block sm:inline">
                            {`Request could not be sent to ${studentsNotSubmitted.length} student${studentsNotSubmitted.length !== 1 ? 's' : ''}. Please check if you are not sending request to the same student again.`}
                        </span>
                    </div>
                )}

                {error && (
                    <div
                        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
                        role="alert"
                    >
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                <div className="overflow-hidden rounded-lg shadow-md border border-gray-100 bg-white max-w-7xl mx-auto">
                    <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                        <div className="flex items-center">
                            <Link
                                to="/faculty/dashboard"
                                className="hover:bg-gray-200 p-2 rounded-full transition-colors"
                            >
                                <FaArrowLeft className="text-gray-600" />
                            </Link>
                            <h2 className="font-semibold ml-3 text-gray-800 md:text-xl">
                                {subjectCode}
                            </h2>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 mr-2">
                                Due Date:
                            </span>
                            <input
                                type="date"
                                value={dueDate}
                                min={new Date().toISOString().split("T")[0]}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            Loading
                        </div>
                    ) : apiError ? (
                        <div className="p-6 text-center text-red-500">
                            Error loading student data. Please try again.
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            areAllCurrentPageSelected &&
                                                            paginationData
                                                                .currentPageData
                                                                .length > 0
                                                        }
                                                        onChange={
                                                            handleSelectAll
                                                        }
                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                    />
                                                    <button
                                                        onClick={
                                                            handleSelectAll
                                                        }
                                                        className="text-xs text-blue-600 hover:text-blue-800"
                                                    >
                                                        {areAllCurrentPageSelected
                                                            ? "Deselect All"
                                                            : "Select All"}
                                                    </button>
                                                </div>
                                            </th>
                                            {headings
                                                .slice(1)
                                                .map((heading, idx) => (
                                                    <th
                                                        key={idx}
                                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                    >
                                                        {heading}
                                                    </th>
                                                ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {paginationData.currentPageData.length >
                                        0 ? (
                                            paginationData.currentPageData.map(
                                                (student) => (
                                                    <tr
                                                        key={student.id}
                                                        className={`
                            hover:bg-gray-50 transition-colors duration-150 cursor-pointer
                            ${
                                selectedStudents.includes(student.id)
                                    ? "bg-blue-50"
                                    : studentsNotSubmitted.includes(student.id)
                                    ? "bg-red-200 hover:bg-red-300 "
                                    : ""
                            }
                          `}
                                                        onClick={() =>
                                                            handleStudentSelection(
                                                                student.id
                                                            )
                                                        }
                                                    >
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedStudents.includes(
                                                                    student.id
                                                                )}
                                                                onChange={() => {}}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="font-medium text-gray-900">
                                                                {student.name}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                                                            {
                                                                student.roll_number
                                                            }
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                                                            {student.email}
                                                        </td>
                                                    </tr>
                                                )
                                            )
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan={headings.length}
                                                    className="px-6 py-10 text-center text-gray-500"
                                                >
                                                    No students found for this
                                                    subject.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Component */}
                            <Pagination
                                currentPage={currentPage}
                                totalPages={paginationData.totalPages}
                                onPageChange={handlePageChange}
                                itemsPerPage={itemsPerPage}
                                totalItems={paginationData.totalItems}
                            />

                            <div className="p-4 bg-gray-50 border-t border-gray-200">
                                <div className="flex flex-wrap items-center justify-end gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600">
                                            {selectedStudents.length} student
                                            {selectedStudents.length !== 1
                                                ? "s"
                                                : ""}{" "}
                                            selected
                                        </span>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={
                                                selectedStudents.length === 0 ||
                                                !dueDate || isLoadingPost
                                            }
                                            className= "inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                                
                                        >
                                            {isLoadingPost
                                                ? "Submitting Request"
                                                : "Submit Request"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
