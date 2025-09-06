// pages/notre-comite.js
import Navbar from "../components/Navbar";
import Footer from '../components/Footer';
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import SponsorsBar from "../components/Sponsors";
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
        <div>
            <Head>
                <title>Notre Comité</title>
                <meta name="description" content="Rencontrez les membres dévoués du comité de Femme & Droit, promoteurs de féminisme et d'égalité." />
                <meta name="keywords" content="comité, membres, féminisme, Université de Montréal, égalité" />
            </Head>
            <Navbar />
            <main className="p-8">
                <h1 className="page-title text-center mb-8">NOTRE COMITÉ</h1>

                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {users.map((member) => (
                            <div key={member.id} className="flex flex-col items-center text-center">
                                <img src={member.profilePicture} alt={member.name} className="rounded-full w-64 h-32 sm:w-64 sm:h-80 lg:w-96 lg:h-96 mb-4 object-cover border-image" />
                                <h2 className="text-xl font-semibold">{member.name}</h2>
                                <p className="text-gray-600">{member.title}</p>
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
                <SponsorsBar />
            </main>
            <Footer />
        </div>
    );
}
