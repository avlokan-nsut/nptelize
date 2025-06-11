import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useMemo, useRef } from "react";
import Pagination from "./Pagination";
import { CheckCircle, Loader2 } from "lucide-react";
import MannualAlert from "./MannualAlert";

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

export type CertificateDetails = {
  uploaded_certificate: {
    student_name: string;
    roll_no: string;
    marks: string;
    course_name: string;
    course_period: string;
    file_url: string;
  };
  verification_certificate: {
    student_name: string;
    roll_no: string;
    marks: string;
    course_name: string;
    course_period: string;
    file_url: string;
  };
  subject_name: string;
  remark: string;
};

export type CertificateApiResponse = {
  message: string;
  data: CertificateDetails;
};

export type RejectedRequestWithDetails = {
  id: string;
  student: Student;
  subject: Subject;
  status: "rejected";
  verified_total_marks: string;
  created_at: string;
  due_date: string;
  certificate_details: CertificateDetails | null;
};

const headings = [
  "Roll Number",
  "NSUT Name",
  "Uploaded Student Name",
  "NPTEL Certificate Student Name",
  "Requested Course",
  "Uploaded Certificate Course Name",
  "NPTEL Certificate Course Name",
  "Certificate Marks",
  "NPTEL Verified Marks",
  "Year",
  "Certificate Year",
  "Status",
  "Differences",
  "File URL",
  "Actions",
];

const apiUrl = import.meta.env.VITE_API_URL;

const fetchAllRejectedRequests = async (): Promise<Request[]> => {
  // Fetch subjects data once
  const { data: subjectsData } = await axios.get<ApiResponse>(
    `${apiUrl}/teacher/subjects`,
    {
      withCredentials: true,
    }
  );

  // For each subject, loop once to filter rejected requests
  const requestPromises = subjectsData.subjects.map(async (subject) => {
    const { data: requestData } = await axios.get<ApiResponseCSV>(
      `${apiUrl}/teacher/subject/requests/${subject.id}`,
      { withCredentials: true }
    );
    return requestData.requests.reduce<Request[]>((acc, request) => {
      if (request.status === "rejected") {
        acc.push(request);
      }
      return acc;
    }, []);
  });

  // Combine results from all subjects
  const allRejectedArrays = await Promise.all(requestPromises);
  return allRejectedArrays.flat();
};

const fetchCertificateDetails = async (
  requestId: string
): Promise<CertificateDetails> => {
  const { data: certificateData } = await axios.get<CertificateApiResponse>(
    `${apiUrl}/teacher/certificate/details/${requestId}`,
    { withCredentials: true }
  );
  return certificateData.data;
};

