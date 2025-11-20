// pages/notre-comite.js
import Navbar from "../components/Navbar";
import Head from "next/head";
import Image from "next/image";
import React, { useRef, useState } from "react";
import useUsers from "../hooks/useUsers";
import LoadingSpinner from "../components/LoadingSpinner";
import useAdminStatus from "../hooks/useAdminStatus";
import {
    createCoverImageDataUrl,
    dataUrlToFile,
    IMAGE_ERRORS,
    MAX_FORM_BASE64_SIZE,
    MAX_FORM_FILE_SIZE,
} from "../lib/clientImageUtils";

export default function NotreComite() {
    const PROFILE_IMAGE_COMPRESSION_THRESHOLD = 2.5 * 1024 * 1024; // 2.5 MB
    const FALLBACK_PROFILE_DATA_URL =
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgcng9IjIwIiBmaWxsPSIjZWJlZWZlIi8+PHBhdGggZD0iTTY0IDk2Yy0xNC45IDAtMjctMTIuMS0yNy0yNyAwLTE0LjkgMTIuMS0yNyAyNy0yNyAxNC45IDAgMjcgMTIuMSAyNyAyNyAwIDE0LjktMTIuMSAyNy0yNyAyN3pNNjQgNTZjLTEwLjUgMC0xOSA4LjUtMTkgMTkgMCAxMC41IDguNSAxOSAxOSAxOSAxMC41IDAgMTktOC41IDE5LTE5IDAtMTAuNS04LjUtMTktMTktMTl6IiBmaWxsPSIjZDM0YzZhIi8+PC9zdmc+";
    const BLUR_PLACEHOLDER_DATA_URL =
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMTAyNCcgaGVpZ2h0PScxMDI0JyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnPjxyZWN0IHdpZHRoPScxMDI0JyBoZWlnaHQ9JzEwMjQnIGZpbGw9JyNlZWVmZjMnLz48L3N2Zz4=";
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

        let fileToUpload = profilePictureFile;

        if (
            profilePictureFile.size > PROFILE_IMAGE_COMPRESSION_THRESHOLD ||
            (profilePictureFile.type && !profilePictureFile.type.includes("jpeg"))
        ) {
            try {
                const optimizedDataUrl = await createCoverImageDataUrl(profilePictureFile, {
                    maxFileSize: MAX_FORM_FILE_SIZE,
                    maxBase64Size: MAX_FORM_BASE64_SIZE,
                    maxWidth: 900,
                    quality: 0.75,
                    mimeType: "image/jpeg",
                });
                const originalName =
                    typeof profilePictureFile.name === "string" && profilePictureFile.name.trim()
                        ? profilePictureFile.name.trim()
                        : "profile-picture";
                const optimizedFileName = /\.[^./]+$/.test(originalName)
                    ? originalName.replace(/\.[^./]+$/, ".jpg")
                    : `${originalName}.jpg`;
                const optimizedFile = await dataUrlToFile(optimizedDataUrl, {
                    name: optimizedFileName,
                    type: "image/jpeg",
                    lastModified: profilePictureFile.lastModified,
                });

                if (optimizedFile?.size && optimizedFile.size < profilePictureFile.size) {
                    fileToUpload = optimizedFile;
                }
            } catch (error) {
                if (error?.code === IMAGE_ERRORS.TOO_LARGE) {
                    throw new Error(
                        "L’image sélectionnée est trop volumineuse. Choisissez une image plus petite (moins de 6 Mo).",
                    );
                }

                console.warn("Impossible de compresser l’image du profil sélectionnée.", error);
            }
        }

        const formData = new FormData();
        formData.append("file", fileToUpload);

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
                            {users.map((member, index) => (
                                <div key={member.id} className="committee-card">
                                    <div className="committee-avatar-wrapper">
                                        <Image
                                            src={member.profilePicture || FALLBACK_PROFILE_DATA_URL}
                                            alt={member.name}
                                            fill
                                            sizes="(min-width: 1024px) 320px, (min-width: 640px) 280px, 80vw"
                                            className="committee-avatar border-image"
                                            priority={index < 3}
                                            placeholder="blur"
                                            blurDataURL={BLUR_PLACEHOLDER_DATA_URL}
                                        />
                                    </div>
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
