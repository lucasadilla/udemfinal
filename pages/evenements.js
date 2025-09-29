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
    <div className="mt-8 flex w-full justify-center px-4">
      <div className="w-full max-w-5xl rounded-2xl bg-white/80 p-6 shadow-md backdrop-blur">
        <div className="mx-auto flex w-full flex-col items-center gap-8 sm:flex-row sm:items-start sm:justify-center">
          <div className="w-full max-w-md">
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
            <div className="grid grid-cols-7 gap-1 text-center text-sm text-gray-600">
              <div>Lun</div>
              <div>Mar</div>
              <div>Mer</div>
              <div>Jeu</div>
              <div>Ven</div>
              <div>Sam</div>
              <div>Dim</div>
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {cells.map((d, idx) => {
                if (!d) {
                  return <div key={idx} className="h-16 rounded bg-transparent" />;
                }
                const dateKey = formatDateKey(d);
                const hasEvent = eventDates.has(dateKey);
                return (
                  <div
                    key={idx}
                    className="relative flex h-16 items-center justify-center rounded border bg-white"
                  >
                    <Indicator size={6} color="red" disabled={!hasEvent}>
                      <div>{d.getDate()}</div>
                    </Indicator>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="w-full max-w-md sm:max-w-sm lg:max-w-md">
            <div className="mb-2 text-base font-semibold capitalize text-gray-700">
              {formattedMonthLabel || 'Événements'}
            </div>
            <div className="space-y-2 rounded-lg border border-gray-200 bg-white/90 p-3 shadow-sm">
              {monthEvents.length === 0 ? (
                <div className="text-sm text-gray-500">Aucun événement</div>
              ) : (
                monthEvents.map((ev) => (
                  <div
                    key={ev._id || ev.title + ev.date}
                    className="flex gap-2 rounded-md border border-transparent p-2 hover:border-gray-200"
                  >
                    <div className="w-14 flex-shrink-0 text-sm font-medium uppercase text-gray-500">
                      {ev.parsedDate.toLocaleDateString('fr-CA', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-gray-900">{ev.title}</div>
                      {ev.bio ? <div className="text-sm text-gray-600">{ev.bio}</div> : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
