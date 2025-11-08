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

    const normalizeImageFile = async (file) => {
        if (!file) {
            return null;
        }

        if (typeof window === "undefined") {
            return file;
        }

        return new Promise((resolve) => {
            const imageUrl = URL.createObjectURL(file);
            const image = new Image();

            image.onload = () => {
                try {
                    const canvas = document.createElement("canvas");
                    const targetSize = 512;
                    canvas.width = targetSize;
                    canvas.height = targetSize;
                    const context = canvas.getContext("2d");

                    if (!context) {
                        URL.revokeObjectURL(imageUrl);
                        resolve(file);
                        return;
                    }

                    const minSide = Math.min(image.width, image.height);
                    const sourceX = (image.width - minSide) / 2;
                    const sourceY = (image.height - minSide) / 2;

                    context.drawImage(
                        image,
                        sourceX,
                        sourceY,
                        minSide,
                        minSide,
                        0,
                        0,
                        targetSize,
                        targetSize
                    );

                    canvas.toBlob(
                        (blob) => {
                            URL.revokeObjectURL(imageUrl);
                            if (!blob) {
                                resolve(file);
                                return;
                            }
                            const normalizedFile = new File([blob], `${file.name.split(".").slice(0, -1).join(".") || "photo"}.jpg`, {
                                type: "image/jpeg",
                            });
                            resolve(normalizedFile);
                        },
                        "image/jpeg",
                        0.9
                    );
                } catch (error) {
                    URL.revokeObjectURL(imageUrl);
                    resolve(file);
                }
            };

            image.onerror = () => {
                URL.revokeObjectURL(imageUrl);
                resolve(file);
            };

            image.src = imageUrl;
        });
    };

    const handleProfilePictureChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) {
            setProfilePictureFile(null);
            return;
        }

        const normalized = await normalizeImageFile(file);
        setProfilePictureFile(normalized);
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
            throw new Error("Échec du téléversement de la photo de profil.");
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
            alert("Impossible de téléverser la photo de profil sélectionnée.");
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
