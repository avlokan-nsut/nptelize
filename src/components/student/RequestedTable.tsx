import React from 'react';

const headings = [
  'Subject Code',
  'Subject Name',
  'Coordinator',
  'Due Date',
  'Upload Certificate',
];

const data = [
  {
    code: '1',
    name: 'Cy Ganderton',
    coordinator: 'Quality Control Specialist',
    dueDate: '20/12/2025',
    // You can add more fields as needed
  },
  // Add more rows as needed
];

const RequestedTable = () => {
  return (
    <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-100 bg-white max-w-7xl mx-auto">
      <table className="table w-full">
        <thead className="bg-gray-200">
          <tr className="text-gray-600 text-sm font-medium">
            {headings.map((heading, idx) => (
              <th key={idx} className="px-6 py-4">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-50 transition-colors duration-200">
              <td className="px-6 py-4 font-medium">{row.code}</td>
              <td className="px-6 py-4">{row.name}</td>
              <td className="px-6 py-4">{row.coordinator}</td>
              <td className="px-6 py-4">{row.dueDate}</td>
              <td className="px-6 py-4">
                <label className="flex items-center justify-center space-x-2">
                  <input
                    type="file"
                    className="
                      file-input file-input-sm w-[65%] max-w-xs text-sm
                      file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0
                      file:text-sm file:bg-blue-50 file:text-blue-600
                      hover:file:bg-blue-100 cursor-pointer
                    "
                  />
                  <button className="btn btn-sm btn-neutral">Submit</button>
                </label>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RequestedTable;
