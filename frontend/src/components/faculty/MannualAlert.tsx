import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from 'react-toastify';
import {InfoIcon} from 'lucide-react'

interface Props {
  request_id: string;
  student_id: string;
  subject_id: string;
  isVisible: boolean;
  subject_name : string,
  student_name : string,
  onClose: () => void;
}

export type Request = {
  id: string;
}

const apiUrl = import.meta.env.VITE_API_URL;



const marksSchema = z.object({
  marks: z.number().min(0, "Marks must be non-negative").max(100, "Marks cannot exceed 100"),
});

type MarksFormData = z.infer<typeof marksSchema>;

const MannualAlert = ({ isVisible, onClose, request_id, student_id, subject_id , student_name, subject_name}: Props) => {

const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<MarksFormData>({
    resolver: zodResolver(marksSchema),
  });


  const handleClick = async ({

  request_id,
  student_id,
  subject_id,
}: Props , marks : number ) => {
  try {
    await axios.post(
      `${apiUrl}/teacher/verify/certificate/manual/unsafe`,
      {
        request_id: request_id,
        student_id: student_id,
        subject_id: subject_id,
        marks: marks,
      },{
        withCredentials : true,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    queryClient.setQueryData(
      ["allRejectedRequests"],
      (oldData: Request[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.filter((request) => request.id !== request_id);
      }
    );

    toast.success("Mannual Verification Done!")

    
  } catch (error) {
    console.log(error);
    
    if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error("Unauthorized");
    } else {
        toast.error("Error!");
    }
}

};



  const onSubmit = async (data: MarksFormData) => {
    try {
      await handleClick({ request_id, student_id, subject_id, isVisible, onClose, subject_name,student_name }, data.marks);
      reset();
      onClose();
    } catch (error) {
      console.error("Error submitting marks:", error);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl font-bold"
        >
          ×
        </button>
        
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-4">Manual Verification</h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
             <div className="text-[12px] bg-yellow-400 p-2  my-4 flex flex-row">
                <span><InfoIcon className="h-6 w-6 mr-2"/></span>
                Please make sure you are adding right marks! This action can't be undone 
             </div>

             <div className="text-sm my-2">
                {`Entering marks for ${student_name} for ${subject_name}`}
             </div>
              <input
                type="number"
                id="marks"
                {...register("marks", { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter marks (0-100)"
              />
              {errors.marks && (
                <p className="mt-1 text-sm text-red-600">{errors.marks.message}</p>
              )}
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MannualAlert;
