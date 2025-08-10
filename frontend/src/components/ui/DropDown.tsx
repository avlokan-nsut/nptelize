import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';

interface DropDownProps {
  options: { value: string | number; label: string }[];
  value: string | number;
  onChange: (value: string | number) => void;
  label?: string;
  className?: string;
}

const DropDown: React.FC<DropDownProps> = ({
  options,
  value,
  onChange,
  label,
  className = '',
}) => {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default DropDown;

// Specialized component for year and semester selection
export const TenureSelector: React.FC = () => {
  const { tenure, updateTenure } = useAuthStore();
  
  // Generate year options from 2025 to current year
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let year = 2025; year <= currentYear; year++) {
    yearOptions.push({ value: year, label: year.toString() });
  }
  
  // Semester options
  const semesterOptions = [
    { value: 1, label: 'Odd Semester' },
    { value: 0, label: 'Even Semester' }
  ];
  
  const handleYearChange = (value: string | number) => {
    if (tenure) {
      updateTenure({ ...tenure, year: Number(value) });
    }
  };
  
  const handleSemesterChange = (value: string | number) => {
    if (tenure) {
      updateTenure({ ...tenure, is_even: Number(value) });
    }
  };
  
  if (!tenure) return null;
  
  return (
    <div className="flex gap-4">
      <DropDown
        label="Year"
        options={yearOptions}
        value={tenure.year}
        onChange={handleYearChange}
      />
      <DropDown
        label="Semester"
        options={semesterOptions}
        value={tenure.is_even}
        onChange={handleSemesterChange}
      />
    </div>
  );
};