const RejectedVerification = () => {
  const queryClient = useQueryClient();

  const [currentPage, setCurrentPage] = useState(1);
  const [loadingRequests, setLoadingRequests] = useState<Set<string>>(
    new Set()
  );
  const itemsPerPage = 10;
  const [isAcceptingAll, setIsAcceptingAll] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(
    new Set()
  );
  const [isLoadingCertificateDetails, setIsLoadingCertificateDetails] =
    useState(false);
  const [certificateDetailsCache, setCertificateDetailsCache] = useState<
    Map<string, CertificateDetails>
  >(new Map());
  const [visibleModalId, setVisibleModalId] = useState<string | null>(null);

  // Use ref to access latest cache value without causing re-renders
  const cacheRef = useRef<Map<string, CertificateDetails>>(
    certificateDetailsCache
  );
  cacheRef.current = certificateDetailsCache;

  const {
    data: rejectedRequestsData,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["allRejectedRequests"],
    queryFn: fetchAllRejectedRequests,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  const totalCount = rejectedRequestsData?.length || 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const currentRequests = useMemo(() => {
    if (!rejectedRequestsData) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    return rejectedRequestsData.slice(startIndex, startIndex + itemsPerPage);
  }, [rejectedRequestsData, currentPage]);

  const [requestsWithDetails, setRequestsWithDetails] = useState<
    RejectedRequestWithDetails[]
  >([]);

  useEffect(() => {
    if (currentRequests.length === 0) {
      setRequestsWithDetails([]);
      setIsLoadingCertificateDetails(false);
      return;
    }

    setIsLoadingCertificateDetails(true);

    // Check which requests need certificate details fetched using current cache
    const currentCache = cacheRef.current;
    const requestsNeedingDetails = currentRequests.filter(
      (request) => !currentCache.has(request.id)
    );

    // If all requests are already cached, use cached data immediately
    if (requestsNeedingDetails.length === 0) {
      const cachedRequestsWithDetails = currentRequests.map((request) => ({
        ...request,
        status: "rejected" as const,
        certificate_details: currentCache.get(request.id)!,
      }));
      setRequestsWithDetails(cachedRequestsWithDetails);
      setIsLoadingCertificateDetails(false);
      return;
    }

    // Fetch only the missing certificate details
    Promise.all(
      requestsNeedingDetails.map(
        async (
          request
        ): Promise<{
          requestId: string;
          details: CertificateDetails | null;
        }> => {
          try {
            const details = await fetchCertificateDetails(request.id);
            return { requestId: request.id, details };
          } catch (error) {
            return { requestId: request.id, details: null };
          }
        }
      )
    )
      .then((results) => {
        // Update cache with new certificate details
        setCertificateDetailsCache((prevCache) => {
          const newCache = new Map(prevCache);
          results.forEach(({ requestId, details }) => {
            if (details) {
              newCache.set(requestId, details);
            }
          });
          return newCache;
        });

        // Build the complete requests with details using both cached and newly fetched data
        const completeRequestsWithDetails = currentRequests.map((request) => {
          const cachedDetails = currentCache.get(request.id);
          const newDetails = results.find(
            (r) => r.requestId === request.id
          )?.details;
          const details = newDetails || cachedDetails;

          return {
            ...request,
            status: "rejected" as const,
            certificate_details: details || null,
          };
        });

        setRequestsWithDetails(completeRequestsWithDetails);
        setIsLoadingCertificateDetails(false);
      })
      .catch((error) => {
        console.error("Error fetching certificate details:", error);
        setIsLoadingCertificateDetails(false);
      });
  }, [currentRequests]); // Removed certificateDetailsCache from dependencies

  useEffect(() => {
    setCurrentPage(1);
    setSelectedRequests(new Set());
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm">
        <p>Error loading rejected requests: {(error as Error).message}</p>
      </div>
    );
  }

  if (!rejectedRequestsData || rejectedRequestsData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 text-center">
        <p className="text-gray-500">No rejected requests found</p>
      </div>
    );
  }

  // Handle select all checkbox
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allRequestIds = new Set(
        requestsWithDetails.map((request) => request.id)
      );
      setSelectedRequests(allRequestIds);
    } else {
      setSelectedRequests(new Set());
    }
  };

  // Handle individual checkbox
  const handleSelectRequest = (requestId: string, checked: boolean) => {
    const newSelected = new Set(selectedRequests);
    if (checked) {
      newSelected.add(requestId);
    } else {
      newSelected.delete(requestId);
    }
    setSelectedRequests(newSelected);
  };

  // Check if all current page requests are selected
  const isAllSelected =
    requestsWithDetails.length > 0 &&
    requestsWithDetails.every((request) => selectedRequests.has(request.id));

  // Check if some (but not all) are selected
  const isIndeterminate =
    requestsWithDetails.some((request) => selectedRequests.has(request.id)) &&
    !isAllSelected;

  // Get selected requests from current data
  const getSelectedRequestsData = () => {
    return (
      requestsWithDetails?.filter((request) =>
        selectedRequests.has(request.id)
      ) || []
    );
  };

  const acceptCertificate = async (
    fileId: string | undefined,
    request_id: string,
    subject_id: string,
    student_id: string
  ): Promise<void> => {
    if (fileId === undefined) {
      alert("No file");
      return;
    }
    // Set loading state for this specific request
    setLoadingRequests((prev) => new Set(prev).add(request_id));

    try {
      // 1. Construct the file URL and fetch file
      const fileUrl = `${apiUrl}/user/certificate/file/${fileId}?download=false`;
      const fileResponse = await fetch(fileUrl, { credentials: "include" });
      if (!fileResponse.ok) throw new Error("Failed to fetch file");

      const blob = await fileResponse.blob();
      const file = new File([blob], `${fileId}.pdf`, { type: blob.type });

      // FormData
      const formData = new FormData();
      formData.append("file", file);

      await axios.post(
        `${apiUrl}/teacher/verify/certificate/manual?request_id=${request_id}&subject_id=${subject_id}&student_id=${student_id}`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Optimistic update: Remove the accepted request from the UI immediately
      queryClient.setQueryData(
        ["allRejectedRequests"],
        (oldData: Request[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.filter((request) => request.id !== request_id);
        }
      );

      // Clear certificate details cache for accepted request
      setCertificateDetailsCache((prevCache) => {
        const newCache = new Map(prevCache);
        newCache.delete(request_id);
        return newCache;
      });

      // Clear selection for accepted request
      setSelectedRequests((prev) => {
        const newSelected = new Set(prev);
        newSelected.delete(request_id);
        return newSelected;
      });
    } catch (error) {
      console.error("Error during certificate acceptance:", error);
      alert("Failed to accept certificate. Please try again.");
      // Only refetch on error to get the correct state
      await refetch();
    } finally {
      // Remove loading state for this request
      setLoadingRequests((prev) => {
        const newSet = new Set(prev);
        newSet.delete(request_id);
        return newSet;
      });
    }
  };

  const acceptSelectedCertificates = async (): Promise<void> => {
    const selectedRequestsData = getSelectedRequestsData();
    if (selectedRequestsData.length === 0) {
      alert("Please select at least one request to accept.");
      return;
    }

    setIsAcceptingAll(true);
    const successfulRequestIds = new Set<string>();

    try {
      // Process requests in batches to avoid overwhelming the server
      const batchSize = 3;
      for (let i = 0; i < selectedRequestsData.length; i += batchSize) {
        const batch = selectedRequestsData.slice(i, i + batchSize);

        await Promise.allSettled(
          batch.map(async (request) => {
            try {
              const fileUrl = `${apiUrl}/user/certificate/file/${request?.certificate_details?.uploaded_certificate.file_url}?download=false`;
              const fileResponse = await fetch(fileUrl, {
                credentials: "include",
              });
              if (!fileResponse.ok) throw new Error("Failed to fetch file");

              const blob = await fileResponse.blob();
              const file = new File(
                [blob],
                `${request?.certificate_details?.uploaded_certificate.file_url}.pdf`,
                { type: blob.type }
              );

              const formData = new FormData();
              formData.append("file", file);

              await axios.post(
                `${apiUrl}/teacher/verify/certificate/manual?request_id=${request.id}&subject_id=${request.subject.id}&student_id=${request.student.id}`,
                formData,
                {
                  withCredentials: true,
                  headers: {
                    "Content-Type": "multipart/form-data",
                  },
                }
              );

              successfulRequestIds.add(request.id);
              return { success: true, requestId: request.id };
            } catch (error) {
              console.error(
                `Failed to accept certificate for request ${request.id}:`,
                error
              );
              return { success: false, requestId: request.id, error };
            }
          })
        );

        // Update UI for successful requests in this batch
        if (successfulRequestIds.size > 0) {
          queryClient.setQueryData(
            ["allRejectedRequests"],
            (oldData: Request[] | undefined) => {
              if (!oldData) return oldData;
              return oldData.filter(
                (request) => !successfulRequestIds.has(request.id)
              );
            }
          );
        }

        if (i + batchSize < selectedRequestsData.length) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      // Clear certificate details cache for accepted requests
      setCertificateDetailsCache((prevCache) => {
        const newCache = new Map(prevCache);
        successfulRequestIds.forEach((id) => newCache.delete(id));
        return newCache;
      });

      // Clear selected requests for successful ones
      setSelectedRequests((prev) => {
        const newSelected = new Set(prev);
        successfulRequestIds.forEach((id) => newSelected.delete(id));
        return newSelected;
      });

      // Refetch data instead of optimistic updates
      await refetch();

      // Only show summary message, no refetch needed
      if (successfulRequestIds.size === selectedRequestsData.length) {
        alert(
          `Successfully accepted all ${selectedRequestsData.length} selected certificates!`
        );
      } else {
        alert(
          `Accepted ${successfulRequestIds.size} out of ${selectedRequestsData.length} selected certificates.`
        );
      }
    } catch (error) {
      console.error("Error during bulk certificate acceptance:", error);
      alert(
        "Some certificates failed to be accepted. Please check individual results."
      );

      await refetch();
    } finally {
      setIsAcceptingAll(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-center text-xl md:text-2xl font-semibold text-gray-800 tracking-wider">
        Rejected Verification Requests
      </h1>

      <div className="p-4 bg-red-50 border-b mb-4 mt-8">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{totalCount}</div>
          <div className="text-sm text-gray-600">Total Rejected Requests</div>
        </div>
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-600">
            {selectedRequests.size > 0 && (
              <span>{selectedRequests.size} request(s) selected</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={acceptSelectedCertificates}
              disabled={
                isAcceptingAll ||
                loadingRequests.size > 0 ||
                selectedRequests.size === 0 ||
                isLoadingCertificateDetails
              }
              className={`inline-flex items-center px-6 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                isAcceptingAll ||
                loadingRequests.size > 0 ||
                selectedRequests.size === 0 ||
                isLoadingCertificateDetails
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              }`}
            >
              {isAcceptingAll ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Processing ({selectedRequests.size})...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span>Accept Selected ({selectedRequests.size})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-scroll rounded-lg shadow-sm border border-gray-100 bg-white">
        {isLoadingCertificateDetails ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
              <p className="text-gray-600">Loading certificate details...</p>
            </div>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-sm font-medium text-gray-700">
                <th className="px-4 py-3 text-center whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                {headings.map((heading, idx) => (
                  <th
                    key={idx}
                    className="px-4 py-3 text-center whitespace-nowrap"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requestsWithDetails.map((request) => {
                const uploadedCert =
                  request?.certificate_details?.uploaded_certificate;
                const verificationCert =
                  request?.certificate_details?.verification_certificate;

                return (
                  <tr
                    key={request.id}
                    className="hover:bg-gray-50 transition-colors duration-200"
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedRequests.has(request.id)}
                        onChange={(e) =>
                          handleSelectRequest(request.id, e.target.checked)
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>

                    {/* Roll Number */}
                    <td className="px-4 py-3 text-center">
                      <div className="text-sm">
                        {request.student.roll_number}
                      </div>
                    </td>

                    {/* NSUT Name */}
                    <td className="px-4 py-3 text-center">
                      <div className="text-sm">{request.student.name}</div>
                    </td>

                    {/* Student Name */}
                    <td className="px-4 py-3 text-center">
                      <div className="text-sm">
                        {uploadedCert?.student_name}
                      </div>
                    </td>

                    {/* Certificate Name */}
                    <td className="px-4 py-3 text-center">
                      <div className="text-sm">
                        {verificationCert?.student_name}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div className="text-sm">{request.subject.name}</div>
                    </td>

                    {/* NPTEL Course Code */}
                    <td className="px-4 py-3 text-center">
                      <div className="text-sm">{uploadedCert?.course_name}</div>
                    </td>

                    {/* Certificate Course Code */}
                    <td className="px-4 py-3 text-center">
                      <div className="text-sm">
                        {verificationCert?.course_name}
                      </div>
                    </td>

                    {/* Certificate Marks */}
                    <td className="px-4 py-3 text-center">
                      <div className="text-sm">{uploadedCert?.marks}</div>
                    </td>

                    {/* Verified Marks */}
                    <td className="px-4 py-3 text-center">
                      <div className="text-sm">{verificationCert?.marks}</div>
                    </td>

                    {/* Year */}
                    <td className="px-4 py-3 text-center">
                      <div className="text-sm">
                        {verificationCert?.course_period}
                      </div>
                    </td>

                    {/* Certificate Year */}
                    <td className="px-4 py-3 text-center">
                      <div className="text-sm">
                        {uploadedCert?.course_period}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Rejected
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div className="text-sm">
                        {request?.certificate_details?.remark}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center">
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
                    </td>

                    <td className="px-4 py-3 text-center">
                      {request.certificate_details?.uploaded_certificate
                        ?.file_url && (
                        <button
                          onClick={() =>
                            acceptCertificate(
                              request?.certificate_details?.uploaded_certificate
                                .file_url,
                              request.id,
                              request.subject.id,
                              request.student.id
                            )
                          }
                          disabled={
                            loadingRequests.has(request.id) ||
                            isLoadingCertificateDetails
                          }
                          className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                            loadingRequests.has(request.id) ||
                            isLoadingCertificateDetails
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                          }`}
                        >
                          {loadingRequests.has(request.id) ? (
                            <>
                              <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-400" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Accept
                            </>
                          )}
                        </button>
                      )}
                      {!request.certificate_details?.uploaded_certificate
                        ?.file_url && (
                        <div>
                          <button
                            onClick={() => setVisibleModalId(request.id)}
                            className="px-4 py-2 rounded-lg bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors duration-200 shadow-sm text-sm"
                          >
                            Verify Manual
                          </button>

                          <MannualAlert
                            request_id={request.id}
                            subject_id={request.subject.id}
                            student_id={request.student.id}
                            isVisible={visibleModalId === request.id}
                            onClose={() => setVisibleModalId(null)}
                            student_name={request.student.name}
                            subject_name={request.subject.name}
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => {
            setCurrentPage(page);
            setSelectedRequests(new Set()); // Clear selections when changing pages
          }}
          itemsPerPage={itemsPerPage}
          totalItems={totalCount}
        />
      )}
    </div>
  );
};

export default RejectedVerification;
