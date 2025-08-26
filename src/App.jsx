import { useState } from "react";
import DatePicker from "./components/DatePicker";
import MonthViewCalendar from "./components/MonthViewCalendar";
import ScheduleTable from "./components/ScheduleTable";
import Forum from "./components/Forum";
import LoginPage from "./components/LoginPage";
import React from "react";
import "./App.css"; // Ensure you have your styles imported
import ShiftSchedule from "./components/ShiftSchedule";

// API base URL
const API_BASE = "http://192.168.1.229:4000";

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
  const [profileGroup, setProfileGroup] = useState(""); // <-- ensure profileGroup is always defined
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState("");

  // Logout: clear cookie
  const handleLogout = () => {
    document.cookie = "soc_user=; path=/; max-age=0";
    setUser(null);
  };

  // Fetch group from DB when profile is opened
  const handleOpenProfile = async () => {
    setShowProfile(true);
    try {
      const res = await fetch(`${API_BASE}/api/get-group?name=${encodeURIComponent(user.name)}`); // <-- use 'name'
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

  // Save schedule to DB
  const handleSaveSchedule = async () => {
    setSaving(true);
    setSaveResult("");
    try {
      console.log( "Saving schedule for month:", currentMonth);
      console.log("Schedule data:", schedule);
      const res = await fetch(`${API_BASE}/api/save-month-schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedule, month: currentMonth })
      });
      if (res.ok) {
        setSaveResult("Schedule saved successfully!");
      } else {
        setSaveResult("Failed to save schedule.");
      }
    } catch {
      setSaveResult("Failed to save schedule.");
    }
    setSaving(false);
    setTimeout(() => setShowSaveConfirm(false), 1200);
  };

  // Delete/reset schedule for the current month
  const handleDeleteSchedule = async () => {
    setDeleting(true);
    setDeleteResult("");
    try {
      const res = await fetch(`${API_BASE}/api/delete-month-schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: currentMonth })
      });
      if (res.ok) {
        setDeleteResult("Schedule deleted successfully!");
        setSchedule({}); // Optionally clear frontend schedule
      } else {
        setDeleteResult("Failed to delete schedule.");
      }
    } catch {
      setDeleteResult("Failed to delete schedule.");
    }
    setDeleting(false);
    setTimeout(() => setShowDeleteConfirm(false), 1200);
  };

  // Fetch all members from DB on mount and use for scheduling
  React.useEffect(() => {
    async function fetchMembers() {
      try {
        const res = await fetch(`${API_BASE}/api/all-member-groups`);
        if (res.ok) {
          const data = await res.json();
          setMembers(data.filter(m => m.group !== "BACKEND").map(m => m.name));
        }
      } catch {}
    }
    fetchMembers();
  }, []);

  // Fetch all shifts (calendar with members' shifts) from DB on login/refresh/page load
  React.useEffect(() => {
    async function fetchAllShifts() {
      try {
        const res = await fetch(`${API_BASE}/api/get-schedule`);
        if (res.ok) {
          const data = await res.json();
          const normalizedSchedule = {};
          Object.entries(data.schedule || data).forEach(([key, value]) => {
            const match = key.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
            if (match) {
              const [_, m, d, y] = match;
              const iso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
              normalizedSchedule[iso] = value;
            } else {
              normalizedSchedule[key] = value;
            }
          });
          setSchedule(normalizedSchedule);
        }
      } catch (error) {
        console.error("Failed to fetch all shifts:", error);
        setSchedule({});
      }
    }
    if (user) fetchAllShifts();
  }, [user]);

  // Remove or comment out this effect to prevent overwriting the full schedule:
  // React.useEffect(() => {
  //   async function fetchSchedule() {
  //     try {
  //       const res = await fetch(`/api/get-month-schedule?month=${encodeURIComponent(currentMonth)}`);
  //       if (res.ok) {
  //         const data = await res.json();
  //         setSchedule(data.schedule || {});
  //       }
  //     } catch {}
  //   }
  //   if (user) fetchSchedule();
  // }, [currentMonth, user]);

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }
<ShiftSchedule />


  return (
    <div className="min-h-screen bg-[#181e29] flex flex-col">
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
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
        
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
            {/* MemberList removed */}
            {/* <DatePicker selectedDate={selectedDate} setSelectedDate={setSelectedDate} /> */}
            <MonthViewCalendar
              schedule={schedule}
              members={members}
              monthDate={currentMonth}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              setCurrentMonth={setCurrentMonth}
              setSchedule={setSchedule}
            />
            <ScheduleTable
              members={members}
              selectedDate={selectedDate}
              schedule={schedule}
              setSchedule={setSchedule}
            />
            {/* Save and Delete buttons at bottom */}
            <div className="flex justify-end gap-4 mt-8">
              <button
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold shadow transition"
                onClick={() => setShowSaveConfirm(true)}
                disabled={saving}
              >
                Save Month Schedule
              </button>
              <button
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold shadow transition"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleting}
              >
                Delete/Reset Month Schedule
              </button>
            </div>
            {/* Confirmation popup for save */}
            {showSaveConfirm && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl shadow-2xl p-8 min-w-[320px] max-w-xs flex flex-col items-center relative">
                  <h2 className="text-xl font-bold text-green-700 mb-4">Confirm Save</h2>
                  <div className="mb-4 text-gray-700 text-center">
                    Are you sure you want to save the entire month's schedule to the database?
                  </div>
                  {saveResult && (
                    <div className={`mb-2 font-semibold ${saveResult.includes("success") ? "text-green-600" : "text-red-600"}`}>
                      {saveResult}
                    </div>
                  )}
                  <div className="flex gap-4 mt-2">
                    <button
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded font-bold"
                      onClick={handleSaveSchedule}
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Confirm"}
                    </button>
                    <button
                      className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-1 rounded font-bold"
                      onClick={() => setShowSaveConfirm(false)}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Confirmation popup for delete/reset */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl shadow-2xl p-8 min-w-[320px] max-w-xs flex flex-col items-center relative">
                  <h2 className="text-xl font-bold text-red-700 mb-4">Confirm Delete/Reset</h2>
                  <div className="mb-4 text-gray-700 text-center">
                    Are you sure you want to delete/reset the entire month's schedule from the database?
                  </div>
                  {deleteResult && (
                    <div className={`mb-2 font-semibold ${deleteResult.includes("success") ? "text-green-600" : "text-red-600"}`}>
                      {deleteResult}
                    </div>
                  )}
                  <div className="flex gap-4 mt-2">
                    <button
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded font-bold"
                      onClick={handleDeleteSchedule}
                      disabled={deleting}
                    >
                      {deleting ? "Deleting..." : "Confirm"}
                    </button>
                    <button
                      className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-1 rounded font-bold"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={deleting}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <Forum members={members} clients={clients} setClients={setClients} />
        )}
      </div>
      <footer className="mt-8 text-gray-400 text-xs text-center">&copy; {new Date().getFullYear()} SOC Scheduler</footer>
    </div>
  );
}
 

