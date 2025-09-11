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
  const [currentMonth, setCurrentMonth] = useState(new Date());

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

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const startDay = monthStart.getDay();
  const daysInMonth = monthEnd.getDate();

  const weeks = [];
  let day = 1 - startDay;
  while (day <= daysInMonth) {
    const cells = [];
    for (let i = 0; i < 7; i++, day++) {
      if (day > 0 && day <= daysInMonth) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEvents = events.filter((e) => e.date === dateStr);
        cells.push(
          <td key={`${dateStr}`} className="border p-2 align-top h-24 w-32">
            <div className="font-bold text-sm">{day}</div>
            {dayEvents.map((ev) => (
              <div key={ev.id} className="text-xs truncate">
                {ev.title}
              </div>
            ))}
          </td>
        );
      } else {
        cells.push(<td key={`empty-${i}-${day}`} className="border p-2 h-24 w-32" />);
      }
    }
    weeks.push(<tr key={`week-${day}`}>{cells}</tr>);
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
          <div>
            <div className="flex items-center justify-between my-4">
              <button
                onClick={() =>
                  setCurrentMonth(new Date(year, month - 1, 1))
                }
                className="px-2 py-1 border rounded"
              >
                Prev
              </button>
              <div className="font-semibold">
                {currentMonth.toLocaleString('default', {
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
              <button
                onClick={() =>
                  setCurrentMonth(new Date(year, month + 1, 1))
                }
                className="px-2 py-1 border rounded"
              >
                Next
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="border-collapse w-full text-center">
                <thead>
                  <tr>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                      <th key={d} className="border p-2">
                        {d}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>{weeks}</tbody>
              </table>
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
