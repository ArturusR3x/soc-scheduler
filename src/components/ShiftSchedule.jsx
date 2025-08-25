import { useEffect, useState } from "react";

// API base URL
const API_BASE = "http://192.168.1.229:4000";

export default function ShiftSchedule() {
  const [scheduleData, setScheduleData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/get-schedule`) // Assumes your Express route is already serving this
      .then(res => res.json())
      .then(data => {
        setScheduleData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching shift schedule:", err);
        setLoading(false);
      });
  }, []);

  const grouped = {};
  for (const { shift_date, shift_type, member_name } of scheduleData) {
    if (!grouped[shift_date]) grouped[shift_date] = {};
    if (!grouped[shift_date][shift_type]) grouped[shift_date][shift_type] = [];
    grouped[shift_date][shift_type].push(member_name);
  }

  return (
    <div className="mt-8 p-4 bg-white/10 rounded-xl shadow-lg text-white">
      <h2 className="text-2xl font-bold text-blue-300 mb-4">📅 Shift Overview</h2>
      {loading ? (
        <p className="text-gray-300">Loading schedule...</p>
      ) : Object.keys(grouped).length === 0 ? (
        <p className="text-gray-400">No shifts available.</p>
      ) : (
        Object.entries(grouped).map(([date, shifts]) => (
          <div key={date} className="mb-4">
            <div className="text-lg font-semibold text-blue-200">{date}</div>
            {Object.entries(shifts).map(([type, members]) => (
              <div key={type} className="ml-4 text-sm">
                <span className="text-blue-400 font-medium">Shift {type}:</span>{" "}
                {members.join(", ")}
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
