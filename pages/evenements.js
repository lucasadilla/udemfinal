import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import useEvents from '../hooks/useEvents';
import { Calendar } from '@heroui/react';

export default function Evenements() {
  const { events, loading, addEvent } = useEvents();
  const [isAdmin, setIsAdmin] = useState(false);
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    setIsAdmin(document.cookie.includes('admin-auth=true'));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !bio || !date) return;
    await addEvent({ title, bio, date });
    setTitle('');
    setBio('');
    setDate('');
  };

  return (
    <div>
      <Head>
        <title>Événements</title>
      </Head>
      <Navbar />
      <main className="max-w-4xl mx-auto p-4">
        <h1 className="text-3xl text-center mb-4">Événements</h1>
        {isAdmin && (
          <form onSubmit={handleSubmit} className="mb-8 space-y-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre"
              className="border p-2 w-full"
            />
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Bio"
              className="border p-2 w-full"
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border p-2 w-full"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Ajouter
            </button>
          </form>
        )}

        {loading ? (
          <div>Loading...</div>
        ) : (
          <div>
            <div className="my-4">
              <Calendar aria-label="Calendrier des événements" />
            </div>
            <div className="mt-8 space-y-4">
              {events.map((ev) => (
                <div key={ev.id}>
                  <div className="font-bold">{ev.title}</div>
                  <div className="text-sm">{ev.date}</div>
                  <div className="text-sm">{ev.bio}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
