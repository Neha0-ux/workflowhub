import { useEffect, useState } from "react";
import { api } from "./api.js";

const STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

function AuthForm({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      if (mode === "register") await api.register(form);
      const { token, username } = await api.login({
        username: form.username,
        password: form.password,
      });
      onLogin(token, username);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="card auth" onSubmit={submit}>
      <h2>{mode === "login" ? "Log in" : "Create an account"}</h2>
      <input name="username" placeholder="Username" value={form.username} onChange={update} required />
      {mode === "register" && (
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={update} />
      )}
      <input name="password" type="password" placeholder="Password" value={form.password} onChange={update} required />
      {error && <p className="error">{error}</p>}
      <button type="submit">{mode === "login" ? "Log in" : "Register"}</button>
      <button type="button" className="link" onClick={() => setMode(mode === "login" ? "register" : "login")}>
        {mode === "login" ? "Need an account? Register" : "Have an account? Log in"}
      </button>
    </form>
  );
}

function WorkflowItem({ item, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ title: item.title, description: item.description });

  async function save() {
    await onUpdate(item.id, draft);
    setEditing(false);
  }

  return (
    <li className={`card item ${item.status}`}>
      {editing ? (
        <>
          <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          <div className="row">
            <button onClick={save}>Save</button>
            <button className="secondary" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </>
      ) : (
        <>
          <h3>{item.title}</h3>
          {item.description && <p>{item.description}</p>}
          <div className="row">
            <select value={item.status} onChange={(e) => onUpdate(item.id, { status: e.target.value })}>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <button className="secondary" onClick={() => setEditing(true)}>Edit</button>
            <button className="danger" onClick={() => onDelete(item.id)}>Delete</button>
          </div>
        </>
      )}
    </li>
  );
}

function Dashboard({ token, username, onLogout }) {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("");
  const [newItem, setNewItem] = useState({ title: "", description: "" });
  const [error, setError] = useState("");

  async function load() {
    try {
      setItems(await api.listItems(token, filter));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, [filter]);

  async function create(e) {
    e.preventDefault();
    await api.createItem(token, newItem);
    setNewItem({ title: "", description: "" });
    load();
  }

  async function update(id, changes) {
    await api.updateItem(token, id, changes);
    load();
  }

  async function remove(id) {
    if (!window.confirm("Delete this workflow item?")) return;
    await api.deleteItem(token, id);
    load();
  }

  return (
    <>
      <header>
        <h1>WorkFlowHub</h1>
        <span>Signed in as <b>{username}</b></span>
        <button className="secondary" onClick={onLogout}>Log out</button>
      </header>

      <form className="card" onSubmit={create}>
        <h2>New workflow item</h2>
        <input placeholder="Title" value={newItem.title} onChange={(e) => setNewItem({ ...newItem, title: e.target.value })} required />
        <textarea placeholder="Description" value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} />
        <button type="submit">Add item</button>
      </form>

      <div className="row filter">
        <label>Show:</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All</option>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {error && <p className="error">{error}</p>}
      <ul className="items">
        {items.map((item) => (
          <WorkflowItem key={item.id} item={item} onUpdate={update} onDelete={remove} />
        ))}
        {items.length === 0 && <p className="empty">No workflow items yet.</p>}
      </ul>
    </>
  );
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [username, setUsername] = useState(localStorage.getItem("username"));

  function handleLogin(newToken, name) {
    localStorage.setItem("token", newToken);
    localStorage.setItem("username", name);
    setToken(newToken);
    setUsername(name);
  }

  async function handleLogout() {
    try {
      await api.logout(token);
    } finally {
      localStorage.clear();
      setToken(null);
      setUsername(null);
    }
  }

  return (
    <main>
      {token ? (
        <Dashboard token={token} username={username} onLogout={handleLogout} />
      ) : (
        <>
          <h1 className="title">WorkFlowHub</h1>
          <AuthForm onLogin={handleLogin} />
        </>
      )}
    </main>
  );
}
