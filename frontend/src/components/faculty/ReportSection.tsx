import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import SearchBar from "./SearchBar";
import { useEffect, useState } from "react";
import Pagination from "./Pagination";
import { RefreshCw } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";

const headings = [
    "Subject Code",
    "Subject Name",
    "Actions",
    "Pending",
    "Completed",
    "Rejected",
    "No Certificate",
    "Refresh",
];

export type Subject = {
    id: string;
    name: string;
    subject_code: string;
    teacher_id: string;
};

export type ApiResponse = {
    subjects: Subject[];
};

export type Student = {
    id: string;
    name: string;
    email: string;
    roll_number: string;
};

export type Request = {
    id: string;
    student: Student;
    subject: Subject;
    status: "pending" | "completed" | "rejected" | "no_certificate";
    verified_total_marks: string;
    created_at: string;
    due_date: string;
};

export type ApiResponseCSV = {
    requests: Request[];
};

interface StatusCounts {
    completed: number;
    pending: number;
    rejected: number;
    no_certificate: number;
}

interface Stats {
    [subjectId: string]: StatusCounts;
}

const apiUrl = import.meta.env.VITE_API_URL;

const fetchData = async (year:number ,sem:number) => {
    // Fetch subjects data
    const { data } = await axios.get<ApiResponse>(
        `${apiUrl}/teacher/subjects`,
        {
            withCredentials: true,
            params :{year,sem}
        }
    );

    // Fetch all requests data in parallel and create a Map for O(1) lookups
    const requestPromises = data.subjects.map(async (subject) => {
        const { data: requestData } = await axios.get<ApiResponseCSV>(
            `${apiUrl}/teacher/subject/requests/${subject.id}`,
            { withCredentials: true,
                params : {year,sem}
             }
        );
        return {
            subjectId: subject.id,
            requests: requestData.requests,
        };
    });

    // Wait for all requests to complete
    const requestsData = await Promise.all(requestPromises);

    // Create optimized stats object using single-pass processing
    const stats: Record<
        string,
        {
            completed: number;
            pending: number;
            rejected: number;
            no_certificate: number;
        }
    > = {};

    const totals = {
        completed: 0,
        pending: 0,
        rejected: 0,
        no_certificate: 0,
    };

    // Process each subject's requests in a single pass
    requestsData.forEach(({ subjectId, requests }) => {
        // Single reduce operation instead of 4 separate filter operations
        const statusCounts = requests.reduce(
            (acc, req) => {
                const status = req.status;
                acc[status] = (acc[status] || 0) + 1;
                return acc;
            },
            {
                completed: 0,
                pending: 0,
                rejected: 0,
                no_certificate: 0,
            }
        );

        stats[subjectId] = {
            completed: statusCounts.completed,
            pending: statusCounts.pending,
            rejected: statusCounts.rejected,
            no_certificate: statusCounts.no_certificate,
        };

        totals.completed += statusCounts.completed;
        totals.pending += statusCounts.pending;
        totals.rejected += statusCounts.rejected;
        totals.no_certificate += statusCounts.no_certificate;
    });

    return {
        subjects: data.subjects,
        stats: stats,
        totals: totals,
    };
};

