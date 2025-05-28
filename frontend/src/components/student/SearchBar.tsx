import React from "react";

type SearchBarProps = {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
};

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, placeholder = "Search..." }) => {
    return (
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="border rounded px-4 py-2 w-full"
        />
    );
};

export default SearchBar;