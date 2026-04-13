"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";

export default function UserDetailPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.id;

    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [medications, setMedications] = useState<string[]>([]);
    const [dosages, setDosages] = useState<string[]>([]);
    
    // UI state
    const [showEditUser, setShowEditUser] = useState(false);
    const [showAddAppt, setShowAddAppt] = useState(false);
    const [showAddPresc, setShowAddPresc] = useState(false);

    // Form states
    const [userForm, setUserForm] = useState({ name: "", email: "" });
    const [apptForm, setApptForm] = useState({ provider: "", datetime: "", repeat: "" });
    const [prescForm, setPrescForm] = useState({ medication: "", dosage: "", quantity: 1, refill_schedule: "", refill_on: "" });

    const fetchUser = async () => {
        try {
            const res = await fetch(`http://127.0.0.1:8000/admin/users/${userId}`, { cache: "no-store" });
            const data = await res.json();
            setUser(data);
            setUserForm({ name: data.name, email: data.email });
            setLoading(false);
        } catch (e) {
            console.error("Failed to fetch user");
        }
    };

    const fetchDropdowns = async () => {
        const [meds, dos] = await Promise.all([
            fetch(`http://127.0.0.1:8000/admin/medications`).then(r => r.json()),
            fetch(`http://127.0.0.1:8000/admin/dosages`).then(r => r.json())
        ]);
        setMedications(meds);
        setDosages(dos);
    };

    useEffect(() => {
        fetchUser();
        fetchDropdowns();
    }, [userId]);

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch(`http://127.0.0.1:8000/admin/users/${userId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userForm),
        });
        setShowEditUser(false);
        fetchUser();
    };

    const handleAddAppt = async (e: React.FormEvent) => {
        e.preventDefault();
        // Convert the local datetime-local value to an ISO string
        // The HTML input type="datetime-local" yields "YYYY-MM-DDTHH:mm" (local time)
        const localDate = new Date(apptForm.datetime);
        
        await fetch(`http://127.0.0.1:8000/admin/users/${userId}/appointments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...apptForm, datetime: localDate.toISOString() }),
        });
        setShowAddAppt(false);
        setApptForm({ provider: "", datetime: "", repeat: "" });
        fetchUser();
    };

    const handleDeleteAppt = async (id: number) => {
        await fetch(`http://127.0.0.1:8000/admin/appointments/${id}`, { method: "DELETE" });
        fetchUser();
    };

    const handleAddPresc = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch(`http://127.0.0.1:8000/admin/users/${userId}/prescriptions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(prescForm),
        });
        setShowAddPresc(false);
        setPrescForm({ medication: "", dosage: "", quantity: 1, refill_schedule: "", refill_on: "" });
        fetchUser();
    };

    const handleDeletePresc = async (id: number) => {
        await fetch(`http://127.0.0.1:8000/admin/prescriptions/${id}`, { method: "DELETE" });
        fetchUser();
    };

    if (loading) return <div className="p-8 text-gray-500">Loading patient data...</div>;

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 text-gray-900 bg-gray-50 min-h-screen">
            <button onClick={() => router.push("/admin")} className="text-blue-600 font-semibold mb-6 hover:underline flex items-center">&larr; Back to Dashboard</button>

            <header className="flex justify-between items-center mb-8 bg-white p-6 shadow rounded-lg border">
                <div>
                    <h1 className="text-3xl font-bold">{user.name}</h1>
                    <p className="text-gray-600">{user.email}</p>
                </div>
                <button 
                    onClick={() => setShowEditUser(true)}
                    className="text-sm bg-gray-200 px-4 py-2 font-semibold rounded hover:bg-gray-300"
                >
                    Edit Details
                </button>
            </header>

            {/* Edit User Modal */}
            {showEditUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <form onSubmit={handleUpdateUser} className="bg-white p-6 rounded shadow max-w-sm w-full">
                        <h2 className="text-xl font-bold mb-4">Edit Patient Data</h2>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Name</label>
                            <input type="text" value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} className="w-full border rounded p-2" required />
                        </div>
                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-1">Email</label>
                            <input type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} className="w-full border rounded p-2" required />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setShowEditUser(false)} className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">Cancel</button>
                            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Save</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Appointments Section */}
                <div className="bg-white rounded-lg shadow border overflow-hidden">
                    <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                        <h2 className="text-xl font-bold text-gray-800">Appointments</h2>
                        <button onClick={() => setShowAddAppt(true)} className="bg-blue-600 text-white text-sm px-3 py-1 rounded hover:bg-blue-700">+ Schedule</button>
                    </div>
                    <div className="p-0">
                        <table className="min-w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b">
                                    <th className="p-4 font-medium text-gray-600 text-sm">Provider</th>
                                    <th className="p-4 font-medium text-gray-600 text-sm">Date</th>
                                    <th className="p-4 font-medium text-gray-600 text-sm">Recurring</th>
                                    <th className="p-4 font-medium text-gray-600 text-sm text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {user.appointments.map((a: any) => (
                                    <tr key={a.id} className="border-b last:border-0 hover:bg-gray-50">
                                        <td className="p-4 font-semibold">{a.provider}</td>
                                        <td className="p-4 text-gray-600 text-sm">{format(parseISO(a.datetime), "PPP 'at' p")}</td>
                                        <td className="p-4 text-gray-600 capitalize text-sm">{a.repeat || 'None'}</td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => handleDeleteAppt(a.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Prescriptions Section */}
                <div className="bg-white rounded-lg shadow border overflow-hidden">
                    <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                        <h2 className="text-xl font-bold text-gray-800">Prescriptions</h2>
                        <button onClick={() => setShowAddPresc(true)} className="bg-green-600 text-white text-sm px-3 py-1 rounded hover:bg-green-700">+ Prescribe</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b">
                                    <th className="p-4 font-medium text-gray-600 text-sm">Medication</th>
                                    <th className="p-4 font-medium text-gray-600 text-sm">Dosage / Qty</th>
                                    <th className="p-4 font-medium text-gray-600 text-sm">Refills</th>
                                    <th className="p-4 font-medium text-gray-600 text-sm text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {user.prescriptions.map((p: any) => (
                                    <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                                        <td className="p-4 font-semibold">{p.medication}</td>
                                        <td className="p-4 text-gray-600 text-sm">{p.dosage} <span className="text-gray-400 mx-1">|</span> x{p.quantity}</td>
                                        <td className="p-4 text-gray-600 text-sm">
                                            <div>{format(parseISO(p.refill_on), "PPP")}</div>
                                            <div className="text-xs text-gray-500 capitalize">{p.refill_schedule || 'No repeated refills'}</div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => handleDeletePresc(p.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Add Appt Modal */}
            {showAddAppt && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <form onSubmit={handleAddAppt} className="bg-white p-6 rounded shadow max-w-sm w-full">
                        <h2 className="text-xl font-bold mb-4">Schedule Appointment</h2>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Provider</label>
                            <input type="text" value={apptForm.provider} onChange={e => setApptForm({ ...apptForm, provider: e.target.value })} className="w-full border rounded p-2" required placeholder="Dr. Smith" />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Date & Time</label>
                            <input type="datetime-local" value={apptForm.datetime} onChange={e => setApptForm({ ...apptForm, datetime: e.target.value })} className="w-full border rounded p-2" required />
                        </div>
                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-1">Recurring</label>
                            <select value={apptForm.repeat} onChange={e => setApptForm({ ...apptForm, repeat: e.target.value })} className="w-full border rounded p-2 text-gray-900 bg-white">
                                <option value="">None</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setShowAddAppt(false)} className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">Cancel</button>
                            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Save</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Add Presc Modal */}
            {showAddPresc && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <form onSubmit={handleAddPresc} className="bg-white p-6 rounded shadow max-w-sm w-full">
                        <h2 className="text-xl font-bold mb-4">Prescribe Medication</h2>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Medication</label>
                            <select value={prescForm.medication} onChange={e => setPrescForm({ ...prescForm, medication: e.target.value })} className="w-full border rounded p-2 bg-white text-gray-900" required>
                                <option value="">Select...</option>
                                {medications.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div className="mb-4 grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Dosage</label>
                                <select value={prescForm.dosage} onChange={e => setPrescForm({ ...prescForm, dosage: e.target.value })} className="w-full border rounded p-2 bg-white text-gray-900" required>
                                    <option value="">Select...</option>
                                    {dosages.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Quantity</label>
                                <input type="number" min="1" value={prescForm.quantity} onChange={e => setPrescForm({ ...prescForm, quantity: parseInt(e.target.value) })} className="w-full border rounded p-2" required />
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">First Refill Date</label>
                            <input type="date" value={prescForm.refill_on} onChange={e => setPrescForm({ ...prescForm, refill_on: e.target.value })} className="w-full border rounded p-2" required />
                        </div>
                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-1">Refill Schedule</label>
                            <select value={prescForm.refill_schedule} onChange={e => setPrescForm({ ...prescForm, refill_schedule: e.target.value })} className="w-full border rounded p-2 bg-white text-gray-900">
                                <option value="">None</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setShowAddPresc(false)} className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">Cancel</button>
                            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Save</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
