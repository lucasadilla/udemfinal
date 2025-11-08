// pages/notre-comite.js
import Navbar from "../components/Navbar";
import Head from "next/head";
import React, { useRef, useState } from "react";
import useUsers from "../hooks/useUsers";
import LoadingSpinner from "../components/LoadingSpinner";
import useAdminStatus from "../hooks/useAdminStatus";

export default function NotreComite() {
    const { users, loading, addUser, deleteUser } = useUsers();
    const isAdmin = useAdminStatus();
    const [name, setName] = useState("");
    const [title, setTitle] = useState("");
    const [profilePictureFile, setProfilePictureFile] = useState(null);
    const fileInputRef = useRef(null);

    const handleProfilePictureChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) {
            setProfilePictureFile(null);
            return;
        }
        setProfilePictureFile(file);
    };

    const uploadProfilePicture = async () => {
        if (!profilePictureFile) {
            return "";
        }

        const formData = new FormData();
        formData.append("file", profilePictureFile);

        const response = await fetch("/api/user-images", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            let errorMessage = "Échec du téléversement de la photo de profil.";
            try {
                const data = await response.json();
                if (typeof data?.error === "string" && data.error.trim()) {
                    errorMessage = data.error;
                }
            } catch (error) {
                // Ignore JSON parsing errors and use default message.
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        return typeof data?.url === "string" ? data.url : "";
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        const normalizedName = name.trim();
        const normalizedTitle = title.trim();
        if (!normalizedName || !normalizedTitle) {
            alert('Veuillez remplir les champs Nom et Titre.');
            return;
        }
        let uploadedProfilePicture = "";
        try {
            uploadedProfilePicture = await uploadProfilePicture();
        } catch (error) {
            console.error(error);
            alert(error.message || "Impossible de téléverser la photo de profil sélectionnée.");
            return;
        }

        await addUser({
            name: normalizedName,
            title: normalizedTitle,
            profilePicture: uploadedProfilePicture,
        });
        setName("");
        setTitle("");
        setProfilePictureFile(null);
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
                <main className="p-8">
                    <h1 className="page-title text-center mb-8">NOTRE COMITÉ</h1>

                    {loading ? (
                        <LoadingSpinner />
                    ) : (
                        <div className="committee-grid">
                            {users.map((member) => (
                                <div key={member.id} className="committee-card">
                                    <img
                                        src={member.profilePicture}
                                        alt={member.name}
                                        className="committee-avatar border-image mb-1"
                                    />
                                    <h2 className="text-xl font-semibold leading-tight">{member.name}</h2>
                                    <p className="text-gray-600 leading-snug">{member.title}</p>
                                    {isAdmin && (
                                        <button onClick={() => deleteUser(member.id)} className="committee-delete">
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
