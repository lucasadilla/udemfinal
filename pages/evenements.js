import Navbar from '../components/Navbar';
import Head from 'next/head';
import { useCallback, useEffect, useMemo, useState } from 'react';
import useEvents from '../hooks/useEvents';
import { Calendar } from '@mantine/dates';
import { Indicator } from '@mantine/core';

export default function Evenements() {
  const { events, loading, addEvent } = useEvents();
  const [isAdmin, setIsAdmin] = useState(false);
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  // Rename state variable to avoid confusion with Calendar's date parameter
  const [eventDate, setEventDate] = useState('');
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const visibleMonthDate = useMemo(
    () => new Date(visibleMonth.year, visibleMonth.month, 1),
    [visibleMonth]
  );

  const updateVisibleMonth = useCallback((value) => {
    if (!value) return;
    const target = value instanceof Date ? value : new Date(value);
    setVisibleMonth((previousMonth) => {
      const nextMonth = {
        year: target.getFullYear(),
        month: target.getMonth(),
      };

      if (
        previousMonth &&
        previousMonth.year === nextMonth.year &&
        previousMonth.month === nextMonth.month
      ) {
        return previousMonth;
      }

      return nextMonth;
    });
  }, []);

  const formatMonthLabel = useCallback((date) => {
    if (!(date instanceof Date)) {
      return '';
    }

    const formatter = new Intl.DateTimeFormat('fr-CA', {
      month: 'long',
      year: 'numeric',
    });

    const formattedLabel = formatter.format(date);
    return formattedLabel.charAt(0).toUpperCase() + formattedLabel.slice(1);
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

  const formatDisplayDate = (date) =>
    date
      ? date.toLocaleDateString('fr-CA', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '';

  const eventsWithParsedDates = useMemo(
    () =>
      events.map((event) => {
        const parsedDate = parseEventDate(event.date);
        return {
          ...event,
          parsedDate,
          dateKey: parsedDate ? formatDateKey(parsedDate) : null,
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

  const filteredEvents = useMemo(() => {
    const { month, year } = visibleMonth;

    return eventsWithParsedDates
      .filter((event) => {
        if (!event.parsedDate) return false;
        return (
          event.parsedDate.getMonth() === month &&
          event.parsedDate.getFullYear() === year
        );
      })
      .sort((a, b) => a.parsedDate - b.parsedDate);
  }, [eventsWithParsedDates, visibleMonth]);

  const monthLabel = useMemo(
    () => formatMonthLabel(visibleMonthDate),
    [formatMonthLabel, visibleMonthDate]
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
            <div className="mt-8 flex flex-col items-center gap-8 md:flex-row md:items-start md:justify-center">
              <div className="hidden md:block md:h-0 md:w-[22rem] md:shrink-0" aria-hidden="true" />
              <div className="flex justify-center">
                <div className="w-full max-w-md rounded-2xl bg-white/80 p-4 shadow-md backdrop-blur">
                  <Calendar
                    aria-label="Calendrier des événements"
                    className="calendar"
                    month={visibleMonthDate}
                    onMonthChange={updateVisibleMonth}
                    onChange={updateVisibleMonth}
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
              </div>
              <aside className="w-full max-w-md rounded-2xl bg-white/90 p-6 shadow-md backdrop-blur md:w-[22rem] md:shrink-0">
                <h2 className="text-xl font-semibold text-gray-900">
                  Événements de {monthLabel}
                </h2>
                <div className="mt-4 space-y-4">
                  {filteredEvents.length === 0 ? (
                    <p className="text-sm text-gray-600">
                      Aucun événement prévu ce mois-ci.
                    </p>
                  ) : (
                    filteredEvents.map((event) => (
                      <article
                        key={event.id}
                        className={[
                          'rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50/70 to-blue-100/40',
                          'p-4 shadow-sm',
                        ].join(' ')}
                      >
                        <h3 className="text-lg font-semibold text-gray-900">
                          {event.title}
                        </h3>
                        <p className="mt-1 text-sm font-medium text-blue-700">
                          {event.parsedDate
                            ? formatDisplayDate(event.parsedDate)
                            : event.date}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-gray-700">
                          {event.bio}
                        </p>
                      </article>
                    ))
                  )}
                </div>
              </aside>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
