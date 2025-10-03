import { FaArrowLeft } from "react-icons/fa";
import { Link, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import Pagination from "./Pagination";
import SearchBar from "./SearchBar";
import { useAuthStore } from "../../store/useAuthStore";
import { TenureSelector } from "../ui/DropDown";
import TableSkeleton from "../ui/TableSkeleton";
import { toast } from "react-toastify";
import Papa from "papaparse";

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
    const [searchTerm, setSearchTerm] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [isUploadingCSV, setIsUploadingCSV] = useState(false);
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [isUpdatingDueDate, setIsUpdatingDueDate] = useState(false);

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


        const handleUpdateAllDueDates = async () => {
        if (!dueDate) {
            toast.error("Please select a due date");
            return;
        }

        const dueDateObj = new Date(dueDate);
        dueDateObj.setMinutes(dueDateObj.getMinutes() - 330);

        const apiUrl = import.meta.env.VITE_API_URL;
        setIsUpdatingDueDate(true);

        try {
            const response = await axios.put(
                `${apiUrl}/teacher/subject/update-due-date`,
                {
                    subject_id: subjectId,
                    due_date: dueDateObj.toISOString(),
                },
                {
                    withCredentials: true,
                    params: { year, sem },
                }
            );

            toast.success(
                response.data.message || "Due dates updated successfully"
            );
        } catch (error) {
            console.error("Error updating due dates:", error);

            if (axios.isAxiosError(error) && error.response?.status === 401) {
                toast.error("Unauthorized");
            } else {
                toast.error("Failed to update due dates");
            }
        }

        setIsUpdatingDueDate(false);
    };

    // Function to handle form submission (updated to use selected due date)
    const handleSubmit = async () => {
    if (selectedStudents.length === 0) {
        toast.error("Please select at least one student");
        return;
    }

    if (!dueDate) {
        toast.error("Please select a due date");
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

//        console.log("➡️ Sending request to backend:", {
//   url: `${apiUrl}/teacher/students/request`,
//   params: { year, sem },
//   body: formattedData,
// }); 


    
    try {
        setStudentsNotSubmitted([]);
        
        const response = await axios.post<FileUploadResponse>(
            `${apiUrl}/teacher/students/request`,
            formattedData,
            {
                withCredentials: true,
                headers: { "Content-Type": "application/json" },
                params: { year, sem }
            }
        );

        // Use local variables instead of immediate state updates
        let localSuccessCount = 0;
        const failedStudentIds:string[] = [];

        // Process response data
        response.data.results.forEach((obj) => {
            if (obj.success === false) {
                failedStudentIds.push(obj.student_id);
            } else if (obj.success === true) {
                localSuccessCount += 1;
            }
        });

        // Update state with final counts
        setStudentsNotSubmitted(failedStudentIds);
        setSubmitted(prev => prev + localSuccessCount);

        // Use local variables for toast (this will work correctly)
        if (localSuccessCount > 0) {
            toast.success(`Successfully sent requests to ${localSuccessCount} students`);
        }
        
        if (failedStudentIds.length > 0) {
            toast.error(`Failed to send requests to ${failedStudentIds.length} students`);
        }

        setApiCalled(true);
        setSelectedStudents([]);
        
    } catch (error) {
    console.error("Error submitting request:", error);
    
    // Type guard for AxiosError
    if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error("Unauthorized");
    } else {
        toast.error("Failed to submit");
    }

}

    
    setIsLoadingPost(false);
};

    const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setCsvFile(file);
        setIsUploadingCSV(true);

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const parsed = Papa.parse(text, { 
                header: true, 
                skipEmptyLines: true 
            });

            try {
                const emails = (parsed.data as any[])
                    .map((row) => row.email?.trim().toLowerCase())
                    .filter(Boolean);

                if (emails.length === 0) {
                    toast.error("No valid emails found in CSV");
                    setIsUploadingCSV(false);
                    return;
                }

                const matchedStudentIds = apiData?.enrolled_students
                    .filter((student) =>
                        emails.includes(student.email.toLowerCase())
                    )
                    .map((student) => student.id) || [];

                if (matchedStudentIds.length === 0) {
                    toast.warning("No matching students found");
                } else {
                    setSelectedStudents(matchedStudentIds);
                    toast.success(
                        `${matchedStudentIds.length} student${matchedStudentIds.length !== 1 ? 's' : ''} selected from CSV`
                    );
                }

                const notFound = emails.length - matchedStudentIds.length;
                if (notFound > 0) {
                    toast.info(`${notFound} email${notFound !== 1 ? 's' : ''} not found in enrollment`);
                }

                setIsUploadingCSV(false);
            } catch (error) {
                toast.error("Error processing CSV file");
                setIsUploadingCSV(false);
            }
        };
        
        reader.onerror = () => {
            toast.error("Failed to read CSV file");
            setIsUploadingCSV(false);
        };
        
        reader.readAsText(file);
        event.target.value = "";
    };


    const fetchData = async (year: number, sem: number) => {
        const apiUrl = import.meta.env.VITE_API_URL;

        const { data } = await axios.get<ApiResponse>(
            `${apiUrl}/teacher/students/${subjectId}`,
            {
                withCredentials: true,
                params: { year, sem }
            }


        );

        return data;
    };

    const { tenure } = useAuthStore();
    const year = tenure?.year;
    const sem = tenure?.is_odd;

    const {
        data: apiData,
        error: apiError,
        isLoading,
    } = useQuery({
        queryKey: ["teacherRequestsStudents", subjectId, year, sem],
        queryFn: () => fetchData(year as number, sem as number),
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

        const filteredStudents = apiData.enrolled_students.filter(
            (student) =>
                student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.roll_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.email.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const totalItems = filteredStudents.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentPageData = filteredStudents.slice(
            startIndex,
            endIndex
        );

        return {
            currentPageData,
            totalPages,
            totalItems,
            filteredStudents
        };
    }, [apiData?.enrolled_students, currentPage, itemsPerPage, searchTerm]);

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

                <div className="flex justify-center md:justify-end mb-6  max-w-7xl mx-auto">
                    <TenureSelector />
                </div>



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

                        <div className="flex flex-col items-center gap-2 md:flex-row">

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

                    <div className="p-4 border-b bg-gray-50">
                        <SearchBar
                            value={searchTerm}
                            onChange={(value) => {
                                setSearchTerm(value);
                                setCurrentPage(1);
                            }}
                            placeholder="Search by student name, roll number, or email"
                        />
                    </div>

                    {isLoading ? (
                        <TableSkeleton rows={5} cols={7} className="max-w-7xl mx-auto" />
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
                            ${selectedStudents.includes(student.id)
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
                                                                onChange={() => { }}
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
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <label className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer disabled:bg-gray-200 disabled:cursor-not-allowed">
                                                <input
                                                    type="file"
                                                    accept=".csv"
                                                    onChange={handleCSVUpload}
                                                    disabled={isUploadingCSV}
                                                    className="hidden"
                                                    id="csv-upload"
                                                />
                                                {isUploadingCSV
                                                    ? "Uploading..."
                                                    : "Upload CSV"}
                                            </label>
                                            {csvFile && (
                                                <div className="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-700 truncate max-w-xs">
                                                    {csvFile.name}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            CSV must include header: email
                                        </span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-center gap-3">
                                        <span className="text-sm text-gray-600">
                                            {selectedStudents.length} student
                                            {selectedStudents.length !== 1
                                                ? "s"
                                                : ""}{" "}
                                            selected
                                        </span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={
                                                    handleUpdateAllDueDates
                                                }
                                                disabled={
                                                    !dueDate ||
                                                    isUpdatingDueDate
                                                }
                                                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:cursor-not-allowed"
                                            >
                                                {isUpdatingDueDate
                                                    ? "Updating..."
                                                    : "Update All Due Dates"}
                                            </button>
                                            <button
                                                onClick={handleSubmit}
                                                disabled={
                                                    selectedStudents.length ===
                                                        0 ||
                                                    !dueDate ||
                                                    isLoadingPost
                                                }
                                                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                            >
                                                {isLoadingPost
                                                    ? "Submitting Request"
                                                    : "Submit Request"}
                                            </button>
                                        </div>
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