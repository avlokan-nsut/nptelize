import axios from 'axios';
import { useAuthStore } from '../../store/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import type { Student, Subject } from '../../types/faculty/MannualVerification';
import TableSkeleton from '../ui/TableSkeleton';
import { useState } from 'react';
import { FaChevronRight } from 'react-icons/fa';
import RequestDetailsDropdown from './RequestDetailsDropdown';
import { TenureSelector } from '../ui/DropDown';
import { FaArrowLeft } from 'react-icons/fa';
import { Link } from 'react-router-dom';


type Response = {
    id: string,
    student: Student,
    subject: Subject,
    verified_total_marks: string,
    created_at: string,
    due_date: string,
     status: "pending" | "completed" | "rejected" | "no_certificate" | "under_review";
}

type ApiResponse = {
    requests: Response[]

}

const fetchData = async (year: number, sem: number) => {
    const apiUrl = import.meta.env.VITE_API_URL;
    const reqType = {
        request_types: ["rejected" ,"under_review"],
    };

    const { data } = await axios.post<ApiResponse>(
        `${apiUrl}/teacher/subject/requests`,
        reqType,
        {
            withCredentials: true,
            headers: {
                "Content-Type": "application/json",
            },
            params: { year, sem },
        }
    );
    return data;
};

const apiUrl = import.meta.env.VITE_API_URL;

const MannualVerification = () => {
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const { tenure } = useAuthStore();
    const year = tenure?.year;
    const sem = tenure?.is_odd;

    const {
        data: apiData,
        error,
        isLoading,
        isFetching
    } = useQuery({
        queryKey: ["teacherRequestsByStatus", year, sem],
        queryFn: () => fetchData(year as number, sem as number),
        refetchOnWindowFocus: false,
    });

    const headings = ["Name", "Email", "Roll No.", "Course Name", "Course Code", "Status", "File Url", "Actions"]


    if (error) return <div>Error loading data</div>;

    return (
        <>
            <div className='px-4 py-8'>
                <h1 className="text-center text-2xl font-semibold text-gray-800 mb-10 tracking-wider">
                    Manual Verification
                </h1>
                <div className="flex justify-center md:justify-end mb-6 max-w-7xl mx-auto">
                    <TenureSelector />
                </div>

                {apiData && (
                    <h1 className="text-center text-lg font-semibold text-gray-800 mb-8 tracking-wider max-w-7xl mx-auto md:text-left">
                        Total Requests :  {apiData?.requests.length > 0 ? apiData?.requests.length : 0}
                    </h1>)}

                <div className='max-w-7xl mx-auto'>
                    {isLoading || isFetching ? (
                        <TableSkeleton rows={5} cols={8} className="max-w-7xl mx-auto" />
                    ) : (
                        <div className="overflow-hidden rounded-lg shadow-md border border-gray-100 bg-white">
                            <div className="flex items-center gap-4 p-4 border-b bg-gray-50">
                                <Link
                                    to="/faculty/dashboard"
                                    className="hover:bg-gray-200 p-2 rounded-full transition-colors"
                                >
                                    <FaArrowLeft className="text-gray-600" />
                                </Link>
                                <h3 className="font-semibold text-gray-800 md:text-xl">
                                    Verify Requests
                                </h3>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            {headings.map((heading, idx) => (
                                                <th key={idx} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    {heading}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {apiData?.requests && apiData.requests.length > 0 ? (
                                            apiData.requests.map((request) => (
                                                <>
                                                    <tr key={request.id} className="hover:bg-gray-50 transition-colors duration-150">
                                                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">{request.student.name}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">{request.student.email}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">{request.student.roll_number}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">{request.subject.name}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">{request.subject.subject_code}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${request.status === 'rejected'
                                                                    ? 'bg-red-100 text-red-800 border border-red-200'
                                                                    : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                                                }`}>
                                                                {request.status === 'rejected' ? 'Rejected' : 'Under Review'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center whitespace-nowrap text-gray-700">

                                                            <div>
                                                                <div className=" text-black py-2 rounded-md shadow-md transition-all duration-300 transform hover:scale-105 hover:bg-black hover:text-white">
                                                                    <a
                                                                        href={`${apiUrl}/user/certificate/file/${request.id}.pdf?download=false`}
                                                                        target="_blank"
                                                                        className="flex items-center justify-center font-medium"
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
                                                                    </a>
                                                                </div>
                                                            </div>


                                                        </td>

                                                        <td className="px-6 py-4 whitespace-nowrap">

                                                            <button
                                                                onClick={() => setOpenDropdownId(openDropdownId === request.id ? null : request.id)}
                                                                className="shadow-md px-5 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 hover:bg-black hover:text-white hover:cursor-pointer"
                                                            >
                                                                <FaChevronRight
                                                                    className={`w-4 h-4 transition-transform mx-auto ${openDropdownId === request.id ? 'rotate-90' : ''}`}
                                                                />
                                                            </button>

                                                        </td>
                                                    </tr>
                                                    {openDropdownId === request.id && (
                                                        <RequestDetailsDropdown
                                                            request={
                                                                {
                                                                    id: request.id,
                                                                    student: request.student,
                                                                    subject: request.subject,
                                                                    status: request.status,
                                                                    verified_total_marks: request.verified_total_marks,
                                                                    created_at: request.created_at,
                                                                    due_date: request.due_date,


                                                                }
                                                            }
                                                            colSpan={headings.length}
                                                            subjectId={request.subject.id}
                                                            onClose={() => setOpenDropdownId(null)}
                                                            showReject={false}
                                                        />
                                                    )}
                                                </>


                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={headings.length} className="px-6 py-4 text-center text-gray-500">
                                                    No requests to verify
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </>

    )
}

export default MannualVerification