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
    <div id="events-root" className="mt-8 flex w-full justify-center">
      <div className="events-card w-full max-w-5xl rounded-2xl bg-white/80 p-4 shadow-md backdrop-blur">
        <div id="events-calendar" className="layout">
          <div className="calendar-panel">
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
                onClick={goPrevMonth}
                aria-label="Mois précédent"
              >
                ◀
              </button>
              <div className="text-base font-medium capitalize">{formattedMonthLabel}</div>
              <button
                type="button"
                className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
                onClick={goNextMonth}
                aria-label="Mois suivant"
              >
                ▶
              </button>
            </div>
            <div className="grid-weekdays text-center text-sm text-gray-600">
              <div>Lun</div>
              <div>Mar</div>
              <div>Mer</div>
              <div>Jeu</div>
              <div>Ven</div>
              <div>Sam</div>
              <div>Dim</div>
            </div>
            <div className="mt-1 grid-days">
              {cells.map((d, idx) => {
                if (!d) {
                  return <div key={idx} className="day-cell rounded bg-transparent" />;
                }
                const dateKey = formatDateKey(d);
                const hasEvent = eventDates.has(dateKey);
                return (
                  <div
                    key={idx}
                    className="day-cell relative flex items-center justify-center rounded border bg-white"
                  >
                    <Indicator size={6} color="red" disabled={!hasEvent}>
                      <div>{d.getDate()}</div>
                    </Indicator>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="events-list">
            <div className="events-header">{formattedMonthLabel || 'Événements'}</div>
            <div className="events-items">
              {monthEvents.length === 0 ? (
                <div className="event-empty">Aucun événement</div>
              ) : (
                monthEvents.map((ev) => (
                  <div key={ev._id || ev.title + ev.date} className="event-item">
                    <div className="event-date">
                      {ev.parsedDate.toLocaleDateString('fr-CA', { day: '2-digit', month: 'short' })}
                    </div>
                    <div className="event-content">
                      <div className="event-title">{ev.title}</div>
                      {ev.bio ? <div className="event-bio">{ev.bio}</div> : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <style jsx>{`
          /* Force centering regardless of global styles */
          #events-root {
            display: flex !important;
            justify-content: center !important;
            align-items: flex-start !important;
            width: 100% !important;
            text-align: center !important;
          }
          #events-root .events-card {
            margin-left: auto !important;
            margin-right: auto !important;
            float: none !important;
            width: 100%;
          }
          #events-calendar.layout {
            display: inline-grid !important;
            grid-template-columns: 1fr;
            gap: 1.5rem;
            justify-content: center;
            align-items: start;
            width: auto !important;
            max-width: none !important;
            margin: 0 auto !important;
          }
          @media (min-width: 640px) {
            #events-calendar.layout {
              grid-template-columns: auto 1fr;
              justify-content: center;
              align-items: start;
            }
          }
          #events-calendar, #events-calendar * { box-sizing: border-box; }
          #events-calendar .calendar-panel {
            width: 100%;
            max-width: 28rem; /* ~448px */
            min-width: 20rem; /* ~320px */
            flex: 0 0 auto;
            float: none !important;
          }
          #events-calendar .grid-weekdays {
            display: grid;
            grid-template-columns: repeat(7, minmax(0, 1fr));
            gap: 4px;
            width: 100%;
          }
          #events-calendar .grid-days {
            display: grid;
            grid-template-columns: repeat(7, minmax(0, 1fr));
            gap: 4px;
            width: 100%;
          }
          #events-calendar .day-cell {
            min-height: 64px;
          }
          #events-calendar .events-list {
            width: 100%;
            max-width: 26rem;
            flex: 1 1 22rem;
            float: none !important;
          }
          #events-calendar .events-header {
            font-size: 1rem;
            font-weight: 600;
            text-transform: capitalize;
            color: #374151;
            margin-bottom: 0.5rem;
          }
          #events-calendar .events-items {
            background: rgba(255,255,255,0.9);
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            padding: 0.5rem;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          }
          #events-calendar .event-item {
            display: flex;
            gap: 0.5rem;
            padding: 0.5rem;
            border-radius: 0.375rem;
            align-items: flex-start;
          }
          #events-calendar .event-item + .event-item {
            border-top: 1px solid #f3f4f6;
          }
          #events-calendar .event-date {
            flex: 0 0 auto;
            font-size: 0.875rem;
            color: #6b7280;
            width: 3.5rem;
          }
          #events-calendar .event-content {
            flex: 1 1 auto;
          }
          #events-calendar .event-title {
            font-size: 0.95rem;
            font-weight: 600;
            color: #111827;
          }
          #events-calendar .event-bio {
            font-size: 0.875rem;
            color: #4b5563;
            margin-top: 2px;
          }
          #events-calendar .event-empty {
            font-size: 0.9rem;
            color: #6b7280;
            padding: 0.5rem;
          }
        `}</style>
      </div>
    </div>
  );
}
