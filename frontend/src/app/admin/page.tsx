"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";

export default function AdminPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isAddingUser, setIsAddingUser] = useState(false);
    const [newUserForm, setNewUserForm] = useState({ name: "", email: "", password: "" });
    const [error, setError] = useState("");

    const fetchUsers = async () => {
        try {
            const res = await fetch("http://127.0.0.1:8000/admin/users", { cache: "no-store" });
            const data = await res.json();
            setUsers(data);
            setLoading(false);
        } catch (e) {
            console.error("Failed to fetch users");
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        
        try {
            const res = await fetch("http://127.0.0.1:8000/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newUserForm),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Failed to create user");
            }
            
            setNewUserForm({ name: "", email: "", password: "" });
            setIsAddingUser(false);
            fetchUsers();
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (loading) return <div className="p-8 text-gray-500">Loading users...</div>;

    return (
        <div className="p-8 text-gray-900 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Mini-EMR Admin Dashboard</h1>
                <button 
                    onClick={() => setIsAddingUser(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    + New Patient
                </button>
            </div>

            {isAddingUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <form onSubmit={handleAddUser} className="bg-white p-6 rounded shadow max-w-sm w-full">
                        <h2 className="text-xl font-bold mb-4">Add New Patient</h2>
                        
                        {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">{error}</div>}

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Name</label>
                            <input 
                                type="text" 
                                value={newUserForm.name}
                                onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })}
                                className="w-full border rounded p-2 focus:ring focus:border-blue-300"
                                required 
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Email</label>
                            <input 
                                type="email" 
                                value={newUserForm.email}
                                onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })}
                                className="w-full border rounded p-2 focus:ring focus:border-blue-300"
                                required 
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-1">Password</label>
                            <input 
                                type="password" 
                                value={newUserForm.password}
                                onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })}
                                className="w-full border rounded p-2 focus:ring focus:border-blue-300"
                                required 
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <button 
                                type="button" 
                                onClick={() => setIsAddingUser(false)}
                                className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            >
                                Save
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="overflow-x-auto bg-white rounded shadow border">
                <table className="min-w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="p-4 border-b font-medium text-gray-600">ID</th>
                            <th className="p-4 border-b font-medium text-gray-600">Name</th>
                            <th className="p-4 border-b font-medium text-gray-600">Email</th>
                            <th className="p-4 border-b font-medium text-gray-600">Upcoming Appointments</th>
                            <th className="p-4 border-b font-medium text-gray-600">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user: any) => (
                            <tr key={user.id} className="hover:bg-gray-50 border-b last:border-0 transition-colors">
                                <td className="p-4 text-gray-600">{user.id}</td>
                                <td className="p-4 font-semibold text-gray-800">{user.name}</td>
                                <td className="p-4 text-gray-600">{user.email}</td>
                                <td className="p-4">
                                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-medium">
                                        {user.appointments?.filter((a: any) => new Date(a.datetime) > new Date()).length || 0} Scheduled
                                    </span>
                                </td>
                                <td className="p-4">
                                    <Link href={`/admin/users/${user.id}`} className="text-blue-600 font-semibold hover:underline">
                                        Manage Patient Record
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
