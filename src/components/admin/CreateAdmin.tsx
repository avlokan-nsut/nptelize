import { useState } from 'react';

interface AdminForm {
  name: string;
  email: string;
  password: string;
  employee_id: string;
}

const CreateAdmin = () => {
  const [admins, setAdmins] = useState<AdminForm[]>([{
    name: '',
    email: '',
    password: '',
    employee_id: ''
  }]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAddAdmin = () => {
    setAdmins([
      ...admins,
      { name: '', email: '', password: '', employee_id: '' }
    ]);
  };

  const handleRemoveAdmin = (index: number) => {
    const updatedAdmins = admins.filter((_, i) => i !== index);
    setAdmins(updatedAdmins);
  };

  const handleChange = (index: number, field: keyof AdminForm, value: string) => {
    const updatedAdmins = [...admins];
    updatedAdmins[index] = {
      ...updatedAdmins[index],
      [field]: value
    };
    setAdmins(updatedAdmins);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const isValid = admins.every(admin => 
      admin.name.trim() !== '' && 
      admin.email.trim() !== '' && 
      admin.password.trim() !== '' && 
      admin.employee_id.trim() !== ''
    );
    
    if (!isValid) {
      setError('Please fill in all fields for each admin.');
      return;
    }

    // Mock form submission
    setIsSubmitting(true);
    setError(null);
    
    // Simulate API call with timeout
    setTimeout(() => {
      setSuccessMessage(`Successfully created ${admins.length} admin${admins.length > 1 ? 's' : ''}`);
      setAdmins([{ name: '', email: '', password: '', employee_id: '' }]);
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Create Admins</h2>
      
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
        {admins.map((admin, index) => (
          <div key={index} className="mb-6 p-4 border border-gray-200 rounded">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium">Admin {index + 1}</h3>
              {admins.length > 1 && (
                <button 
                  type="button" 
                  onClick={() => handleRemoveAdmin(index)}
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
                  value={admin.name}
                  onChange={(e) => handleChange(index, 'name', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={admin.email}
                  onChange={(e) => handleChange(index, 'email', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={admin.password}
                  onChange={(e) => handleChange(index, 'password', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                <input
                  type="text"
                  value={admin.employee_id}
                  onChange={(e) => handleChange(index, 'employee_id', e.target.value)}
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
            onClick={handleAddAdmin}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            + Add Another Admin
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Creating...' : 'Create Admins'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateAdmin;
