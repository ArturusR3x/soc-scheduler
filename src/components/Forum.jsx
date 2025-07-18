import { useState } from "react";

export default function Forum({ members, clients = [], setClients }) {
  const [notes, setNotes] = useState([]);
  const [author, setAuthor] = useState(members[0] || "");
  const [shift, setShift] = useState("1");
  const [eventName, setEventName] = useState("");
  const [srcIP, setSrcIP] = useState("");
  const [dstIP, setDstIP] = useState("");
  const [hostname, setHostname] = useState("");
  const [description, setDescription] = useState("");
  const [action, setAction] = useState("");
  const [note, setNote] = useState("");
  const [client, setClient] = useState(clients[0] || "");
  const [newClient, setNewClient] = useState("");
  // Search/filter states
  const [searchClient, setSearchClient] = useState("");
  const [searchSrcIP, setSearchSrcIP] = useState("");
  const [searchHostname, setSearchHostname] = useState("");
  const [searchMode, setSearchMode] = useState("AND"); // "AND" or "OR"
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [replyingId, setReplyingId] = useState(null);
  const [editFields, setEditFields] = useState({});
  const [replyFields, setReplyFields] = useState({});
  const [replyInputs, setReplyInputs] = useState({}); // { [noteId]: string }

  // Helper to add a reply to a note (just a message)
  const addReply = (parentId) => {
    const message = (replyInputs[parentId] || "").trim();
    if (!message) return;
    setNotes(notes =>
      notes.map(n =>
        n.id === parentId
          ? {
              ...n,
              replies: [
                ...(n.replies || []),
                {
                  id: Date.now(),
                  author,
                  shift,
                  message,
                  date: new Date().toLocaleString(),
                  replies: [],
                },
              ],
            }
          : n
      )
    );
    setReplyInputs(prev => ({ ...prev, [parentId]: "" }));
    setReplyingId(null);
  };

  // Helper to update a note
  const saveEdit = (id) => {
    const fields = editFields[id] || {};
    if (
      !fields.eventName?.trim() ||
      !fields.srcIP?.trim() ||
      !fields.dstIP?.trim() ||
      !fields.hostname?.trim() ||
      !fields.description?.trim()
    ) {
      setEditFields(prev => ({
        ...prev,
        [id]: { ...fields, error: "Please fill in all required fields." }
      }));
      return;
    }
    setNotes(notes =>
      notes.map(n =>
        n.id === id
          ? { ...n, ...fields }
          : n
      )
    );
    setEditFields(prev => ({ ...prev, [id]: {} }));
    setEditingId(null);
  };

  // Helper to delete a note or reply
  const deleteNote = (id, parentId = null) => {
    if (parentId) {
      setNotes(notes =>
        notes.map(n =>
          n.id === parentId
            ? { ...n, replies: (n.replies || []).filter(r => r.id !== id) }
            : n
        )
      );
    } else {
      setNotes(notes => notes.filter(n => n.id !== id));
    }
  };

  // Filtering logic for notes
  const filterNotes = (notesArr) => {
    if (
      !searchClient.trim() &&
      !searchSrcIP.trim() &&
      !searchHostname.trim()
    ) return notesArr;
    return notesArr.filter(note => {
      const clientMatch = searchClient.trim()
        ? (note.client || "").toLowerCase().includes(searchClient.trim().toLowerCase())
        : undefined;
      const srcIPMatch = searchSrcIP.trim()
        ? (note.srcIP || "").toLowerCase().includes(searchSrcIP.trim().toLowerCase())
        : undefined;
      const hostnameMatch = searchHostname.trim()
        ? (note.hostname || "").toLowerCase().includes(searchHostname.trim().toLowerCase())
        : undefined;

      const checks = [clientMatch, srcIPMatch, hostnameMatch].filter(v => v !== undefined);

      if (checks.length === 0) return true;
      if (searchMode === "AND") {
        return checks.every(Boolean);
      } else {
        return checks.some(Boolean);
      }
    });
  };

  // Render a note or reply (recursive for replies)
  const renderNote = (note, parentId = null) => {
    const isEditing = editingId === note.id;
    const isReplying = replyingId === note.id;
    const fields = isEditing
      ? editFields[note.id] || { ...note }
      : note;
    const replyVals = replyFields[note.id] || {
      author: members[0] || "",
      shift: "1",
      eventName: "",
      srcIP: "",
      dstIP: "",
      hostname: "",
      description: "",
      action: "",
      note: "",
    };

    return (
      <div key={note.id} className="bg-gray-900 rounded-lg p-3 shadow border-l-4 mb-2"
        style={{
          borderColor:
            (note.shift || fields.shift) === "1"
              ? "#22c55e"
              : (note.shift || fields.shift) === "2"
              ? "#800020"
              : "#2563eb",
        }}
      >
        <div className="flex justify-between items-center mb-1">
          <span className="font-bold text-blue-200">{note.author || fields.author}</span>
          <span className="text-xs text-gray-400">{note.date || fields.date}</span>
        </div>
        <div className="text-xs mb-1">
          <span
            className={`px-2 py-0.5 rounded-full font-semibold ${
              (note.shift || fields.shift) === "1"
                ? "bg-green-600 text-white"
                : (note.shift || fields.shift) === "2"
                ? "bg-[#800020] text-white"
                : "bg-blue-600 text-white"
            }`}
          >
            Shift {note.shift || fields.shift}
          </span>
        </div>
        {/* If this is a reply (has message), show only message */}
        {"message" in note ? (
          <div className="text-white text-sm mb-1">{note.message}</div>
        ) : isEditing ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input
                className="rounded px-2 py-1 bg-gray-900 text-white"
                placeholder="Event Name*"
                value={fields.eventName}
                onChange={e =>
                  setEditFields(prev => ({
                    ...prev,
                    [note.id]: { ...fields, eventName: e.target.value }
                  }))
                }
                required
              />
              <input
                className="rounded px-2 py-1 bg-gray-900 text-white"
                placeholder="Source IP*"
                value={fields.srcIP}
                onChange={e =>
                  setEditFields(prev => ({
                    ...prev,
                    [note.id]: { ...fields, srcIP: e.target.value }
                  }))
                }
                required
              />
              <input
                className="rounded px-2 py-1 bg-gray-900 text-white"
                placeholder="Destination IP*"
                value={fields.dstIP}
                onChange={e =>
                  setEditFields(prev => ({
                    ...prev,
                    [note.id]: { ...fields, dstIP: e.target.value }
                  }))
                }
                required
              />
              <input
                className="rounded px-2 py-1 bg-gray-900 text-white"
                placeholder="Hostname*"
                value={fields.hostname}
                onChange={e =>
                  setEditFields(prev => ({
                    ...prev,
                    [note.id]: { ...fields, hostname: e.target.value }
                  }))
                }
                required
              />
            </div>
            <textarea
              className="w-full rounded bg-gray-900 text-white p-2 mt-2"
              rows={2}
              placeholder="Description*"
              value={fields.description}
              onChange={e =>
                setEditFields(prev => ({
                  ...prev,
                  [note.id]: { ...fields, description: e.target.value }
                }))
              }
              required
            />
            <input
              className="rounded px-2 py-1 bg-gray-900 text-white w-full"
              placeholder="Action"
              value={fields.action}
              onChange={e =>
                setEditFields(prev => ({
                  ...prev,
                  [note.id]: { ...fields, action: e.target.value }
                }))
              }
            />
            <input
              className="rounded px-2 py-1 bg-gray-900 text-white w-full"
              placeholder="Notes"
              value={fields.note}
              onChange={e =>
                setEditFields(prev => ({
                  ...prev,
                  [note.id]: { ...fields, note: e.target.value }
                }))
              }
            />
            {fields.error && <div className="text-red-400 text-sm">{fields.error}</div>}
            <div className="flex gap-2 mt-2">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded font-semibold transition"
                onClick={() => saveEdit(note.id)}
              >
                Save
              </button>
              <button
                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded font-semibold transition"
                onClick={() => { setEditingId(null); setEditFields(prev => ({ ...prev, [note.id]: {} })); }}
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-white text-sm mb-1"><b>Event:</b> {fields.eventName}</div>
            <div className="text-white text-xs mb-1">
              <b>Source IP:</b> {fields.srcIP} &nbsp; <b>Destination IP:</b> {fields.dstIP}
            </div>
            <div className="text-white text-xs mb-1"><b>Hostname:</b> {fields.hostname}</div>
            <div className="text-white text-xs mb-1"><b>Description:</b> {fields.description}</div>
            {fields.action && <div className="text-white text-xs mb-1"><b>Action:</b> {fields.action}</div>}
            {fields.note && <div className="text-white text-xs"><b>Notes:</b> {fields.note}</div>}
            <div className="flex gap-2 mt-2">
              <button
                className="text-blue-400 hover:underline text-xs"
                onClick={() => setReplyingId(note.id)}
              >
                Reply
              </button>
              <button
                className="text-yellow-400 hover:underline text-xs"
                onClick={() => { setEditingId(note.id); setEditFields(prev => ({ ...prev, [note.id]: { ...note } })); }}
              >
                Edit
              </button>
              <button
                className="text-red-400 hover:underline text-xs"
                onClick={() => deleteNote(note.id, parentId)}
              >
                Delete
              </button>
            </div>
          </>
        )}
        {isReplying && (
          <div className="flex gap-2 mt-2">
            <input
              className="rounded px-2 py-1 bg-gray-800 text-white flex-1"
              placeholder="Type your reply..."
              value={replyInputs[note.id] || ""}
              onChange={e =>
                setReplyInputs(prev => ({ ...prev, [note.id]: e.target.value }))
              }
              onKeyDown={e => {
                if (e.key === "Enter") addReply(note.id);
              }}
              autoFocus
            />
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded font-semibold transition"
              onClick={() => addReply(note.id)}
            >
              Reply
            </button>
            <button
              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded font-semibold transition"
              onClick={() => { setReplyingId(null); setReplyInputs(prev => ({ ...prev, [note.id]: "" })); }}
              type="button"
            >
              Cancel
            </button>
          </div>
        )}
        {/* Render replies recursively */}
        {Array.isArray(note.replies) && note.replies.length > 0 && (
          <div className="ml-6 mt-2 space-y-2">
            {note.replies.map(r => renderNote(r, note.id))}
          </div>
        )}
      </div>
    );
  };

  const handleAddClient = () => {
    const trimmed = newClient.trim();
    if (trimmed && !clients.includes(trimmed)) {
      setClients([...clients, trimmed]);
      setClient(trimmed);
      setNewClient("");
    }
  };

  const addNote = () => {
    if (
      !eventName.trim() ||
      !srcIP.trim() ||
      !dstIP.trim() ||
      !hostname.trim() ||
      !description.trim() ||
      !client.trim()
    ) {
      setError("Please fill in all required fields.");
      return;
    }
    setError("");
    setNotes([
      ...notes,
      {
        id: Date.now(),
        author,
        shift,
        eventName,
        srcIP,
        dstIP,
        hostname,
        description,
        action,
        note,
        client,
        date: new Date().toLocaleString(),
        replies: [],
      },
    ]);
    setEventName("");
    setSrcIP("");
    setDstIP("");
    setHostname("");
    setDescription("");
    setAction("");
    setNote("");
    setClient(clients[0] || "");
    setShowForm(false); // Hide form after adding note
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Search/filter section */}
      <div className="w-full flex flex-col items-center mb-4">
        <div className="flex flex-col md:flex-row gap-2 w-full max-w-2xl">
          <input
            className="rounded-l-lg md:rounded-l-lg md:rounded-r-none px-4 py-2 bg-gray-900 text-white flex-1 border-0 focus:ring-2 focus:ring-blue-500 transition"
            placeholder="Search by client"
            value={searchClient}
            onChange={e => setSearchClient(e.target.value)}
            style={{ minWidth: 0 }}
          />
          <input
            className="px-4 py-2 bg-gray-900 text-white flex-1 border-0 focus:ring-2 focus:ring-blue-500 transition md:rounded-none"
            placeholder="Search by source IP"
            value={searchSrcIP}
            onChange={e => setSearchSrcIP(e.target.value)}
            style={{ minWidth: 0 }}
          />
          <input
            className="px-4 py-2 bg-gray-900 text-white flex-1 border-0 focus:ring-2 focus:ring-blue-500 transition md:rounded-none"
            placeholder="Search by hostname"
            value={searchHostname}
            onChange={e => setSearchHostname(e.target.value)}
            style={{ minWidth: 0 }}
          />
          <select
            className="px-3 py-2 bg-gray-900 text-white border-0 focus:ring-2 focus:ring-blue-500 transition md:rounded-none"
            value={searchMode}
            onChange={e => setSearchMode(e.target.value)}
            style={{ minWidth: 0 }}
          >
            <option value="AND">AND</option>
            <option value="OR">OR</option>
          </select>
          <button
            className="rounded-r-lg md:rounded-r-lg md:rounded-l-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 font-semibold transition whitespace-nowrap"
            onClick={() => {
              setSearchClient("");
              setSearchSrcIP("");
              setSearchHostname("");
            }}
            type="button"
          >
            Clear
          </button>
        </div>
      </div>
      <h2 className="text-2xl font-bold text-blue-200 mb-4">SOC Forum / Notes</h2>
      {/* ...existing code... */}
      <div className="space-y-4">
        {filterNotes(notes).length === 0 && (
          <div className="text-gray-400 text-center">No notes found.</div>
        )}
        {filterNotes(notes).map(note => renderNote(note))}
      </div>
      {!showForm && (
        <div className="flex justify-center">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded font-semibold transition"
            onClick={() => setShowForm(true)}
          >
            Add Note
          </button>
        </div>
      )}
      {showForm && (
        <div className="bg-gray-800 rounded-lg p-4 space-y-3 shadow">
          <div className="flex gap-2">
            <select
              className="rounded px-2 py-1 bg-gray-900 text-white"
              value={author}
              onChange={e => setAuthor(e.target.value)}
            >
              {members.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select
              className="rounded px-2 py-1 bg-gray-900 text-white"
              value={shift}
              onChange={e => setShift(e.target.value)}
            >
              <option value="1">Shift 1</option>
              <option value="2">Shift 2</option>
              <option value="3">Shift 3</option>
            </select>
          </div>
          {/* Client select/add */}
          <div className="flex gap-2 items-center">
            <select
              className="rounded px-2 py-1 bg-gray-900 text-white flex-1"
              value={client}
              onChange={e => setClient(e.target.value)}
            >
              <option value="">Select client</option>
              {clients.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              className="rounded px-2 py-1 bg-gray-900 text-white flex-1"
              placeholder="Add new client"
              value={newClient}
              onChange={e => setNewClient(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleAddClient(); }}
            />
            <button
              className="bg-blue-700 hover:bg-blue-800 text-white px-2 py-1 rounded font-semibold transition"
              onClick={handleAddClient}
              type="button"
            >
              Add
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input
              className="rounded px-2 py-1 bg-gray-900 text-white"
              placeholder="Event Name*"
              value={eventName}
              onChange={e => setEventName(e.target.value)}
              required
            />
            <input
              className="rounded px-2 py-1 bg-gray-900 text-white"
              placeholder="Source IP*"
              value={srcIP}
              onChange={e => setSrcIP(e.target.value)}
              required
            />
            <input
              className="rounded px-2 py-1 bg-gray-900 text-white"
              placeholder="Destination IP*"
              value={dstIP}
              onChange={e => setDstIP(e.target.value)}
              required
            />
            <input
              className="rounded px-2 py-1 bg-gray-900 text-white"
              placeholder="Hostname*"
              value={hostname}
              onChange={e => setHostname(e.target.value)}
              required
            />
          </div>
          <textarea
            className="w-full rounded bg-gray-900 text-white p-2 mt-2"
            rows={2}
            placeholder="Description*"
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
          />
          <input
            className="rounded px-2 py-1 bg-gray-900 text-white w-full"
            placeholder="Action"
            value={action}
            onChange={e => setAction(e.target.value)}
          />
          <input
            className="rounded px-2 py-1 bg-gray-900 text-white w-full"
            placeholder="Notes"
            value={note}
            onChange={e => setNote(e.target.value)}
          />
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <div className="flex gap-2">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded font-semibold transition"
              onClick={addNote}
            >
              Post Note
            </button>
            <button
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-1 rounded font-semibold transition"
              onClick={() => { setShowForm(false); setError(""); }}
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}