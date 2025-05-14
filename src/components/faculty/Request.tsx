import { useState } from "react";
import { IoClose } from "react-icons/io5";
import { RequestFormData,requestSchema } from "../../types/faculty/Request";

const Request = () => {
  const [isOpen, setIsopen] = useState(false);
  const [formData, setFormData] = useState<Partial<RequestFormData>>({});
  const [errors, setErrors] = useState<Partial<Record<keyof RequestFormData, string>>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value, files } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));

    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const result = requestSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.errors.forEach((err) => {
        const fieldName = err.path[0] as keyof RequestFormData;
        fieldErrors[fieldName] = err.message;
      });
      setErrors(fieldErrors);
    } else {
      alert("request sent successfully..check form data in console")
      console.log("Form Data:", result.data);
      setIsopen(false);
      setFormData({});
    }
  };

  return (
    <>
      <button
        onClick={() => setIsopen(true)}
        className="btn btn-primary border-none w-32 font-bold text-white bg-blue-400"
      >
        New Request
      </button>

      {isOpen && (
        <div className="modal modal-open" onClick={() => setIsopen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSubmit}>
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl">Add Subject</h1>
                <button className="cursor-pointer" onClick={() => setIsopen(false)}>
                  <IoClose className="text-2xl" />
                </button>
              </div>


              <div className="mb-3">
                <label className="font-medium">Subject Code</label>
                <input
                  name="subjectCode"
                  type="text"
                  onChange={handleChange}
                  className={`input input-bordered w-full mt-1 ${
                    errors.subjectCode && "input-error"
                  }`}
                  placeholder="E.g. FECSO1"
                />
                {errors.subjectCode && (
                  <p className="text-red-500 text-sm mt-1">{errors.subjectCode}</p>
                )}
              </div>

              
              <div className="mb-3">
                <label className="font-medium">Subject Name</label>
                <input
                  name="subjectName"
                  type="text"
                  onChange={handleChange}
                  className={`input input-bordered w-full mt-1 ${
                    errors.subjectName && "input-error"
                  }`}
                  placeholder="E.g. Ecology"
                />
                {errors.subjectName && (
                  <p className="text-red-500 text-sm mt-1">{errors.subjectName}</p>
                )}
              </div>

              
              <div className="mb-3">
                <label className="font-medium">Due Date</label>
                <input
                  name="dueDate"
                  type="date"
                  onChange={handleChange}
                  className={`input input-bordered w-full mt-1 ${
                    errors.dueDate && "input-error"
                  }`}
                />
                {errors.dueDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.dueDate}</p>
                )}
              </div>

              
              <div className="mb-3">
                <label className="font-medium">Students List (CSV or Excel File)</label>
                <input
                  name="file"
                  type="file"
                  accept=".csv , application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  onChange={handleChange}
                  className={`file-input file-input-bordered w-full mt-1 ${
                    errors.file && "file-input-error"
                  }`}
                />
                {errors.file && (
                  <p className="text-red-500 text-sm mt-1">{errors.file}</p>
                )}
              </div>

              <div className="modal-action">
                <button type="submit" className="btn btn-neutral w-full">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Request;
