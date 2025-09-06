// pages/notre-comite.js
import Navbar from "../components/Navbar";
import Footer from '../components/Footer';
import Head from "next/head";
import React from "react";
import SponsorsBar from "../components/Sponsors";
import { users } from "../lib/userDatabase";

export default function NotreComite() {
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

                {/* Grid layout for all members except the last one (Lina Tourabi) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {users.slice(0, users.length - 1).map((member, index) => (
                        <div key={index} className="flex flex-col items-center text-center">
                            <img src={member.profilePicture} alt={member.name} className="rounded-full w-64 h-32 sm:w-64 sm:h-80 lg:w-96 lg:h-96 mb-4 object-cover border-image" />
                            <h2 className="text-xl font-semibold">{member.name}</h2>
                            <p className="text-gray-600">{member.title}</p>
                        </div>
                    ))}
                </div>

                {/* Centered row for the last member */}
                <div className="flex justify-center mt-8">
                    {(() => {
                        const member = users[users.length - 1];
                        return (
                            <div className="flex flex-col items-center text-center">
                                <img src={member.profilePicture} alt={member.name} className="rounded-full w-64 h-32 sm:w-64 sm:h-80 lg:w-96 lg:h-96 mb-4 object-cover border-image" />
                                <h2 className="text-xl font-semibold">{member.name}</h2>
                                <p className="text-gray-600">{member.title}</p>
                            </div>
                        );
                    })()}
                </div>
                <SponsorsBar />
            </main>
            <Footer />
        </div>
    );
}
