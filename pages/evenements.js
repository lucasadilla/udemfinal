import Navbar from '../components/Navbar';
import Head from 'next/head';
import { useCallback, useEffect, useMemo, useState } from 'react';
import useEvents from '../hooks/useEvents';
import { Calendar } from '@mantine/dates';
import { Indicator } from '@mantine/core';

const normalizeToMonthStart = (value) => {
  const fallback = new Date();
  const date = value instanceof Date ? value : new Date(value ?? fallback);
  if (Number.isNaN(date.getTime())) {
    return new Date(fallback.getFullYear(), fallback.getMonth(), 1);
  }
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

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
    const normalized = normalizeToMonthStart(value);
    setCalendarViewDate((previousDate) => {
      if (!previousDate || previousDate.getTime() !== normalized.getTime()) {
        return normalized;
      }
      return previousDate;
    });
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

  const eventsByMonth = useMemo(() => {
    const groupedEvents = new Map();

    eventsWithParsedDates.forEach((event) => {
      if (!event.parsedDate || !event.monthKey) return;
      if (!groupedEvents.has(event.monthKey)) {
        groupedEvents.set(event.monthKey, []);
      }
      groupedEvents.get(event.monthKey).push(event);
    });

    groupedEvents.forEach((monthEvents) => {
      monthEvents.sort((a, b) => a.parsedDate - b.parsedDate);
    });

    return groupedEvents;
  }, [eventsWithParsedDates]);

  const calendarMonthKey = useMemo(
    () => formatMonthKey(calendarViewDate),
    [calendarViewDate]
  );

  const eventsForVisibleMonth = useMemo(
    () => eventsByMonth.get(calendarMonthKey) ?? [],
    [calendarMonthKey, eventsByMonth]
  );

  const monthLabel = useMemo(
    () =>
      calendarViewDate.toLocaleDateString('fr-CA', {
        month: 'long',
        year: 'numeric',
      }),
    [calendarViewDate]
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
              eventsForVisibleMonth={eventsForVisibleMonth}
              formatDateKey={formatDateKey}
              onCalendarViewChange={handleCalendarViewChange}
              calendarViewDate={calendarViewDate}
              monthLabel={monthLabel}
            />
          )}
        </main>
      </div>
    </>
  );
}

function EventsLayout({
  eventDates,
  eventsForVisibleMonth,
  formatDateKey,
  onCalendarViewChange,
  calendarViewDate,
  monthLabel,
}) {
  return (
    <div className="mt-8 grid w-full gap-8 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:items-start">
      <div className="w-full max-w-lg rounded-2xl bg-white/80 p-4 shadow-md backdrop-blur lg:max-w-sm">
        <Calendar
          aria-label="Calendrier des événements"
          className="calendar"
          month={calendarViewDate}
          onChange={onCalendarViewChange}
          onMonthChange={onCalendarViewChange}
          onMonthSelect={onCalendarViewChange}
          size="lg"
          renderDay={(currentDate) => {
            const dateObj =
              currentDate instanceof Date
                ? currentDate
                : new Date(currentDate);
            const day = dateObj.getDate();
            const dateKey = formatDateKey(dateObj);
            const hasEvent = eventDates.has(dateKey);
            return (
              <Indicator size={6} color="red" disabled={!hasEvent}>
                <div>{day}</div>
              </Indicator>
            );
          }}
        />
      </div>

      <section className="w-full rounded-2xl bg-white/80 p-6 shadow-md backdrop-blur">
        <h2 className="mb-4 text-2xl font-semibold capitalize">
          Événements de {monthLabel}
        </h2>
        {eventsForVisibleMonth.length === 0 ? (
          <p>Aucun événement prévu pour ce mois.</p>
        ) : (
          <ul className="space-y-4">
            {eventsForVisibleMonth.map((event) => (
              <li key={event.id} className="rounded-lg border border-gray-200 p-4">
                <h3 className="text-xl font-semibold">{event.title}</h3>
                {event.parsedDate && (
                  <p className="text-sm text-gray-600">
                    {event.parsedDate.toLocaleDateString('fr-CA', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                )}
                {event.bio && <p className="mt-2 whitespace-pre-line">{event.bio}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
