
import React from "react";
export default function DatePicker({ selectedDate, setSelectedDate }) {
  return (
    <div className="space-y-2">
      <h2 className="text-xl font-bold text-blue-200 mb-2">Select Date</h2>
      <input
        type="date"
        value={selectedDate.toISOString().split("T")[0]}
        onChange={(e) => setSelectedDate(new Date(e.target.value))}
        className="border border-gray-400 rounded-lg px-3 py-2 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
      />
    </div>
  );
}
