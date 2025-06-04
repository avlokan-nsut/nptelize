import { useState, useMemo, useEffect, useRef } from "react";
import { ChevronDown, Download } from "lucide-react";
import Pagination from "./Pagination";
import SearchBar from "./SearchBar";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const mockNptelData: NptelRecord[] = [
    {
        roll_number: "1",
        nsut_name: "Johnathan Doe",
        name: "John Doe",
        certificate_name: "John Doe",
        nptel_course_code: "CS101",
        certificate_course_code: "CSE101",
        verified_total_marks: 85,
        certificate_total_marks: 78,
        year: 2023,
        certificate_year: 2023,
        status: "pending",
    },
    {
        roll_number: "2",
        nsut_name: "Jane Smith",
        name: "Jane Smith",
        certificate_name: "Jane A. Smith",
        nptel_course_code: "CS201",
        certificate_course_code: "IT201",
        verified_total_marks: 92,
        certificate_total_marks: 88,
        year: 2023,
        certificate_year: 2023,
        status: "pending",
    },
    {
        roll_number: "3",
        nsut_name: "Mike Johnson",
        name: "Mike Johnson",
        certificate_name: "Michael Johnson",
        nptel_course_code: "AI301",
        certificate_course_code: "DS301",
        verified_total_marks: 78,
        certificate_total_marks: 82,
        year: 2023,
        certificate_year: 2024,
        status: "pending",
    },
    {
        roll_number: "4",
        nsut_name: "Sarah Wilson",
        name: "Sarah Wilson",
        certificate_name: "Sara Wilson",
        nptel_course_code: "WEB101",
        certificate_course_code: "CSE201",
        verified_total_marks: 95,
        certificate_total_marks: 91,
        year: 2023,
        certificate_year: 2024,
        status: "pending",
    },
    {
        roll_number: "5",
        nsut_name: "David Brown",
        name: "David Brown",
        certificate_name: "David Brown",
        nptel_course_code: "DB301",
        certificate_course_code: "IT301",
        verified_total_marks: 88,
        certificate_total_marks: 85,
        year: 2023,
        certificate_year: 2024,
        status: "pending",
    },
    {
        roll_number: "6",
        nsut_name: "Emily Davis",
        name: "Emily Davis",
        certificate_name: "Emily J. Davis",
        nptel_course_code: "NET201",
        certificate_course_code: "CSE301",
        verified_total_marks: 91,
        certificate_total_marks: 87,
        year: 2023,
        certificate_year: 2024,
        status: "pending",
    },
    {
        roll_number: "7",
        nsut_name: "Alex Thompson",
        name: "Alex Thompson",
        certificate_name: "AlexanderThompson",
        nptel_course_code: "SE401",
        certificate_course_code: "SE401",
        verified_total_marks: 83,
        certificate_total_marks: 79,
        year: 2023,
        certificate_year: 2024,
        status: "pending",
    },
    {
        roll_number: "8",
        nsut_name: "Lisa Anderson",
        name: "Lisa Anderson",
        certificate_name: "Lisa Anderson",
        nptel_course_code: "AI101",
        certificate_course_code: "AI101",
        verified_total_marks: 94,
        certificate_total_marks: 90,
        year: 2023,
        certificate_year: 2024,
        status: "pending",
    },
    {
        roll_number: "9",
        nsut_name: "Chris Martinez",
        name: "Chris Martinez",
        certificate_name: "Christopher Martinez",
        nptel_course_code: "MOB201",
        certificate_course_code: "CSE401",
        verified_total_marks: 87,
        certificate_total_marks: 84,
        year: 2023,
        certificate_year: 2024,
        status: "pending",
    },
    {
        roll_number: "10",
        nsut_name: "Anna Taylor",
        name: "Anna Taylor",
        certificate_name: "Anna M. Taylor",
        nptel_course_code: "CYB101",
        certificate_course_code: "SEC101",
        verified_total_marks: 89,
        certificate_total_marks: 86,
        year: 2023,
        certificate_year: 2024,
        status: "pending",
    },
    {
        roll_number: "11",
        nsut_name: "Robert Lee",
        name: "Robert Lee",
        certificate_name: "Bob Lee",
        nptel_course_code: "CLOUD201",
        certificate_course_code: "IT401",
        verified_total_marks: 86,
        certificate_total_marks: 83,
        year: 2023,
        certificate_year: 2024,
        status: "pending",
    },
    {
        roll_number: "12",
        nsut_name: "Michelle White",
        name: "Michelle White",
        certificate_name: "Michelle White",
        nptel_course_code: "IMG301",
        certificate_course_code: "ECE301",
        verified_total_marks: 90,
        certificate_total_marks: 88,
        year: 2023,
        certificate_year: 2024,
        status: "pending",
    },
];

