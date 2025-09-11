import { useState } from "react";
import { useRouter } from "next/router";

export default function AdminLoginForm() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        const res = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });
        if (res.ok) {
            router.reload();
        } else {
            setError("Invalid credentials");
        }
    };

    return (
        <div>
            {error && <p className="text-red-500">{error}</p>}
            <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
                <input
                    className="border p-2"
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <input
                    className="border p-2"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button className="bg-blue-500 text-white p-2" type="submit">
                    Login
                </button>
            </form>
        </div>
    );
}
