import { useState, useEffect } from "react";

// Use environment variable or fallback to production URL for API URL
const API_URL = process.env.REACT_APP_API_URL || "https://appdev-django-accesstokens.onrender.com";

export default function TodoList() {
    const [tasks, setTasks] = useState([]);
    const [task, setTask] = useState("");
    const [editingIndex, setEditingIndex] = useState(null);
    const [editingText, setEditingText] = useState("");
    const [filter, setFilter] = useState(localStorage.getItem("filter") || "all");
    const [darkMode, setDarkMode] = useState(localStorage.getItem("theme") === "dark");

    // ✅ Load tasks from Django API
    useEffect(() => {
        fetch(API_URL)
            .then(res => res.json())
            .then(data => {
                console.log("Fetched tasks:", data);  // Check if the tasks are fetched correctly
                setTasks(data);
            })
            .catch(err => {
                console.error("Fetch error:", err);
                alert("There was an issue fetching the tasks.");
            });
    }, []);

    useEffect(() => {
        localStorage.setItem("theme", darkMode ? "dark" : "light");
        document.body.className = darkMode ? "dark-mode" : "light-mode";
    }, [darkMode]);

    useEffect(() => {
        localStorage.setItem("filter", filter);
    }, [filter]);

    const addTask = () => {
        if (task.trim() === "") return;

        fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: task, completed: false })
        })
        .then(res => res.json())
        .then(newTask => setTasks(prevTasks => [...prevTasks, newTask]))  // Corrected state update
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
        fetch(`${API_URL}${todo.id}/`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...todo, completed: !todo.completed })
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

        fetch(`${API_URL}${todo.id}/`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...todo, title: editingText })
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
        fetch(`${API_URL}${id}/`, {
            method: "DELETE"
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
            <footer>Task Manager App © 2023</footer>
        </div>
    );
}
