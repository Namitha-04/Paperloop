import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import { api } from "./api";

export default function App() {
  const [department, setDepartment] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("paperloop_token");
    if (!token) {
      setChecking(false);
      return;
    }
    api.me()
      .then((data) => setDepartment(data.department))
      .catch(() => localStorage.removeItem("paperloop_token"))
      .finally(() => setChecking(false));
  }, []);

  function handleLogout() {
    localStorage.removeItem("paperloop_token");
    setDepartment(null);
  }

  if (checking) return null;

  return department ? (
    <Dashboard department={department} onLogout={handleLogout} />
  ) : (
    <Login onLogin={setDepartment} />
  );
}
