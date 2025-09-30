// pages/notre-comite.js
import Navbar from "../components/Navbar";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import useUsers from "../hooks/useUsers";

export default function NotreComite() {
    const { users, loading, addUser, deleteUser } = useUsers();
    const [isAdmin, setIsAdmin] = useState(false);
    const [name, setName] = useState("");
    const [title, setTitle] = useState("");
    const [profilePicture, setProfilePicture] = useState("");
    const fileInputRef = useRef(null);

    useEffect(() => {
        setIsAdmin(document.cookie.includes('admin-auth=true'));
    }, []);

    const handleProfilePictureChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) {
            setProfilePicture("");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setProfilePicture(reader.result.toString());
        };
        reader.readAsDataURL(file);
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        await addUser({ name, title, profilePicture });
        setName("");
        setTitle("");
        setProfilePicture("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <>
            <Head>
                <title>Notre Comité</title>
                <meta name="description" content="Rencontrez les membres dévoués du comité de Femme & Droit, promoteurs de féminisme et d'égalité." />
                <meta name="keywords" content="comité, membres, féminisme, Université de Montréal, égalité" />
            </Head>
            <div>
                <Navbar />
                <main className="page-wrapper committee-page">
                    <h1 className="page-title text-center mb-8">NOTRE COMITÉ</h1>

                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <div className="grid grid-cols-1 gap-8 justify-items-center sm:grid-cols-2 xl:grid-cols-3">
                        {users.map((member) => (
                            <div key={member.id} className="flex flex-col items-center text-center">
                                <img
                                    src={member.profilePicture}
                                    alt={member.name}
                                    className="committee-avatar border-image mb-1"
                                />
                                <h2 className="text-xl font-semibold leading-tight">{member.name}</h2>
                                <p className="text-gray-600 leading-snug">{member.title}</p>
                                {isAdmin && (
                                    <button onClick={() => deleteUser(member.id)} className="mt-2 text-red-600">
                                        Supprimer
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {isAdmin && (
                    <div className="mt-12">
                        <h2 className="text-xl font-semibold text-center mb-4">Ajouter un membre</h2>
                        <form onSubmit={handleAddUser} className="flex flex-col space-y-2 max-w-md mx-auto">
                            <input
                                className="border p-2"
                                type="text"
                                placeholder="Nom"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                            <input
                                className="border p-2"
                                type="text"
                                placeholder="Titre"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                            <input
                                ref={fileInputRef}
                                className="border p-2"
                                type="file"
                                accept="image/*"
                                onChange={handleProfilePictureChange}
                            />
                            <button className="bg-blue-500 text-white p-2" type="submit">
                                Ajouter
                            </button>
                        </form>
                    </div>
                )}
                </main>
            </div>
        </>
    );
}
