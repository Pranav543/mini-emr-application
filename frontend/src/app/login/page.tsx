"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            const formData = new URLSearchParams();
            formData.append("username", email);
            formData.append("password", password);

            const response = await fetch("http://127.0.0.1:8000/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Invalid credentials");
            }

            const data = await response.json();
            localStorage.setItem("token", data.access_token);
            router.push("/");
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <form onSubmit={handleLogin} className="max-w-sm w-full bg-white p-8 rounded shadow text-gray-900">
                <h1 className="text-2xl font-bold mb-6 text-center text-gray-900">Patient Portal Login</h1>
                
                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input 
                        type="email" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full border rounded p-2 focus:ring focus:border-blue-300"
                        required 
                    />
                </div>
                
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-1">Password</label>
                    <input 
                        type="password" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full border rounded p-2 focus:ring focus:border-blue-300"
                        required 
                    />
                </div>

                <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700">
                    Log In
                </button>

                <p className="mt-4 text-sm text-gray-500 text-center">
                    Sample users: mark@some-email-provider.net or lisa@some-email-provider.net (Password123!)
                </p>
            </form>
        </div>
    );
}
