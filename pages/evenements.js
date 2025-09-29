import Navbar from '../components/Navbar';
import Head from 'next/head';
import { useCallback, useEffect, useMemo, useState } from 'react';
import useEvents from '../hooks/useEvents';
import { Indicator } from '@mantine/core';

const normalizeToMonthStart = (value) => {
  const fallback = new Date();
  const date = value instanceof Date ? value : new Date(value ?? fallback);
  if (Number.isNaN(date.getTime())) {
    return new Date(fallback.getFullYear(), fallback.getMonth(), 1);
  }
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

//

const formatMonthKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export default function Evenements() {
  const { events, loading, addEvent } = useEvents();
  const [isAdmin, setIsAdmin] = useState(false);
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  // Rename state variable to avoid confusion with Calendar's date parameter
  const [eventDate, setEventDate] = useState('');
  const [calendarViewDate, setCalendarViewDate] = useState(() =>
    normalizeToMonthStart(new Date())
  );

  const handleCalendarViewChange = useCallback((value) => {
    if (!value) return;
    setCalendarViewDate(normalizeToMonthStart(value));
  }, []);

  const parseEventDate = (dateString) => {
    if (!dateString) return null;
    const [year, month, day] = dateString.split('-').map(Number);
    if (
      Number.isNaN(year) ||
      Number.isNaN(month) ||
      Number.isNaN(day) ||
      !year ||
      !month ||
      !day
    ) {
      return null;
    }
    return new Date(year, month - 1, day);
  };

  const formatDateKey = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate()
    ).padStart(2, '0')}`;

  const eventsWithParsedDates = useMemo(
    () =>
      events.map((event) => {
        const parsedDate = parseEventDate(event.date);
        return {
          ...event,
          parsedDate,
          dateKey: parsedDate ? formatDateKey(parsedDate) : null,
          monthKey: parsedDate ? formatMonthKey(parsedDate) : null,
        };
      }),
    [events]
  );

  const eventDates = useMemo(
    () =>
      new Set(
        eventsWithParsedDates
          .map((event) => event.dateKey)
          .filter((dateKey) => Boolean(dateKey))
      ),
    [eventsWithParsedDates]
  );

  useEffect(() => {
    setIsAdmin(document.cookie.includes('admin-auth=true'));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !bio || !eventDate) return;
    await addEvent({ title, bio, date: eventDate });
    setTitle('');
    setBio('');
    setEventDate('');
  };

  return (
    <>
      <Head>
        <title>Événements</title>
      </Head>
      <div>
        <Navbar />
        <main className="max-w-6xl mx-auto p-4">
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
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
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
            <EventsLayout
              eventDates={eventDates}
              formatDateKey={formatDateKey}
              onCalendarViewChange={handleCalendarViewChange}
              calendarViewDate={calendarViewDate}
              eventsWithParsedDates={eventsWithParsedDates}
            />
          )}
        </main>
      </div>
    </>
  );
}

function EventsLayout({
  eventDates,
  formatDateKey,
  onCalendarViewChange,
  calendarViewDate,
  eventsWithParsedDates,
}) {
  const goPrevMonth = () => {
    const d = calendarViewDate || new Date();
    onCalendarViewChange(new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };

  const goNextMonth = () => {
    const d = calendarViewDate || new Date();
    onCalendarViewChange(new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  const buildMonthCells = (date) => {
    const base = date ? new Date(date) : new Date();
    const year = base.getFullYear();
    const month = base.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const firstWeekday = (firstOfMonth.getDay() + 6) % 7; // Monday=0
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day));
    while (cells.length < 42) cells.push(null); // 6 weeks * 7 days
    return cells;
  };

  const formattedMonthLabel = calendarViewDate
    ? calendarViewDate.toLocaleDateString('fr-CA', {
        month: 'long',
        year: 'numeric',
      })
    : '';

  const cells = buildMonthCells(calendarViewDate);

  const currentMonthKey = calendarViewDate
    ? `${calendarViewDate.getFullYear()}-${String(calendarViewDate.getMonth() + 1).padStart(2, '0')}`
    : '';
  const monthEvents = (eventsWithParsedDates || [])
    .filter((e) => e.monthKey === currentMonthKey && e.parsedDate)
    .sort((a, b) => a.parsedDate - b.parsedDate);

  return (
    <div className="mt-8 flex w-full justify-center px-4" style={{ width: '100%' }}>
      <div className="w-full max-w-5xl rounded-2xl bg-white/80 p-6 shadow-md backdrop-blur" style={{ display: 'inline-block', textAlign: 'left', margin: '0 auto' }}>
        <div style={{ width: '100%', textAlign: 'center' }}>
          <div id="ev-wrap" style={{ display: 'inline-grid', gap: '2rem' }}>
          <div className="panel w-full max-w-lg md:max-w-2xl">
            <div className="cal-header">
              <button
                type="button"
                className="nav-btn"
                onClick={goPrevMonth}
                aria-label="Mois précédent"
              >
                ‹
              </button>
              <div className="month-title">{formattedMonthLabel}</div>
              <button
                type="button"
                className="nav-btn"
                onClick={goNextMonth}
                aria-label="Mois suivant"
              >
                ›
              </button>
            </div>
            <div className="weekdays">
              <div>Lun</div>
              <div>Mar</div>
              <div>Mer</div>
              <div>Jeu</div>
              <div>Ven</div>
              <div>Sam</div>
              <div>Dim</div>
            </div>
            <div className="days">
              {cells.map((d, idx) => {
                if (!d) {
                  return <div key={idx} className="day empty" />;
                }
                const dateKey = formatDateKey(d);
                const hasEvent = eventDates.has(dateKey);
                return (
                  <div key={idx} className={`day${hasEvent ? ' has-event' : ''}`}>
                    <div className="date-number">{d.getDate()}</div>
                    {hasEvent ? <span className="event-dot" /> : null}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="panel w-full max-w-lg md:max-w-lg">
            <div className="events-title mb-3 capitalize text-gray-800">
              {formattedMonthLabel || 'Événements'}
            </div>
            <div className="events-box space-y-3 rounded-xl border border-gray-200 bg-white/95 p-4 shadow">
              {monthEvents.length === 0 ? (
                <div className="text-base text-gray-500">Aucun événement</div>
              ) : (
                monthEvents.map((ev) => (
                  <div
                    key={ev._id || ev.title + ev.date}
                    className="flex gap-3 rounded-lg border border-transparent p-3 hover:border-gray-200 hover:shadow-sm"
                  >
                    <div className="event-bullet" aria-hidden="true">›</div>
                    <div className="w-16 flex-shrink-0 text-base font-semibold uppercase text-gray-600">
                      {ev.parsedDate.toLocaleDateString('fr-CA', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </div>
                    <div className="space-y-1">
                      <div className="text-base font-semibold text-gray-900">{ev.title}</div>
                      {ev.bio ? <div className="text-sm text-gray-600 leading-snug">{ev.bio}</div> : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          </div>
        </div>
        <style jsx>{`
          #ev-wrap {
            display: grid !important;
            grid-template-columns: 1fr;
            justify-content: center !important;
            align-items: start !important;
            gap: 2rem;
            width: max-content;
            margin: 0 auto;
            margin-left: 1rem;
          }
          @media (min-width: 640px) {
            #ev-wrap { grid-template-columns: minmax(560px, 820px) minmax(360px, 520px); margin-left: 30rem; }
          }
          #ev-wrap > .panel {
            width: auto;
          }
          .cal-header { 
            display: grid; grid-template-columns: 48px 1fr 48px; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;
          }
          .month-title { text-align: center; font-size: 1.35rem; font-weight: 700; text-transform: capitalize; color: #111827; }
          .nav-btn { height: 48px; width: 48px; border-radius: 9999px; border: 1px solid #e5e7eb; background: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 120ms ease, box-shadow 120ms ease; }
          .nav-btn:hover { background:#f9fafb; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
          .weekdays { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 10px; text-align: center; font-size: 0.95rem; color: #6b7280; }
          .days { margin-top: 8px; display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 10px; }
          .day { position: relative; height: 112px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 0.75rem; padding: 12px; transition: border-color 120ms ease, box-shadow 120ms ease; }
          @media (min-width: 768px) { .day { height: 132px; } }
          .day:hover { border-color:#d1d5db; box-shadow: 0 1px 2px rgba(0,0,0,0.06); }
          .day.empty { background: transparent; border-color: transparent; box-shadow: none; }
          .date-number { font-weight: 700; color: #111827; font-size: 1rem; }
          .event-dot { position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); width: 9px; height: 9px; border-radius: 9999px; background: #ef4444; }
          .events-title { font-size: 1.25rem; font-weight: 800; }
          .events-box { backdrop-filter: blur(2px); }
          .event-bullet { flex: 0 0 auto; width: 1rem; height: 1rem; display: flex; align-items: center; justify-content: center; color: #6b7280; font-size: 1.1rem; line-height: 1; margin-top: 2px; margin-right: 2px; }
        `}</style>
      </div>
    </div>
  );
}