interface NptelRecord {
    roll_number: string;
    nsut_name: string;
    name: string;
    certificate_name: string;
    nptel_course_code: string;
    certificate_course_code: string;
    verified_total_marks: number;
    certificate_total_marks: number;
    year: number;
    certificate_year: number;
    status: "accepted" | "rejected" | "pending";
}

const fetchNptelRecords = async (): Promise<NptelRecord[]> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return mockNptelData;
};

const updateRecordStatus = async ({
    rollNumber,
    status,
}: {
    rollNumber: string;
    status: "accepted" | "rejected";
}): Promise<NptelRecord> => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const updatedRecord = mockNptelData.find(
        (r) => r.roll_number === rollNumber
    );
    if (!updatedRecord) throw new Error("Record not found");

    return { ...updatedRecord, status };
};

const updateMultipleRecordStatus = async ({
    rollNumbers,
    status,
}: {
    rollNumbers: string[];
    status: "accepted" | "rejected";
}): Promise<NptelRecord[]> => {
    await new Promise((resolve) => setTimeout(resolve, 800));

    return rollNumbers.map((rollNumber) => {
        const record = mockNptelData.find((r) => r.roll_number === rollNumber);
        if (!record) throw new Error(`Record ${rollNumber} not found`);
        return { ...record, status };
    });
};

