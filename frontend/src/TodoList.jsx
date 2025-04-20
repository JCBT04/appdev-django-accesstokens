import { useState, useEffect } from "react";

const BASE_URL = "https://appdev-django-accesstokens.onrender.com";
const API_URL = `${BASE_URL}/api/todo`;

export default function TodoList() {
    const [tasks, setTasks] = useState([]);
    const [task, setTask] = useState("");
    const [editingIndex, setEditingIndex] = useState(null);
    const [editingText, setEditingText] = useState("");
    const [filter, setFilter] = useState(localStorage.getItem("filter") || "all");
    const [darkMode, setDarkMode] = useState(localStorage.getItem("theme") === "dark");

    const [username, setUsername] = useState("admin");
    const [password, setPassword] = useState("admin123");
    const [token, setToken] = useState(localStorage.getItem("token") || "");

    const login = async () => {
        const res = await fetch(`${BASE_URL}/api-token-auth/`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ username, password }),
        });

        const data = await res.json();
        if (data.token) {
            setToken(data.token);
            localStorage.setItem("token", data.token);
            fetchTasks(data.token);
        } else {
            alert("Login failed. Please check credentials.");
        }
    };

    const fetchTasks = (authToken = token) => {
        fetch(`${API_URL}/`, {
            headers: { Authorization: `Token ${authToken}` },
        })
            .then(res => {
                if (!res.ok) throw new Error(`HTTP status ${res.status}`);
                return res.json();
            })
            .then(data => setTasks(data))
            .catch(err => {
                console.error("Fetch error:", err);
                alert(`There was an issue fetching the tasks: ${err.message}`);
            });
    };

    useEffect(() => {
        if (token) fetchTasks();
    }, [token]);

    useEffect(() => {
        localStorage.setItem("theme", darkMode ? "dark" : "light");
        document.body.className = darkMode ? "dark-mode" : "light-mode";
    }, [darkMode]);

    useEffect(() => {
        localStorage.setItem("filter", filter);
    }, [filter]);

    const addTask = () => {
        if (task.trim() === "") return;

        fetch(`${API_URL}/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${token}`,
            },
            body: JSON.stringify({ title: task, completed: false }),
        })
            .then(res => res.json())
            .then(newTask => setTasks(prevTasks => [...prevTasks, newTask]))
            .catch(err => console.error("Add task error:", err));

        setTask("");
    };

    const handleKeyDown = (event) => {
        if (event.key === "Enter") {
            if (editingIndex !== null) {
                saveEditing(editingIndex);
            } else {
                addTask();
            }
        }
    };

    const toggleTaskCompletion = (todo) => {
        fetch(`${API_URL}/${todo.id}/`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${token}`,
            },
            body: JSON.stringify({ ...todo, completed: !todo.completed }),
        })
            .then(res => res.json())
            .then(updatedTask => {
                setTasks(tasks.map(t => (t.id === updatedTask.id ? updatedTask : t)));
            })
            .catch(err => console.error("Toggle error:", err));
    };

    const startEditing = (index) => {
        setEditingIndex(index);
        setEditingText(tasks[index].title);
    };

    const cancelEditing = () => {
        setEditingIndex(null);
        setEditingText("");
    };

    const saveEditing = (index) => {
        const todo = tasks[index];
        if (editingText.trim() === "") return;

        fetch(`${API_URL}/${todo.id}/`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${token}`,
            },
            body: JSON.stringify({ ...todo, title: editingText }),
        })
            .then(res => res.json())
            .then(updated => {
                const updatedList = [...tasks];
                updatedList[index] = updated;
                setTasks(updatedList);
                cancelEditing();
            })
            .catch(err => console.error("Save edit error:", err));
    };

    const deleteTask = (id) => {
        fetch(`${API_URL}/${id}/`, {
            method: "DELETE",
            headers: { Authorization: `Token ${token}` },
        })
            .then(() => setTasks(tasks.filter(t => t.id !== id)))
            .catch(err => console.error("Delete error:", err));
    };

    const filteredTasks = tasks.filter((t) => {
        if (filter === "completed") return t.completed;
        if (filter === "pending") return !t.completed;
        return true;
    });

    return (
        <div className={`app-container ${darkMode ? "dark-mode" : "light-mode"}`}>
            <h2>To-Do List</h2>

            {!token ? (
                <div className="login-container">
                    <div className="login-card">
                        <h3 className="login-title">🔐 Sign In</h3>
                        <p className="login-subtitle">Access your tasks with your account</p>
                        <input
                            type="text"
                            placeholder="👤 Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="login-input"
                        />
                        <input
                            type="password"
                            placeholder="🔑 Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="login-input"
                        />
                        <button onClick={login} className="login-btn">Login</button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="command-bar">
                        <input
                            type="text"
                            placeholder="Add a new task..."
                            value={task}
                            onChange={(e) => setTask(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <button onClick={addTask}>Add Task</button>
                        <button onClick={() => setDarkMode(!darkMode)}>
                            {darkMode ? "🌙" : "🔆"}
                        </button>
                        <button onClick={() => {
                            setToken("");
                            localStorage.removeItem("token");
                        }}>
                            Logout
                        </button>
                    </div>

                    <div className="filter-buttons">
                        {["all", "completed", "pending"].map((type) => (
                            <button
                                key={type}
                                className={filter === type ? "active" : ""}
                                onClick={() => setFilter(type)}
                            >
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </button>
                        ))}
                    </div>

                    <div className="task-list-container">
                        <div className="task-list">
                            {filteredTasks.length === 0 ? (
                                <p className="no-tasks">No tasks found. Add a new task!</p>
                            ) : (
                                filteredTasks.map((t, index) => (
                                    <div key={t.id} className={`task-card ${t.completed ? "completed" : ""}`}>
                                        <input
                                            type="checkbox"
                                            checked={t.completed}
                                            onChange={() => toggleTaskCompletion(t)}
                                        />
                                        {editingIndex === index ? (
                                            <input
                                                type="text"
                                                value={editingText}
                                                onChange={(e) => setEditingText(e.target.value)}
                                                onKeyDown={handleKeyDown}
                                                className="edit-input"
                                                autoFocus
                                            />
                                        ) : (
                                            <span
                                                className="task-text"
                                                onClick={() => toggleTaskCompletion(t)}
                                                style={{ textDecoration: t.completed ? "line-through" : "none" }}
                                            >
                                                {t.title}
                                            </span>
                                        )}
                                        <div className="task-actions">
                                            {editingIndex === index ? (
                                                <>
                                                    <button className="save-btn" onClick={() => saveEditing(index)}>
                                                        Save
                                                    </button>
                                                    <button className="cancel-btn" onClick={cancelEditing}>
                                                        Cancel
                                                    </button>
                                                </>
                                            ) : (
                                                <button className="edit-btn" onClick={() => startEditing(index)}>
                                                    Edit
                                                </button>
                                            )}
                                            <button className="remove-btn" onClick={() => deleteTask(t.id)}>
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}

            <footer>Task Manager App © 2023</footer>

            <style>
{`
    body {
        margin: 0;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        transition: background-color 0.3s, color 0.3s;
    }

    .light-mode {
        background-color: #f3f4f6;
        color: #111827;
    }

    .dark-mode {
        background-color: #1f2937;
        color: #f9fafb;
    }

    .app-container {
        padding: 2rem;
        min-height: 100vh;
    }

    .login-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 80vh;
        padding: 1rem;
    }

    .login-card {
        background-color: var(--card-bg, #ffffff);
        padding: 2.5rem;
        border-radius: 1rem;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        width: 100%;
        max-width: 400px;
        text-align: center;
        transition: background-color 0.3s;
    }

    .dark-mode .login-card {
        background-color: #374151;
    }

    .login-title {
        font-size: 1.8rem;
        font-weight: 600;
        margin-bottom: 0.25rem;
    }

    .login-subtitle {
        font-size: 0.95rem;
        color: #9ca3af;
        margin-bottom: 1.5rem;
    }

    .login-input {
        width: 100%;
        padding: 0.75rem 1rem;
        margin-bottom: 1rem;
        border-radius: 0.75rem;
        border: 1px solid #d1d5db;
        font-size: 1rem;
        outline: none;
        transition: border-color 0.3s;
    }

    .login-input:focus {
        border-color: #6366f1;
    }

    .dark-mode .login-input {
        background-color: #1f2937;
        color: #f9fafb;
        border: 1px solid #4b5563;
    }

    .login-btn {
        width: 100%;
        padding: 0.75rem;
        background-color: #4f46e5;
        color: white;
        font-weight: 600;
        border: none;
        border-radius: 0.75rem;
        cursor: pointer;
        font-size: 1rem;
        transition: background-color 0.3s, transform 0.2s;
    }

    .login-btn:hover {
        background-color: #4338ca;
        transform: translateY(-1px);
    }

    .login-btn:active {
        transform: scale(0.98);
    }
`}
</style>

        </div>
    );
}
