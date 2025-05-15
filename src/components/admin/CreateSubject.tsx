import { useState } from 'react';

interface SubjectForm {
  name: string;
  subject_code: string;
  teacher_id: string;
}

// Mock teacher data
const mockTeachers = [
  { id: '1', name: 'Dr. John Smith', employee_id: 'EMP001' },
  { id: '2', name: 'Prof. Sarah Johnson', employee_id: 'EMP002' },
  { id: '3', name: 'Dr. Michael Brown', employee_id: 'EMP003' },
  { id: '4', name: 'Prof. Lisa Davis', employee_id: 'EMP004' },
  { id: '5', name: 'Dr. Robert Wilson', employee_id: 'EMP005' },
];

const CreateSubject = () => {
  const [subjects, setSubjects] = useState<SubjectForm[]>([{
    name: '',
    subject_code: '',
    teacher_id: ''
  }]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAddSubject = () => {
    setSubjects([
      ...subjects,
      { name: '', subject_code: '', teacher_id: '' }
    ]);
  };

  const handleRemoveSubject = (index: number) => {
    const updatedSubjects = subjects.filter((_, i) => i !== index);
    setSubjects(updatedSubjects);
  };

  const handleChange = (index: number, field: keyof SubjectForm, value: string) => {
    const updatedSubjects = [...subjects];
    updatedSubjects[index] = {
      ...updatedSubjects[index],
      [field]: value
    };
    setSubjects(updatedSubjects);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const isValid = subjects.every(subject => 
      subject.name.trim() !== '' && 
      subject.subject_code.trim() !== '' && 
      subject.teacher_id.trim() !== ''
    );
    
    if (!isValid) {
      setError('Please fill in all fields for each subject.');
      return;
    }

    // Mock form submission
    setIsSubmitting(true);
    setError(null);
    
    // Simulate API call with timeout
    setTimeout(() => {
      setSuccessMessage(`Successfully created ${subjects.length} subject${subjects.length > 1 ? 's' : ''}`);
      setSubjects([{ name: '', subject_code: '', teacher_id: '' }]);
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Create Subjects</h2>
      
      {/* Success message */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded">
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-600 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {subjects.map((subject, index) => (
          <div key={index} className="mb-6 p-4 border border-gray-200 rounded">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium">Subject {index + 1}</h3>
              {subjects.length > 1 && (
                <button 
                  type="button" 
                  onClick={() => handleRemoveSubject(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
                <input
                  type="text"
                  value={subject.name}
                  onChange={(e) => handleChange(index, 'name', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code</label>
                <input
                  type="text"
                  value={subject.subject_code}
                  onChange={(e) => handleChange(index, 'subject_code', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Faculty</label>
                <select
                  value={subject.teacher_id}
                  onChange={(e) => handleChange(index, 'teacher_id', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                >
                  <option value="">Select a faculty member</option>
                  {mockTeachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name} ({teacher.employee_id})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
        
        <div className="flex gap-4 mt-4">
          <button
            type="button"
            onClick={handleAddSubject}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            + Add Another Subject
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Creating...' : 'Create Subjects'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateSubject;
