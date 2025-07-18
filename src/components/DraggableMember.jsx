import React, { useState } from "react";

export default function DraggableMember({ member }) {
  const [dragging, setDragging] = useState(false);
  return (
    <div
      draggable
      onDragStart={e => {
        e.dataTransfer.setData("member", member);
        setDragging(true);
      }}
      onDragEnd={() => setDragging(false)}
      className={`cursor-move px-3 py-1 bg-gray-700 text-white rounded shadow mb-1 text-center select-none transition-transform duration-200 ease-in-out ${dragging ? "scale-105 opacity-70 z-20" : ""}`}
      style={{ userSelect: "none" }}
    >
      {member}
    </div>
  );
}