const ManualVerification = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const queryClient = useQueryClient();

    const {
        data: nptelRecords = [],
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ["nptelRecords"],
        queryFn: fetchNptelRecords,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });

    const updateSingleRecordMutation = useMutation({
        mutationFn: updateRecordStatus,
        onSuccess: (updatedRecord) => {
            queryClient.setQueryData(
                ["nptelRecords"],
                (oldData: NptelRecord[] | undefined) => {
                    if (!oldData) return [];
                    return oldData.map((record) =>
                        record.roll_number === updatedRecord.roll_number
                            ? updatedRecord
                            : record
                    );
                }
            );
        },
        onError: (error) => {
            console.error("Error updating record:", error);
        },
    });

    const updateMultipleRecordsMutation = useMutation({
        mutationFn: updateMultipleRecordStatus,
        onSuccess: (updatedRecords) => {
            queryClient.setQueryData(
                ["nptelRecords"],
                (oldData: NptelRecord[] | undefined) => {
                    if (!oldData) return [];
                    const updatedMap = new Map(
                        updatedRecords.map((r) => [r.roll_number, r])
                    );
                    return oldData.map((record) =>
                        updatedMap.has(record.roll_number)
                            ? updatedMap.get(record.roll_number)!
                            : record
                    );
                }
            );
            setSelectedRecords([]);
        },
        onError: (error) => {
            console.error("Error updating multiple records:", error);
        },
    });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getDifferences = (record: NptelRecord) => {
        const differences = [];

        if (
            record.certificate_name.trim().toLowerCase() !==
                record.name.trim().toLowerCase() ||
            record.certificate_name.trim().toLowerCase() !==
                record.nsut_name.trim().toLowerCase()
        ) {
            differences.push("Student Name");
        }
        if (record.nptel_course_code !== record.certificate_course_code) {
            differences.push("Course Code");
        }
        if (record.verified_total_marks !== record.certificate_total_marks) {
            differences.push("Total Marks");
        }
        if (record.year !== record.certificate_year) {
            differences.push("Year");
        }

        return differences;
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const filteredRecords = useMemo(() => {
        return nptelRecords.filter(
            (record) =>
                record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                record.certificate_name
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                record.nptel_course_code
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                record.certificate_course_code
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())
        );
    }, [nptelRecords, searchTerm]);

    const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);

    const paginatedRecords = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredRecords.slice(startIndex, endIndex);
    }, [filteredRecords, currentPage, itemsPerPage]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleSelectRecord = (recordRollNumber: string) => {
        setSelectedRecords((prev) =>
            prev.includes(recordRollNumber)
                ? prev.filter((rollNumber) => rollNumber !== recordRollNumber)
                : [...prev, recordRollNumber]
        );
    };

    const handleSelectAll = () => {
        if (selectedRecords.length === filteredRecords.length) {
            setSelectedRecords([]);
        } else {
            setSelectedRecords(
                filteredRecords.map((record) => record.roll_number)
            );
        }
    };

    const handleAcceptReject = (
        rollNumber: string,
        status: "accepted" | "rejected"
    ) => {
        updateSingleRecordMutation.mutate({ rollNumber, status });
    };

    const handleGlobalAcceptAll = () => {
        const targetRecords = selectedRecords.length > 0
            ? selectedRecords.filter(rollNumber => {
                const record = nptelRecords.find(r => r.roll_number === rollNumber);
                return record && record.status === "pending";
              })
            : filteredRecords
                  .filter((record) => record.status === "pending")
                  .map((r) => r.roll_number);

        if (targetRecords.length > 0) {
            updateMultipleRecordsMutation.mutate({
                rollNumbers: targetRecords,
                status: "accepted",
            });
        } else {
            alert("No pending records to accept");
        }
    };

    const handleGlobalRejectAll = () => {
        const targetRecords = selectedRecords.length > 0
            ? selectedRecords.filter(rollNumber => {
                const record = nptelRecords.find(r => r.roll_number === rollNumber);
                return record && record.status === "pending";
              })
            : filteredRecords
                  .filter((record) => record.status === "pending")
                  .map((r) => r.roll_number);

        if (targetRecords.length > 0) {
            updateMultipleRecordsMutation.mutate({
                rollNumbers: targetRecords,
                status: "rejected",
            });
        } else {
            alert("No pending records to reject");
        }
    };

    const getRecordsByStatus = (
        status: "all" | "accepted" | "rejected" | "pending" | "selected"
    ) => {
        if (status === "all") return filteredRecords;
        if (status === "selected")
            return filteredRecords.filter((record) =>
                selectedRecords.includes(record.roll_number)
            );
        return filteredRecords.filter((record) => record.status === status);
    };

    const downloadCSV = (
        statusFilter:
            | "all"
            | "accepted"
            | "rejected"
            | "pending"
            | "selected" = "all"
    ) => {
        const recordsToDownload = getRecordsByStatus(statusFilter);

        if (!recordsToDownload.length) {
            alert(
                `No ${
                    statusFilter === "all" ? "" : statusFilter
                } records to download`
            );
            return;
        }

        const headers = [
            "Roll Number",
            "NSUT Name",
            "Student Name",
            "Certificate Name",
            "NPTEL Course Code",
            "Certificate Course Code",
            "Verified Marks",
            "Certificate Marks",
            "Year",
            "Certificate Year",
            "Status",
            "Differences",
        ];

        const escapeCSV = (value: any) => {
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
            ...recordsToDownload.map((record: NptelRecord) => {
                const differences = getDifferences(record);
                const differencesText =
                    differences.length > 0
                        ? differences.join(" | ")
                        : "No Differences";

                return [
                    escapeCSV(record.roll_number),
                    escapeCSV(record.nsut_name),
                    escapeCSV(record.name),
                    escapeCSV(record.certificate_name),
                    escapeCSV(record.nptel_course_code),
                    escapeCSV(record.certificate_course_code),
                    escapeCSV(record.verified_total_marks.toString()),
                    escapeCSV(record.certificate_total_marks.toString()),
                    escapeCSV(record.year.toString()),
                    escapeCSV(record.certificate_year.toString()),
                    escapeCSV(record.status),
                    escapeCSV(differencesText),
                ].join(",");
            }),
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
                    `nptel_records_${statusFilter}_${
                        new Date().toISOString().split("T")[0]
                    }.csv`
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
        }

        setIsDropdownOpen(false);
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
            <div className="flex flex-col justify-center items-center h-64 space-y-4">
                <div className="text-red-500 text-lg">
                    Error loading records
                </div>
                <button
                    onClick={() => refetch()}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Retry
                </button>
            </div>
        );
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "accepted":
                return (
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Accepted
                    </span>
                );
            case "rejected":
                return (
                    <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                        Rejected
                    </span>
                );
            default:
                return (
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                        Pending
                    </span>
                );
        }
    };

    const downloadOptions = [
        { label: "All Records", value: "all", count: filteredRecords.length },
        ...(selectedRecords.length > 0
            ? [
                  {
                      label: "Selected Records",
                      value: "selected",
                      count: selectedRecords.length,
                  },
              ]
            : []),
        {
            label: "Accepted Records",
            value: "accepted",
            count: getRecordsByStatus("accepted").length,
        },
        {
            label: "Rejected Records",
            value: "rejected",
            count: getRecordsByStatus("rejected").length,
        },
        {
            label: "Pending Records",
            value: "pending",
            count: getRecordsByStatus("pending").length,
        },
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-center text-xl md:text-2xl font-semibold text-gray-800 tracking-wider mb-8">
                Manual Verification
            </h1>

            <div className="w-full flex flex-col justify-end space-y-4 mb-6 md:flex-row md:space-y-0 md:space-x-4 md:items-end">
                <div className="flex-1">
                    <SearchBar
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search students, certificates, or course codes..."
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleGlobalAcceptAll}
                        className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-sm text-sm font-medium"
                    >
                        {selectedRecords.length > 0
                            ? "Accept Selected"
                            : "Accept All"}
                    </button>
                    <button
                        onClick={handleGlobalRejectAll}
                        className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 shadow-sm text-sm font-medium"
                    >
                        {selectedRecords.length > 0
                            ? "Reject Selected"
                            : "Reject All"}
                    </button>

                    {/* Download Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            disabled={!filteredRecords.length}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm"
                        >
                            <Download className="w-4 h-4" />
                            Download CSV
                            <ChevronDown
                                className={`w-4 h-4 transition-transform duration-200 ${
                                    isDropdownOpen ? "rotate-180" : ""
                                }`}
                            />
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                <div className="py-2">
                                    {downloadOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() =>
                                                downloadCSV(
                                                    option.value as
                                                        | "all"
                                                        | "accepted"
                                                        | "rejected"
                                                        | "pending"
                                                        | "selected"
                                                )
                                            }
                                            disabled={option.count === 0}
                                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed flex justify-between items-center"
                                        >
                                            <span>{option.label}</span>
                                            <span className="text-xs text-gray-500">
                                                ({option.count})
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-100 bg-white">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr className="text-sm font-medium text-gray-700">
                            <th className="px-6 py-4 text-center">
                                <input
                                    type="checkbox"
                                    checked={
                                        selectedRecords.length ===
                                            filteredRecords.length &&
                                        filteredRecords.length > 0
                                    }
                                    onChange={handleSelectAll}
                                    className="rounded border-gray-300 focus:ring-blue-500"
                                />
                            </th>
                            <th className="px-6 py-4 text-center">
                                Roll Number
                            </th>
                            <th className="px-6 py-4 text-center">NSUT Name</th>
                            <th className="px-6 py-4 text-center">
                                Student Name
                            </th>
                            <th className="px-6 py-4 text-center">
                                Certificate Name
                            </th>
                            <th className="px-6 py-4 text-center">
                                NPTEL Course Code
                            </th>
                            <th className="px-6 py-4 text-center">
                                Certificate Course Code
                            </th>
                            <th className="px-6 py-4 text-center">
                                Verified Marks
                            </th>
                            <th className="px-6 py-4 text-center">
                                Certificate Marks
                            </th>
                            <th className="px-6 py-4 text-center">Year</th>
                            <th className="px-6 py-4 text-center">
                                Certificate Year
                            </th>
                            <th className="px-6 py-4 text-center">
                                Status / Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {paginatedRecords.length > 0 ? (
                            paginatedRecords.map((record) => (
                                <tr
                                    key={record.roll_number}
                                    className="hover:bg-gray-50 transition-colors duration-200 text-center"
                                >
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedRecords.includes(
                                                record.roll_number
                                            )}
                                            onChange={() =>
                                                handleSelectRecord(
                                                    record.roll_number
                                                )
                                            }
                                            className="rounded border-gray-300 focus:ring-blue-500"
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                        {record.roll_number}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                        {record.nsut_name}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                        <span
                                            className={
                                                record.nsut_name
                                                    .trim()
                                                    .toLowerCase() !==
                                                record.name.trim().toLowerCase()
                                                    ? "text-red-600 font-medium"
                                                    : "text-gray-900"
                                            }
                                        >
                                            {record.name}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium">
                                        <span
                                            className={
                                                record.name
                                                    .trim()
                                                    .toLowerCase() !==
                                                    record.certificate_name
                                                        .trim()
                                                        .toLowerCase() ||
                                                record.nsut_name
                                                    .trim()
                                                    .toLowerCase() !==
                                                    record.certificate_name
                                                        .trim()
                                                        .toLowerCase()
                                                    ? "text-red-600 font-medium"
                                                    : "text-gray-900"
                                            }
                                        >
                                            {record.certificate_name}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">
                                        {record.nptel_course_code}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <span
                                            className={
                                                record.nptel_course_code !==
                                                record.certificate_course_code
                                                    ? "text-red-600 font-medium"
                                                    : "text-gray-700"
                                            }
                                        >
                                            {record.certificate_course_code}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">
                                        {record.verified_total_marks}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <span
                                            className={
                                                record.verified_total_marks !==
                                                record.certificate_total_marks
                                                    ? "text-red-600 font-medium"
                                                    : "text-gray-700"
                                            }
                                        >
                                            {record.certificate_total_marks}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">
                                        {record.year}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <span
                                            className={
                                                record.year !==
                                                record.certificate_year
                                                    ? "text-red-600 font-medium"
                                                    : "text-gray-700"
                                            }
                                        >
                                            {record.certificate_year}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {record.status === "pending" ? (
                                            <div className="flex gap-2 justify-center">
                                                <button
                                                    onClick={() =>
                                                        handleAcceptReject(
                                                            record.roll_number,
                                                            "accepted"
                                                        )
                                                    }
                                                    className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded hover:bg-green-200 transition-colors duration-200"
                                                >
                                                    Accept
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleAcceptReject(
                                                            record.roll_number,
                                                            "rejected"
                                                        )
                                                    }
                                                    className="px-3 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200 transition-colors duration-200"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        ) : (
                                            getStatusBadge(record.status)
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={12}
                                    className="px-6 py-8 text-center text-sm text-gray-500"
                                >
                                    No NPTEL records found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="mt-6">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        itemsPerPage={itemsPerPage}
                        totalItems={filteredRecords.length}
                    />
                </div>
            )}
        </div>
    );
};

export default ManualVerification;
