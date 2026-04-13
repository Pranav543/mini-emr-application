"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format, addDays, isBefore, addWeeks, addMonths, parseISO, startOfDay } from "date-fns";

function calculateProjections(items: any[], dateField: string, repeatField: string) {
    const today = startOfDay(new Date());
    const limit = addMonths(today, 12);
    const projections: any[] = [];

    items.forEach(item => {
        let currentDate = parseISO(item[dateField]);
        let count = 0;
        while (isBefore(currentDate, limit) && count < 10) { // Limit to avoid infinite loops, but realistically limit total to 5 later
            if (!isBefore(currentDate, today)) {
                projections.push({ ...item, projectedDate: currentDate });
                count++;
            }
            if (!item[repeatField]) break;
            
            if (item[repeatField] === 'weekly') {
                currentDate = addWeeks(currentDate, 1);
            } else if (item[repeatField] === 'monthly') {
                currentDate = addMonths(currentDate, 1);
            } else {
                break;
            }
        }
    });

    return projections.sort((a, b) => a.projectedDate.getTime() - b.projectedDate.getTime());
}

export default function PatientDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<"summary" | "appointments" | "prescriptions">("summary");

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }

        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/portal/me`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
        .then(res => {
            if (!res.ok) throw new Error("Unauthorized");
            return res.json();
        })
        .then(data => {
            setUser(data);
            setLoading(false);
        })
        .catch(() => {
            localStorage.removeItem("token");
            router.push("/login");
        });
    }, [router]);

    if (loading) return <div className="p-8 flex justify-center text-gray-500 rounded text-xl animate-pulse">Loading Patient Data...</div>;

    const today = new Date();
    const next7Days = addDays(today, 7);

    // Filter appointments (Top 5 handled inside calculateProjections)
    const allAppointmentsProjected = calculateProjections(user.appointments, 'datetime', 'repeat');
    const upcomingAppointments = allAppointmentsProjected
        .filter((a: any) => isBefore(a.projectedDate, next7Days));

    // Basic Refill Filter 
    const allRefillsProjected = calculateProjections(user.prescriptions, 'refill_on', 'refill_schedule');
    const upcomingRefills = allRefillsProjected
        .filter((p: any) => isBefore(p.projectedDate, next7Days));

    if (viewMode !== "summary") {
        return (
            <div className="max-w-4xl mx-auto p-4 md:p-8 min-h-screen bg-gray-50">
                <button onClick={() => setViewMode("summary")} className="text-blue-600 font-semibold mb-6 hover:underline flex items-center">&larr; Back to Dashboard</button>
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-6 border-b">
                        <h2 className="text-2xl font-bold text-gray-800">
                            {viewMode === "appointments" ? "Upcoming Appointment Schedule" : "Upcoming Medication Refills"} <span className="text-sm font-normal text-gray-500">(Top 5)</span>
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="p-4 text-left font-medium text-gray-600">Date</th>
                                    {viewMode === "appointments" ? (
                                        <th className="p-4 text-left font-medium text-gray-600">Provider</th>
                                    ) : (
                                        <>
                                            <th className="p-4 text-left font-medium text-gray-600">Medication</th>
                                            <th className="p-4 text-left font-medium text-gray-600">Details</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {(viewMode === "appointments" ? allAppointmentsProjected.slice(0, 5) : allRefillsProjected.slice(0, 5)).map((item, i) => (
                                    <tr key={`${item.id}-${i}`} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-semibold text-gray-800">{format(item.projectedDate, "PPP")}</td>
                                        {viewMode === "appointments" ? (
                                            <td className="p-4 text-gray-600">{item.provider}</td>
                                        ) : (
                                            <>
                                                <td className="p-4 text-gray-600">{item.medication}</td>
                                                <td className="p-4 text-gray-600">{item.dosage} x{item.quantity}</td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 min-h-screen bg-gray-50">
            <header className="flex justify-between items-center mb-8 bg-white p-6 shadow rounded-lg">
                <h1 className="text-3xl font-bold text-gray-800">Welcome, {user.name}</h1>
                <button 
                    onClick={() => { localStorage.removeItem("token"); router.push("/login"); }}
                    className="text-sm bg-gray-200 px-4 py-2 font-semibold text-gray-700 rounded hover:bg-gray-300 transition-colors"
                >
                    Logout
                </button>
            </header>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="p-6 bg-white rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4 text-blue-800 border-b pb-2 flex items-center justify-between">Upcoming Appointments <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Next 7 Days</span></h2>
                    {upcomingAppointments.length === 0 ? (
                        <p className="text-gray-500 italic py-4 text-center">No appointments scheduled.</p>
                    ) : (
                        <ul className="space-y-4">
                            {upcomingAppointments.map((a: any, i: number) => (
                                <li key={`${a.id}-${i}`} className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500 shadow-sm flex flex-col gap-1">
                                    <div className="font-semibold text-gray-800">{a.provider}</div>
                                    <div className="text-sm text-gray-600">{format(a.projectedDate, "PPP 'at' p")}</div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="p-6 bg-white rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4 text-green-800 border-b pb-2 flex items-center justify-between">Medication Refills <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Next 7 Days</span></h2>
                    {upcomingRefills.length === 0 ? (
                        <p className="text-gray-500 py-4 text-center italic">No refills scheduled.</p>
                    ) : (
                        <ul className="space-y-4">
                            {upcomingRefills.map((p: any, i: number) => (
                                <li key={`${p.id}-${i}`} className="p-4 bg-gray-50 rounded-lg border-l-4 border-green-500 shadow-sm flex flex-col gap-1">
                                    <div className="font-semibold text-gray-800">{p.medication} <span className="font-normal text-gray-500 text-sm ml-2">({p.dosage})</span></div>
                                    <div className="text-sm text-gray-600 font-medium text-green-700 mt-1">Refill on: {format(p.projectedDate, "PPP")}</div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-800">All Active Prescriptions</h2>
                    <button onClick={() => setViewMode("prescriptions")} className="text-blue-600 text-sm hover:underline">View 3-Month Projections &rarr;</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-4 text-left font-medium text-gray-600">Medication</th>
                                <th className="p-4 text-left font-medium text-gray-600">Dosage</th>
                                <th className="p-4 text-left font-medium text-gray-600">Qty</th>
                                <th className="p-4 text-left font-medium text-gray-600">Schedule</th>
                                <th className="p-4 text-left font-medium text-gray-600">Next Refill</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...user.prescriptions].sort((a: any, b: any) => {
                                const nextA = allRefillsProjected.find((proj: any) => proj.id === a.id);
                                const nextB = allRefillsProjected.find((proj: any) => proj.id === b.id);
                                const timeA = nextA ? nextA.projectedDate.getTime() : Infinity;
                                const timeB = nextB ? nextB.projectedDate.getTime() : Infinity;
                                return timeA - timeB;
                            }).map((p: any) => {
                                const nextRefill = allRefillsProjected.find((proj: any) => proj.id === p.id);
                                return (
                                <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                                    <td className="p-4 font-semibold text-gray-800">{p.medication}</td>
                                    <td className="p-4 text-gray-600">{p.dosage}</td>
                                    <td className="p-4 text-gray-600">{p.quantity}</td>
                                    <td className="p-4 text-gray-600 capitalize">{p.refill_schedule || 'None'}</td>
                                    <td className="p-4 text-gray-600">
                                        {nextRefill ? format(nextRefill.projectedDate, "PPP") : <span className="text-gray-400 italic">No upcoming refills</span>}
                                    </td>
                                </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-8 bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-800">All Appointments</h2>
                    <button onClick={() => setViewMode("appointments")} className="text-blue-600 text-sm hover:underline">View 3-Month Projections &rarr;</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-4 text-left font-medium text-gray-600">Provider</th>
                                <th className="p-4 text-left font-medium text-gray-600">Date & Time</th>
                                <th className="p-4 text-left font-medium text-gray-600">Recurring</th>
                            </tr>
                        </thead>
                        <tbody>
                            {user.appointments.sort((a: any, b: any) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()).map((a: any) => (
                                <tr key={a.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                                    <td className="p-4 font-semibold text-gray-800">{a.provider}</td>
                                    <td className="p-4 text-gray-600">{format(new Date(a.datetime), "PPP 'at' p")}</td>
                                    <td className="p-4 text-gray-600 capitalize">{a.repeat || 'None'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
