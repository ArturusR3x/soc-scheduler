import React, { useState, useEffect } from "react";
import DraggableMember from "./DraggableMember";

// API base URL
const API_BASE = "http://192.168.1.229:4000";

export default function ScheduleTable({ members, selectedDate, schedule, setSchedule }) {
  const [dragOver, setDragOver] = useState({});
  const [memberGroups, setMemberGroups] = useState({});
  const [allDbMembers, setAllDbMembers] = useState([]); // <-- store all DB members

  const dateKey = selectedDate.toISOString().split("T")[0];

  // Fetch all member names from backend and use for unassigned
  useEffect(() => {
    async function fetchGroupsAndMembers() {
      try {
        const res = await fetch(`${API_BASE}/api/all-member-groups`);
        if (res.ok) {
          const data = await res.json(); // [{ name, group }]
          const map = {};
          data.forEach(m => { map[m.name] = m.group; });
          setMemberGroups(map);
          setAllDbMembers(data.map(m => m.name)); // <-- set all member names from DB
        }
      } catch {}
    }
    fetchGroupsAndMembers();
  }, [members]);

  // Fetch schedule for selectedDate from DB when selectedDate changes
  // REMOVE or COMMENT OUT this effect to prevent overwriting the full schedule:
  // useEffect(() => {
  //   async function fetchDaySchedule() {
  //     const dateKey = selectedDate.toISOString().split("T")[0];
  //     try {
  //       const res = await fetch(`${API_BASE}/api/get-month-schedule?month=${encodeURIComponent(selectedDate)}`);
  //       if (res.ok) {
  //         const data = await res.json();
  //         // Only update the selected date's schedule
  //         if (data.schedule && data.schedule[dateKey]) {
  //           setSchedule(prev => ({
  //             ...prev,
  //             [dateKey]: data.schedule[dateKey]
  //           }));
  //         }
  //       }
  //     } catch {}
  //   }
  //   fetchDaySchedule();
  // }, [selectedDate, setSchedule]);

  // Group members by shift
  const shiftGroups = { 1: [], 2: [], 3: [], unassigned: [] };
  // Remove .unassigned population here, only use for assigned shifts
  members.forEach(member => {
    const shift = schedule[dateKey]?.[member];
    if (shift === "1" || shift === 1) shiftGroups[1].push(member);
    else if (shift === "2" || shift === 2) shiftGroups[2].push(member);
    else if (shift === "3" || shift === 3) shiftGroups[3].push(member);
    // Do NOT push to shiftGroups.unassigned here
  });

  // Unassigned: all DB members minus those assigned to a shift
  const assigned = [...shiftGroups[1], ...shiftGroups[2], ...shiftGroups[3]];
  const unassignedMembers = allDbMembers.filter(m => !assigned.includes(m));

  const onDrop = (shiftNum, e) => {
    e.preventDefault();
    setDragOver(d => ({ ...d, [shiftNum]: false }));
    const member = e.dataTransfer.getData("member");
    if (!member) return;
    setSchedule(prev => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        [member]: shiftNum,
      },
    }));
  };

  const onRemove = (member) => {
    setSchedule(prev => {
      const newDay = { ...prev[dateKey] };
      delete newDay[member];
      return { ...prev, [dateKey]: newDay };
    });
  };

  const shiftColors = {
    1: "bg-green-500/80 border-green-700",
    2: "bg-[#800020]/80 border-[#800020]",
    3: "bg-blue-500/80 border-blue-700",
    unassigned: "bg-gray-700 border-gray-600"
  };

  const highlight = "ring-4 ring-blue-300/40";

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-blue-200 mb-2">Assign Shifts for {dateKey}</h2>
      <div className="grid grid-cols-4 gap-4">
        {/* Unassigned */}
        <div
          className={`rounded-lg p-3 min-h-[120px] border-2 ${shiftColors.unassigned} transition-all duration-200 ${dragOver.unassigned ? highlight : ""}`}
          onDragOver={e => { e.preventDefault(); setDragOver(d => ({ ...d, unassigned: true })); }}
          onDragLeave={() => setDragOver(d => ({ ...d, unassigned: false }))}
          onDrop={e => onDrop("", e)}
        >
          <div className="font-semibold text-gray-200 mb-2 text-center">Unassigned</div>
          {unassignedMembers.map(member => (
            <div key={member} className="flex items-center gap-2">
              <DraggableMember member={member} />
              <span className="text-xs text-blue-300 font-bold ml-2">
                {memberGroups[member] ? `(${memberGroups[member]})` : ""}
              </span>
            </div>
          ))}
        </div>
        {/* Shift 1, 2, 3 */}
        {[1,2,3].map(shiftNum => (
          <div
            key={shiftNum}
            className={`rounded-lg p-3 min-h-[120px] border-2 ${shiftColors[shiftNum]} transition-all duration-200 ${dragOver[shiftNum] ? highlight : ""}`}
            onDragOver={e => { e.preventDefault(); setDragOver(d => ({ ...d, [shiftNum]: true })); }}
            onDragLeave={() => setDragOver(d => ({ ...d, [shiftNum]: false }))}
            onDrop={e => onDrop(shiftNum, e)}
          >
            <div className="font-semibold text-white mb-2 text-center">Shift {shiftNum}</div>
            {shiftGroups[shiftNum].map(member => (
              <div key={member} className="flex items-center gap-2">
                <DraggableMember member={member} />
                <span className="text-xs text-blue-100 font-bold ml-2">
                  {memberGroups[member] ? `(${memberGroups[member]})` : ""}
                </span>
                <button
                  className="text-xs text-red-300 hover:text-red-500 px-1"
                  onClick={() => onRemove(member)}
                  title="Remove from shift"
                >✕</button>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="text-xs text-gray-400 mt-2">Drag members into a shift category. Changes sync with the calendar.</div>
    </div>
  );
}
