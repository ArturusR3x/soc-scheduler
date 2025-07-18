import { useState } from "react";
import MemberList from "./components/MemberList";
import DatePicker from "./components/DatePicker";
import ScheduleTable from "./components/ScheduleTable";
import MonthViewCalendar from "./components/MonthViewCalendar";
import Forum from "./components/Forum";
import LoginPage from "./components/LoginPage";
import React from "react";
// Add this somewhere in your JSX layout (below the shift editor or as a tab)
export default function App() {
  const [members, setMembers] = useState([]);
  const [schedule, setSchedule] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [page, setPage] = useState("scheduler"); // <-- Add page state
  const [clients, setClients] = useState([]); // <-- Add clients state
  const [user, setUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [profileGroup, setProfileGroup] = useState(user?.group || "");

  // Fetch group from DB when profile is opened
  const handleOpenProfile = async () => {
    setShowProfile(true);
    try {
      const res = await fetch(`/api/get-group?name=${encodeURIComponent(user.name)}`); // <-- use 'name'
      if (res.ok) {
        const data = await res.json();
        setProfileGroup(data.group || "");
      } else {
        setProfileGroup(user.group || "");
      }
    } catch {
      setProfileGroup(user.group || "");
    }
  };

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 flex flex-col items-center py-8 px-2">
      <div className="w-full bg-white/10 rounded-2xl shadow-2xl p-8 space-y-8">
        {/* Show logged-in user and group */}
        <div className="flex justify-between items-center mb-2">
          <span className="text-blue-200 font-semibold">
            Logged in as: {user.name}
            {profileGroup ? ` (${profileGroup})` : ""}
          </span>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 rounded bg-gray-700 text-white hover:bg-blue-700 transition text-xs"
              onClick={handleOpenProfile}
            >
              Profile
            </button>
            <button
              className="px-3 py-1 rounded bg-gray-700 text-white hover:bg-blue-700 transition text-xs"
              onClick={() => setUser(null)}
            >
              Logout
            </button>
          </div>
        </div>
        {/* Show user's group at the top of the schedule page */}
        {page === "scheduler" && (
          <div className="mb-4 text-lg text-blue-400 font-bold text-center">
            Your Group: {profileGroup || "-"}
          </div>
        )}
        {/* Profile Popup */}
        {showProfile && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-8 min-w-[320px] max-w-xs flex flex-col items-center relative">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-xl font-bold"
                onClick={() => setShowProfile(false)}
                title="Close"
              >×</button>
              <h2 className="text-2xl font-bold text-blue-700 mb-4">User Profile</h2>
              <div className="w-full text-left space-y-2">
                <div>
                  <span className="font-semibold text-gray-700">Full Name:</span>
                  <span className="ml-2 text-gray-900">{user.name}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Username:</span>
                  <span className="ml-2 text-gray-900">{user.username}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Email:</span>
                  <span className="ml-2 text-gray-900">{user.email}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Group:</span>
                  <span className="ml-2 text-gray-900">{profileGroup || "-"}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Page Switcher */}
        <div className="flex justify-end gap-2 mb-2">
          <button
            className={`px-4 py-1 rounded font-semibold ${
              page === "scheduler"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-blue-200 hover:bg-blue-800"
            }`}
            onClick={() => setPage("scheduler")}
          >
            Scheduler
          </button>
          <button
            className={`px-4 py-1 rounded font-semibold ${
              page === "forum"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-blue-200 hover:bg-blue-800"
            }`}
            onClick={() => setPage("forum")}
          >
            Forum / Notes
          </button>
        </div>
        {page === "scheduler" ? (
          <>
            <h1 className="text-4xl font-extrabold text-center text-blue-300 drop-shadow mb-4 tracking-tight">SOC Shift Scheduler</h1>
            <MemberList members={members} setMembers={setMembers} />
            {/* <DatePicker selectedDate={selectedDate} setSelectedDate={setSelectedDate} /> */}
            <ScheduleTable
              members={members}
              selectedDate={selectedDate}
              schedule={schedule}
              setSchedule={setSchedule}
            />
            <MonthViewCalendar
              schedule={schedule}
              members={members}
              monthDate={currentMonth}
              setSelectedDate={setSelectedDate}
              setCurrentMonth={setCurrentMonth}
              setSchedule={setSchedule} // <-- add this
            />
          </>
        ) : (
          <Forum members={members} clients={clients} setClients={setClients} />
        )}
      </div>
      <footer className="mt-8 text-gray-400 text-xs text-center">&copy; {new Date().getFullYear()} SOC Scheduler</footer>
    </div>
  );
}
