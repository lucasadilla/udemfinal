import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import useEvents from '../hooks/useEvents';

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

  const today = new Date();
  const [month] = useState(today.getMonth());
  const [year] = useState(today.getFullYear());

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const eventsByDate = events.reduce((acc, ev) => {
    acc[ev.date] = acc[ev.date] || [];
    acc[ev.date].push(ev);
    return acc;
  }, {});

  const weeks = [];
  let day = 1 - firstDay;
  while (day <= daysInMonth) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      if (day > 0 && day <= daysInMonth) {
        const dateStr = new Date(year, month, day).toISOString().slice(0, 10);
        week.push({ day, dateStr, events: eventsByDate[dateStr] || [] });
      } else {
        week.push(null);
      }
      day++;
    }
    weeks.push(week);
  }

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
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                    <th key={d} className="border p-2">
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weeks.map((week, i) => (
                  <tr key={i}>
                    {week.map((dayObj, idx) => (
                      <td key={idx} className="border h-24 align-top p-1">
                        {dayObj && (
                          <div>
                            <div className="font-bold">{dayObj.day}</div>
                            {dayObj.events.map((ev) => (
                              <div key={ev.id} className="text-xs mt-1">
                                {ev.title}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
