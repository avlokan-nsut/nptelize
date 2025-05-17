import { useState } from 'react';

interface StudentForm {
  name: string;
  email: string;
  password: string;
  roll_number: string;
}

const CreateStudent = () => {
  const [students, setStudents] = useState<StudentForm[]>([{
    name: '',
    email: '',
    password: '',
    roll_number: ''
  }]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAddStudent = () => {
    setStudents([
      ...students,
      { name: '', email: '', password: '', roll_number: '' }
    ]);
  };

  const handleRemoveStudent = (index: number) => {
    const updatedStudents = students.filter((_, i) => i !== index);
    setStudents(updatedStudents);
  };

  const handleChange = (index: number, field: keyof StudentForm, value: string) => {
    const updatedStudents = [...students];
    updatedStudents[index] = {
      ...updatedStudents[index],
      [field]: value
    };
    setStudents(updatedStudents);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const isValid = students.every(student => 
      student.name.trim() !== '' && 
      student.email.trim() !== '' && 
      student.password.trim() !== '' && 
      student.roll_number.trim() !== ''
    );
    
    if (!isValid) {
      setError('Please fill in all fields for each student.');
      return;
    }

    // Mock form submission
    setIsSubmitting(true);
    setError(null);
    
    // Simulate API call with timeout
    setTimeout(() => {
      setSuccessMessage(`Successfully created ${students.length} student${students.length > 1 ? 's' : ''}`);
      setStudents([{ name: '', email: '', password: '', roll_number: '' }]);
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Create Students</h2>
      
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
        {students.map((student, index) => (
          <div key={index} className="mb-6 p-4 border border-gray-200 rounded">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium">Student {index + 1}</h3>
              {students.length > 1 && (
                <button 
                  type="button" 
                  onClick={() => handleRemoveStudent(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={student.name}
                  onChange={(e) => handleChange(index, 'name', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={student.email}
                  onChange={(e) => handleChange(index, 'email', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={student.password}
                  onChange={(e) => handleChange(index, 'password', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                <input
                  type="text"
                  value={student.roll_number}
                  onChange={(e) => handleChange(index, 'roll_number', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
            </div>
          </div>
        ))}
        
        <div className="flex gap-4 mt-4">
          <button
            type="button"
            onClick={handleAddStudent}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            + Add Another Student
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Creating...' : 'Create Students'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateStudent;
