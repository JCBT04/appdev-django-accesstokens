import { useState, useEffect } from "react";
import "./index.css"; // make sure this is imported if you move styles to a separate file

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
                        <h3>🔐 Sign In</h3>
                        <p className="login-subtitle">Access your tasks with your account</p>
                        <input
                            type="text"
                            placeholder="👤 Username"
                            className="login-input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="🔑 Password"
                            className="login-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button className="login-btn" onClick={login}>
                            Login
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {/* rest of the app continues here (no change) */}
                </>
            )}

            <footer>Task Manager App © 2023</footer>
        </div>
    );
}
