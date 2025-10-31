// BulkSendRequest.tsx
import { FaArrowLeft } from "react-icons/fa";
import { Link } from "react-router-dom";
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

const headings = ["Select", "Course Name", "Course Code"];

export type Subject = {
    id: string;
    name: string;
    subject_code: string;
};

export type SubjectsApiResponse = {
    subjects: Subject[];
};

export default function BulkSendRequest() {
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [newDueDate, setNewDueDate] = useState(getDefaultDueDate());
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [isSending, setIsSending] = useState(false); // Changed from isUpdating
    
    const [isUploadingCSV, setIsUploadingCSV] = useState(false);
    const [csvFile, setCsvFile] = useState<File | null>(null);

    const [requestSent, setRequestSent] = useState(false);
    const [totalNewRequests, setTotalNewRequests] = useState(0);
    const [totalExistingRequests, setTotalExistingRequests] = useState(0);

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
        if (!paginationData.currentPageData) return;

        const currentPageIds = paginationData.currentPageData.map((subject) => subject.id);
        const allCurrentPageSelected = currentPageIds.every((id) =>
            selectedSubjects.includes(id)
        );

        if (allCurrentPageSelected) {
            setSelectedSubjects((prev) =>
                prev.filter((id) => !currentPageIds.includes(id))
            );
        } else {
            setSelectedSubjects((prev) => [
                ...prev,
                ...currentPageIds.filter((id) => !prev.includes(id)),
            ]);
        }
    };

    const handleBulkSendRequests = async () => {
        if (selectedSubjects.length === 0) {
            toast.error("Please select at least one subject");
            return;
        }

        if (!newDueDate) {
            toast.error("Please select a due date");
            return;
        }

        // Reset counters
        setRequestSent(false);
        setTotalNewRequests(0);
        setTotalExistingRequests(0);

        const dueDateObj = new Date(newDueDate);
        dueDateObj.setMinutes(dueDateObj.getMinutes() - 330);

        const apiUrl = import.meta.env.VITE_API_URL;
        setIsSending(true);

        let successCount = 0;
        let failCount = 0;
        let totalNew = 0;
        let totalExisting = 0;

        for (const subjectId of selectedSubjects) {
            try {
                const response = await axios.post(
                    `${apiUrl}/teacher/subject/bulk-send-requests`,
                    {
                        subject_id: subjectId,
                        due_date: dueDateObj.toISOString(),
                    },
                    {
                        withCredentials: true,
                        params: { year, sem },
                    }
                );
                
                // Parse the message to extract numbers
                const message = response.data.message;
                console.log(`Subject ${subjectId}:`, message);
                
                // Extract numbers from message like "27 new requests created, 4 students already had requests"
                const newRequestsMatch = message.match(/(\d+) new requests created/);
                const existingRequestsMatch = message.match(/(\d+) students already had requests/);
                
                if (newRequestsMatch) {
                    totalNew += parseInt(newRequestsMatch[1]);
                }
                if (existingRequestsMatch) {
                    totalExisting += parseInt(existingRequestsMatch[1]);
                }
                
                successCount++;
            } catch (error) {
                console.error(`Error sending requests for subject ${subjectId}:`, error);
                failCount++;
            }
        }

        setIsSending(false);
        
        // Update state with totals
        setTotalNewRequests(totalNew);
        setTotalExistingRequests(totalExisting);
        setRequestSent(true);

        if (successCount > 0) {
            toast.success(
                `Successfully processed ${successCount} subject${successCount !== 1 ? "s" : ""}`
            );
        }

        if (failCount > 0) {
            toast.error(
                `Failed to process ${failCount} subject${failCount !== 1 ? "s" : ""}`
            );
        }

        setSelectedSubjects([]);
        refetch();
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
                const subjectCodes = (parsed.data as any[])
                    .map((row) => row.subject_code?.trim())
                    .filter(Boolean);

                if (subjectCodes.length === 0) {
                    toast.error("No valid course codes found in CSV");
                    setIsUploadingCSV(false);
                    return;
                }

                const matchedSubjectIds = apiData?.subjects
                    .filter((subject) =>
                        subjectCodes.includes(subject.subject_code)
                    )
                    .map((subject) => subject.id) || [];

                if (matchedSubjectIds.length === 0) {
                    toast.warning("No matching subjects found");
                } else {
                    setSelectedSubjects(matchedSubjectIds);
                    toast.success(
                        `${matchedSubjectIds.length} subject${matchedSubjectIds.length !== 1 ? 's' : ''} selected from CSV`
                    );
                }

                const notFound = subjectCodes.length - matchedSubjectIds.length;
                if (notFound > 0) {
                    toast.info(`${notFound} course code${notFound !== 1 ? 's' : ''} not found`);
                }
                setCsvFile(null);
                setIsUploadingCSV(false);
            } catch (error) {
                toast.error("Error processing CSV file");
                setCsvFile(null);
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

    const handleSubjectSelection = (subjectId: string) => {
        setSelectedSubjects((prev) => {
            if (prev.includes(subjectId)) {
                return prev.filter((id) => id !== subjectId);
            } else {
                return [...prev, subjectId];
            }
        });
    };



    const fetchData = async (year: number, sem: number) => {
        const apiUrl = import.meta.env.VITE_API_URL;

        const { data } = await axios.get<SubjectsApiResponse>(
            `${apiUrl}/teacher/subjects`,
            {
                withCredentials: true,
                params: { year, sem },
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
        refetch,
    } = useQuery({
        queryKey: ["teacherSubjects", year, sem],
        queryFn: () => fetchData(year as number, sem as number),
        refetchOnWindowFocus: false,
    });

    const paginationData = useMemo(() => {
        if (!apiData?.subjects) {
            return {
                currentPageData: [],
                totalPages: 0,
                totalItems: 0,
            };
        }

        const filteredSubjects = apiData.subjects.filter(
            (subject) =>
                subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                subject.subject_code.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const totalItems = filteredSubjects.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentPageData = filteredSubjects.slice(startIndex, endIndex);

        return {
            currentPageData,
            totalPages,
            totalItems,
        };
    }, [apiData?.subjects, currentPage, itemsPerPage, searchTerm]);

    const areAllCurrentPageSelected = useMemo(() => {
        if (paginationData.currentPageData.length === 0) return false;
        return paginationData.currentPageData.every((subject) =>
            selectedSubjects.includes(subject.id)
        );
    }, [paginationData.currentPageData, selectedSubjects]);

    return (
        <div className="px-4 py-8 max-w-7xl mx-auto">
            <h1 className="text-center text-2xl font-semibold text-gray-800 mb-10 tracking-wider">
                Bulk Certificate Requests {/* Changed title */}
            </h1>

            <div className="flex justify-center md:justify-end mb-6 max-w-7xl mx-auto">
                <TenureSelector />
            </div>

            {requestSent && totalNewRequests > 0 && (
    <div
        className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 max-w-7xl mx-auto"
        role="alert"
    >
        <span className="block sm:inline">
            {`Certificate requests sent successfully to ${totalNewRequests} student${totalNewRequests !== 1 ? 's' : ''}`}
        </span>
    </div>
)}

            {requestSent && totalExistingRequests > 0 && (
                <div
                    className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4 max-w-7xl mx-auto"
                    role="alert"
                >
                    <span className="block sm:inline">
                        {`${totalExistingRequests} student${totalExistingRequests !== 1 ? 's' : ''} already had pending requests`}
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
                            Send Certificate Requests to All Students {/* Changed subtitle */}
                        </h2>
                    </div>

                    <div className="flex flex-col items-center gap-2 md:flex-row">
                        <span className="text-sm text-gray-600 mr-2">
                            Due Date: {/* Changed from "New Due Date" */}
                        </span>
                        <input
                            type="date"
                            value={newDueDate}
                            min={new Date().toISOString().split("T")[0]}
                            onChange={(e) => setNewDueDate(e.target.value)}
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
                        placeholder="Search by course name or code"
                    />
                </div>

                {isLoading ? (
                    <TableSkeleton rows={5} cols={4} className="max-w-7xl mx-auto" />
                ) : apiError ? (
                    <div className="p-6 text-center text-red-500">
                        Error loading subjects. Please try again.
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
                                                        paginationData.currentPageData
                                                            .length > 0
                                                    }
                                                    onChange={handleSelectAll}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                                <button
                                                    onClick={handleSelectAll}
                                                    className="text-xs text-blue-600 hover:text-blue-800"
                                                >
                                                    {areAllCurrentPageSelected
                                                        ? "Deselect All"
                                                        : "Select All"}
                                                </button>
                                            </div>
                                        </th>
                                        {headings.slice(1).map((heading, idx) => (
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
                                    {paginationData.currentPageData.length > 0 ? (
                                        paginationData.currentPageData.map(
                                            (subject) => (
                                                <tr
                                                    key={subject.id}
                                                    className={`
                                                        hover:bg-gray-50 transition-colors duration-150 cursor-pointer
                                                        ${
                                                            selectedSubjects.includes(
                                                                subject.id
                                                            )
                                                                ? "bg-blue-50"
                                                                : ""
                                                        }
                                                    `}
                                                    onClick={() =>
                                                        handleSubjectSelection(
                                                            subject.id
                                                        )
                                                    }
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedSubjects.includes(
                                                                subject.id
                                                            )}
                                                            onChange={() => {}}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="font-medium text-gray-900">
                                                            {subject.name}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                                                        {subject.subject_code}
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
                                                No subjects found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

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
                                            {isUploadingCSV ? "Uploading..." : "Upload CSV"}
                                        </label>
                                        {csvFile && (
                                            <div className="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-700 truncate max-w-xs">
                                                {csvFile.name}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        CSV must include header: subject_code
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-600">
                                        {selectedSubjects.length} subject
                                        {selectedSubjects.length !== 1 ? "s" : ""} selected
                                    </span>
                                <button
                                    onClick={handleBulkSendRequests} // Different function call
                                    disabled={
                                        selectedSubjects.length === 0 ||
                                        !newDueDate ||
                                        isSending // Different state variable
                                    }
                                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {isSending ? "Sending Requests..." : "Send Certificate Requests"}
                                </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}