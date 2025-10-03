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

const headings = ["Select", "Subject Name", "Subject Code", "Current Due Date"];

export type Subject = {
    id: string;
    name: string;
    subject_code: string;
    due_date: string | null;
};

export type SubjectsApiResponse = {
    subjects: Subject[];
};

export default function BulkDueDateUpdate() {
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [newDueDate, setNewDueDate] = useState(getDefaultDueDate());
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [isUpdating, setIsUpdating] = useState(false);

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

    const handleSubjectSelection = (subjectId: string) => {
        setSelectedSubjects((prev) => {
            if (prev.includes(subjectId)) {
                return prev.filter((id) => id !== subjectId);
            } else {
                return [...prev, subjectId];
            }
        });
    };

    const handleBulkUpdateDueDates = async () => {
        if (selectedSubjects.length === 0) {
            toast.error("Please select at least one subject");
            return;
        }

        if (!newDueDate) {
            toast.error("Please select a new due date");
            return;
        }

        const dueDateObj = new Date(newDueDate);
        dueDateObj.setMinutes(dueDateObj.getMinutes() - 330);

        const apiUrl = import.meta.env.VITE_API_URL;
        setIsUpdating(true);

        let successCount = 0;
        let failCount = 0;

        for (const subjectId of selectedSubjects) {
            try {
                await axios.put(
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
                successCount++;
            } catch (error) {
                console.error(`Error updating subject ${subjectId}:`, error);
                failCount++;
            }
        }

        setIsUpdating(false);

        if (successCount > 0) {
            toast.success(
                `Successfully updated ${successCount} subject${successCount !== 1 ? "s" : ""}`
            );
        }

        if (failCount > 0) {
            toast.error(
                `Failed to update ${failCount} subject${failCount !== 1 ? "s" : ""}`
            );
        }

        setSelectedSubjects([]);
        refetch();
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
    const sem = tenure?.is_even;

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

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "Not set";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    return (
        <div className="px-4 py-8 max-w-7xl mx-auto">
            <h1 className="text-center text-2xl font-semibold text-gray-800 mb-10 tracking-wider">
                Bulk Due Date Update
            </h1>

            <div className="flex justify-center md:justify-end mb-6 max-w-7xl mx-auto">
                <TenureSelector />
            </div>

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
                            Update Due Dates for Multiple Subjects
                        </h2>
                    </div>

                    <div className="flex flex-col items-center gap-2 md:flex-row">
                        <span className="text-sm text-gray-600 mr-2">
                            New Due Date:
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
                        placeholder="Search by subject name or code"
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
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                                                        {formatDate(subject.due_date)}
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
                                <span className="text-sm text-gray-600">
                                    {selectedSubjects.length} subject
                                    {selectedSubjects.length !== 1 ? "s" : ""}{" "}
                                    selected
                                </span>
                                <button
                                    onClick={handleBulkUpdateDueDates}
                                    disabled={
                                        selectedSubjects.length === 0 ||
                                        !newDueDate ||
                                        isUpdating
                                    }
                                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {isUpdating
                                        ? "Updating Due Dates..."
                                        : "Update Due Dates"}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}