const ReportSection = function () {
    const [stats, setStats] = useState<Stats>({});
    const { tenure } = useAuthStore();
        const year = tenure?.year;
        const sem = tenure?.is_even;

    const {
        data: apiData,
        error,
        isLoading,
    } = useQuery({
        queryKey: ["teacherRequestsStats",year,sem],
        queryFn: () =>fetchData(year as number,sem as number),
        staleTime : 60000,
        refetchOnWindowFocus: false,
    });

    useEffect(() => {
        if (apiData) {
            setStats(apiData.stats);
        }
    }, [apiData]);

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [CSVdata, setCSVData] = useState<Request[]>([]);
    const [disabled, setDisabled] = useState<boolean>(false);
    const itemsPerPage = 10;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    const handleClick = async (subjectIds: string[]) => {
        try {
            setDisabled(true);

            const allRequests: Request[] = [];

            for (const subjectId of subjectIds) {
                const { data } = await axios.get<ApiResponseCSV>(
                    `${apiUrl}/teacher/subject/requests/${subjectId}`,
                    {
                        withCredentials: true,
                        params:{year,sem}
                    }
                );

                if (data.requests && data.requests.length > 0) {
                    if (statusFilter === "all") {
                        allRequests.push(...data.requests);
                    } else {
                        const filteredRequests = data.requests.filter(
                            (request) => request.status === statusFilter
                        );
                        allRequests.push(...filteredRequests);
                    }
                }
            }

            if (allRequests.length > 0) {
                setCSVData(allRequests);
                downloadCSV(allRequests);
            } else {
                alert("No data available for download");
                setDisabled(false);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            alert("Error fetching data for download");
            setDisabled(false);
        }
    };

    const downloadCSV = (csvData?: Request[]) => {
        const dataToDownload = csvData || CSVdata;

        const headers = [
            "Student Name",
            "NSUT Roll No.",
            "Marks",
            "Subject Name",
            "Subject Code",
            "Status",
        ];

        const escapeCSV = (value: string) => {
            if (value == null || value === undefined) return "";
            const stringValue = String(value);
            if (
                stringValue.includes('"') ||
                stringValue.includes(",") ||
                stringValue.includes("\n")
            ) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        };

        const csvRows = [
            headers.join(","),
            ...dataToDownload.map((request) =>
                [
                    escapeCSV(request.student.name),
                    escapeCSV(request.student.roll_number),
                    escapeCSV(request.verified_total_marks),
                    escapeCSV(request.subject.name),
                    escapeCSV(request.subject.subject_code),
                    escapeCSV(request.status),
                ].join(",")
            ),
        ];

        const csvContent = csvRows.join("\n");

        try {
            const blob = new Blob([csvContent], {
                type: "text/csv;charset=utf-8;",
            });
            const link = document.createElement("a");

            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute(
                    "download",
                    `students_${new Date().toISOString().split("T")[0]}.csv`
                );
                link.style.visibility = "hidden";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }
        } catch (err) {
            console.error("Error generating CSV:", err);
            alert("Error generating CSV file");
        } finally {
            setCSVData([]);
            setDisabled(false);
        }
    };

    const handleRefresh = async (subjectId: string) => {
        setDisabled(true);
        const { data } = await axios.get<ApiResponseCSV>(
            `${apiUrl}/teacher/subject/requests/${subjectId}`,
            { withCredentials: true,
                params : {year,sem}
             }
        );

        const statusCounts = data.requests.reduce(
            (acc, req) => {
                const status = req.status;
                acc[status] = (acc[status] || 0) + 1;
                return acc;
            },
            {
                completed: 0,
                pending: 0,
                rejected: 0,
                no_certificate: 0,
            }
        );

        setStats((prevStats) => ({
            ...prevStats,
            [subjectId]: {
                completed: statusCounts.completed,
                pending: statusCounts.pending,
                rejected: statusCounts.rejected,
                no_certificate: statusCounts.no_certificate,
            },
        }));
        setDisabled(false);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm">
                <p>Error loading subjects: {(error as Error).message}</p>
            </div>
        );
    }

    if (
        !apiData ||
        !apiData.stats ||
        !apiData.subjects ||
        !apiData.totals ||
        apiData.subjects.length === 0
    ) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 text-center">
                <p className="text-gray-500">No subjects found</p>
            </div>
        );
    }

    const filteredSubjects = apiData.subjects.filter(
        (subject) =>
            subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            subject.subject_code
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
    );

    const totalItems = filteredSubjects.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedSubjects = filteredSubjects.slice(
        startIndex,
        startIndex + itemsPerPage
    );

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-center text-xl md:text-2xl font-semibold text-gray-800 tracking-wider">
                Report Section
            </h1>

            <div className="w-full flex flex-col justify-end space-x-2 mt-10 md:flex-row md:mt-0">
                <div className="flex flex-col">
                    <label
                        htmlFor="status-filter"
                        className="text-sm font-medium text-gray-700 mb-1 "
                    >
                        Download by Status:
                    </label>
                    <select
                        id="status-filter"
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700"
                    >
                        <option value="all">All Status</option>
                        <option value="completed">Completed</option>
                        <option value="rejected">Rejected</option>
                        <option value="no_certificate">No Certificate</option>
                        <option value="pending">Pending</option>
                    </select>
                </div>

                <button
                    className={`p-3 text-sm rounded-2xl my-4 transition-colors duration-200 md:p-4 md:text-md ${
                        disabled
                            ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                            : "bg-black text-white cursor-pointer hover:bg-gray-500"
                    }`}
                    disabled={disabled}
                    onClick={() =>
                        handleClick(
                            apiData.subjects.map((subject) => subject.id)
                        )
                    }
                >
                    Download all
                </button>
            </div>

            {disabled && (
                <h1 className="text-center px-2 py-1 font-semibold rounded-full bg-yellow-100 text-yellow-800 my-4">
                    This is a resource intense task and can take upto 5 minutes
                </h1>
            )}

            <div className="mb-4">
                <SearchBar
                    value={searchTerm}
                    onChange={(value) => {
                        setSearchTerm(value);
                        setCurrentPage(1);
                    }}
                    placeholder="Search by subject name or code"
                />
            </div>

            <div className="p-4 bg-blue-50 border-b">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                            {apiData?.totals?.completed || "0"}
                        </div>
                        <div className="text-sm text-gray-600">Completed</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                            {apiData?.totals?.pending || "0"}
                        </div>
                        <div className="text-sm text-gray-600">Pending</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                            {apiData?.totals?.rejected || "0"}
                        </div>
                        <div className="text-sm text-gray-600">Rejected</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-fuchsia-600">
                            {apiData?.totals?.no_certificate || "0"}
                        </div>
                        <div className="text-sm text-gray-600">
                            No Certificate
                        </div>
                    </div>
                </div>
            </div>

            <div className="overflow-x-scroll rounded-lg shadow-sm border border-gray-100 bg-white">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr className="text-sm font-medium text-gray-700">
                            {headings.map((heading, idx) => (
                                <th
                                    key={idx}
                                    className="px-6 py-4 text-center "
                                >
                                    {heading}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {paginatedSubjects.map((subject) => (
                            <tr
                                key={subject.id}
                                className="hover:bg-gray-50 transition-colors duration-200 text-center"
                            >
                                <td className="px-6 py-4 ">
                                    {subject.subject_code}
                                </td>
                                <td className="px-6 py-4">{subject.name}</td>

                                <td className="px-6 py-4 text-center whitespace-nowrap text-gray-700">
                                    <div>
                                        <button
                                            className={`py-2 px-4 rounded-md shadow-md transition-all duration-300 transform ${
                                                disabled
                                                    ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                                                    : "text-black hover:scale-105 hover:bg-black hover:text-white cursor-pointer"
                                            }`}
                                            onClick={() =>
                                                handleClick([subject.id])
                                            }
                                            disabled={disabled}
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {stats[subject.id]?.pending || "0"}
                                </td>
                                <td className="px-6 py-4">
                                    {stats[subject.id]?.completed || "0"}
                                </td>
                                <td className="px-6 py-4">
                                    {stats[subject.id]?.rejected || "0"}
                                </td>
                                <td className="px-6 py-4">
                                    {stats[subject.id]?.no_certificate || "0"}
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        disabled={disabled}
                                        onClick={() =>
                                            handleRefresh(subject.id)
                                        }
                                        className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200 group ${
                                            disabled
                                                ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                                                : "cursor-pointer"
                                        }`}
                                    >
                                        <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => setCurrentPage(page)}
                    itemsPerPage={itemsPerPage}
                    totalItems={totalItems}
                />
            )}
        </div>
    );
};

export default ReportSection;
