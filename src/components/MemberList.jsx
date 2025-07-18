import { useState } from "react";
import React from "react";
export default function MemberList({ members, setMembers }) {
  const [newMember, setNewMember] = useState("");

  const addMember = () => {
    if (newMember && !members.includes(newMember)) {
      setMembers([...members, newMember]);
      setNewMember("");
    }
  };

  return (
    <div className="space-y-2">
      <h2 className="text-xl font-bold text-blue-200 mb-2">Add Member</h2>
      <div className="flex gap-2">
        <input
          className="border border-gray-400 rounded-lg px-3 py-2 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          value={newMember}
          onChange={(e) => setNewMember(e.target.value)}
          placeholder="Member name"
        />
        <button
          onClick={addMember}
          className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white px-5 py-2 rounded-lg font-semibold shadow transition"
        >
          Add
        </button>
      </div>
    </div>
  );
}
