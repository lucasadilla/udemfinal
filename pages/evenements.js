import Navbar from '../components/Navbar';
import Head from 'next/head';
import { useCallback, useMemo, useState } from 'react';
import useEvents from '../hooks/useEvents';
import LoadingSpinner from '../components/LoadingSpinner';
import useAdminStatus from '../hooks/useAdminStatus';
import { getEvents } from '../lib/eventDatabase';

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

export default function Evenements({ initialEvents }) {
  const { events: hookEvents, loading, addEvent, deleteEvent } = useEvents();
  // Use initial events if available, otherwise fall back to hook
  const events = (initialEvents && initialEvents.length > 0) ? initialEvents : hookEvents;
  const isAdmin = useAdminStatus();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !bio || !eventDate) return;
    await addEvent({ title, bio, date: eventDate });
    setTitle('');
    setBio('');
    setEventDate('');
  };

  const handleDelete = async (id) => {
    if (!id) return;
    await deleteEvent(id);
  };

  return (
    <>
      <Head>
        <title>Événements</title>
      </Head>
      <div>
        <Navbar />
        <main className="events-page">
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
                placeholder="Description"
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

          {!initialEvents && loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <EventsLayout
              eventDates={eventDates}
              formatDateKey={formatDateKey}
              onCalendarViewChange={handleCalendarViewChange}
              calendarViewDate={calendarViewDate}
              eventsWithParsedDates={eventsWithParsedDates}
              isAdmin={isAdmin}
              onDelete={handleDelete}
            />
          )}
        </main>
        <style jsx>{`
          .events-page {
            box-sizing: border-box;
            width: 100%;
            max-width: 72rem;
            margin: 0 auto;
            padding: 1.5rem 1rem 2rem;
          }

          @media (min-width: 768px) {
            .events-page {
              padding-inline: 2rem;
            }
          }
        `}</style>
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
  isAdmin,
  onDelete,
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

  const formattedMonthLabel = useMemo(() => {
    if (!calendarViewDate) return '';
    const label = calendarViewDate.toLocaleDateString('fr-CA', {
      month: 'long',
      year: 'numeric',
    });
    return label.replace(/^./u, (char) => char.toLocaleUpperCase('fr-CA'));
  }, [calendarViewDate]);

  const cells = buildMonthCells(calendarViewDate);

  const currentMonthKey = calendarViewDate
    ? `${calendarViewDate.getFullYear()}-${String(calendarViewDate.getMonth() + 1).padStart(2, '0')}`
    : '';
  const monthEvents = (eventsWithParsedDates || [])
    .filter((e) => e.monthKey === currentMonthKey && e.parsedDate)
    .sort((a, b) => a.parsedDate - b.parsedDate);
  const hasMonthEvents = monthEvents.length > 0;

  return (
    <div className="events-layout">
      <div className="events-layout__inner">
        <div id="ev-wrap">
          <div className="panel panel--calendar">
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
          <div className="panel panel--events">
            <div className="events-title mb-3 text-gray-800">
              {formattedMonthLabel || 'Événements'}
            </div>
            <div
              className={`events-box space-y-3 rounded-xl border border-gray-200 bg-white/95 p-4 shadow${
                hasMonthEvents ? '' : ' empty'
              }`}
            >
              {hasMonthEvents ? (
                <div className="events-list">
                  {monthEvents.map((ev) => {
                    const formattedDate = ev.parsedDate
                      ? ev.parsedDate
                          .toLocaleDateString('fr-CA', {
                            day: '2-digit',
                            month: 'short',
                          })
                          .replace(/^./u, (char) => char.toLocaleUpperCase('fr-CA'))
                      : '';
                    const [dayPartRaw, monthPartRaw] = formattedDate
                      .split(/\s+/)
                      .filter(Boolean);
                    const dayPart =
                      dayPartRaw ||
                      (ev.parsedDate
                        ? String(ev.parsedDate.getDate()).padStart(2, '0')
                        : '');
                    const monthPart =
                      monthPartRaw ||
                      (ev.parsedDate
                        ? ev.parsedDate
                            .toLocaleDateString('fr-CA', { month: 'short' })
                            .replace(/^./u, (char) => char.toLocaleUpperCase('fr-CA'))
                        : '');
                    return (
                      <article
                        key={ev._id || ev.title + ev.date}
                        className="event-card"
                      >
                        <div className="event-card__inner">
                          <div className="event-card__date" aria-hidden="true">
                            <span className="event-card__day">{dayPart}</span>
                            <span className="event-card__month">{monthPart}</span>
                          </div>
                          <div className="event-card__content">
                            <h3 className="event-card__title">{ev.title}</h3>
                            {ev.bio ? (
                              <p className="event-card__description">{ev.bio}</p>
                            ) : null}
                          </div>
                          {isAdmin ? (
                            <button
                              onClick={() => onDelete(ev.id || ev._id)}
                              className="event-card__delete"
                              title="Supprimer l’événement"
                            >
                              Supprimer
                            </button>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-message text-base text-gray-500">Aucun événement</div>
              )}
            </div>
          </div>
        </div>
        <style jsx>{`
          .events-layout {
            margin-top: 2rem;
            width: 100%;
            box-sizing: border-box;
            display: flex;
            justify-content: center;
            padding: 0 1.25rem;
          }

          .events-layout__inner {
            width: min(100%, 72rem);
            border-radius: 1.5rem;
            background: transparent;
            padding: 1.5rem;
            box-shadow: 0 22px 45px rgba(15, 23, 42, 0.12);
            backdrop-filter: blur(6px);
          }

          @media (min-width: 768px) {
            .events-layout {
              padding: 0 2rem;
            }

            .events-layout__inner {
              padding: 2rem;
            }
          }

          #ev-wrap {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 2.5rem;
            width: 100%;
            margin: 0 auto;
          }
          #ev-wrap > .panel {
            width: 100%;
          }
          #ev-wrap > .panel.panel--calendar {
            width: auto;
            margin-left: auto;
            margin-right: auto;
          }
          #ev-wrap > .panel.panel--events {
            width: 100%;
            margin-left: auto;
            margin-right: auto;
          }
          .panel--calendar {
            max-width: 44rem;
            width: min(100%, 44rem);
            margin: 0 auto;
          }
          @media (min-width: 768px) {
            .panel--calendar {
              max-width: 52rem;
              width: min(100%, 52rem);
            }
          }
          @media (min-width: 1024px) {
            .panel--calendar {
              max-width: 60rem;
              width: min(100%, 60rem);
            }
          }
          .panel--events {
            max-width: 40rem;
            width: 100%;
            margin: 0 auto;
          }
          .cal-header {
            display: grid;
            grid-template-columns: 48px 1fr 48px;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 0.75rem;
          }
          .month-title {
            text-align: center;
            font-size: 1.35rem;
            font-weight: 700;
            color: #111827;
          }
          .nav-btn {
            height: 48px;
            width: 48px;
            border-radius: 9999px;
            border: 1px solid #e5e7eb;
            background: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background 120ms ease, box-shadow 120ms ease, transform 120ms ease;
          }
          .nav-btn:hover {
            background: #f9fafb;
            box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
            transform: translateY(-1px);
          }
          .weekdays {
            display: grid;
            grid-template-columns: repeat(7, minmax(0, 1fr));
            gap: 10px;
            text-align: center;
            font-size: 0.95rem;
            color: #6b7280;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }
          .days {
            margin-top: 12px;
            display: grid;
            grid-template-columns: repeat(7, minmax(0, 1fr));
            gap: 12px;
          }
          .day {
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            aspect-ratio: 1 / 1;
            background: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95));
            border: 1px solid rgba(226, 232, 240, 0.9);
            border-radius: 0.75rem;
            padding: 16px;
            transition: border-color 120ms ease, box-shadow 120ms ease, transform 120ms ease;
          }
          .day:hover {
            border-color: rgba(148, 163, 184, 0.9);
            box-shadow: 0 8px 14px rgba(15, 23, 42, 0.08);
            transform: translateY(-2px);
          }
          .day.empty {
            background: linear-gradient(180deg, rgba(255, 255, 255, 0.75), rgba(241, 245, 249, 0.75));
            border-color: rgba(226, 232, 240, 0.5);
            box-shadow: none;
            opacity: 0.6;
          }
          .date-number {
            font-weight: 700;
            color: #0f172a;
            font-size: 1.05rem;
          }
          .event-dot {
            position: absolute;
            bottom: 12px;
            left: 50%;
            transform: translateX(-50%);
            width: 9px;
            height: 9px;
            border-radius: 9999px;
            background: linear-gradient(135deg, #6366f1 0%, #ec4899 100%);
            box-shadow: 0 0 0 5px rgba(129, 140, 248, 0.15);
          }
          .events-title {
            font-size: 1.25rem;
            font-weight: 800;
          }
          .events-box {
            backdrop-filter: blur(4px);
            min-height: 16rem;
            display: flex;
            flex-direction: column;
          }
          .events-box.empty {
            justify-content: center;
            text-align: center;
          }
          .events-box .empty-message {
            margin: 0 auto;
            max-width: 16rem;
          }
          .events-list {
            position: relative;
            display: flex;
            flex-direction: column;
            gap: 1rem;
            padding-left: 1rem;
          }
          .events-list::before {
            content: '';
            position: absolute;
            left: 1.75rem;
            top: 0.25rem;
            bottom: 0.25rem;
            width: 2px;
            background: linear-gradient(180deg, rgba(129, 140, 248, 0.4), rgba(236, 72, 153, 0.3));
          }
          @media (max-width: 640px) {
            .events-list {
              padding-left: 0.5rem;
            }
            .events-list::before {
              left: 1.25rem;
            }
          }
          .event-card {
            position: relative;
            padding-left: 3.5rem;
            border-radius: 1rem;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95));
            border: 1px solid rgba(226, 232, 240, 0.8);
            box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
            transition: transform 160ms ease, box-shadow 160ms ease;
            overflow: hidden;
          }
          .event-card::before {
            content: '';
            position: absolute;
            left: 1.5rem;
            top: 1.35rem;
            width: 12px;
            height: 12px;
            border-radius: 9999px;
            background: linear-gradient(135deg, #6366f1 0%, #ec4899 100%);
            box-shadow: 0 0 0 6px rgba(129, 140, 248, 0.18);
          }
          .event-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 14px 40px rgba(15, 23, 42, 0.12);
          }
          .event-card__inner {
            display: flex;
            align-items: flex-start;
            gap: 1.25rem;
            padding: 1.25rem 1.5rem;
          }
          .event-card__date {
            flex: 0 0 auto;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 3.75rem;
            height: 3.75rem;
            border-radius: 0.9rem;
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(236, 72, 153, 0.12));
            border: 1px solid rgba(99, 102, 241, 0.18);
            color: #4338ca;
            font-weight: 700;
            letter-spacing: 0.04em;
          }
          .event-card__day {
            font-size: 1.1rem;
            line-height: 1.1;
          }
          .event-card__month {
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }
          .event-card__content {
            flex: 1 1 auto;
            display: flex;
            flex-direction: column;
            gap: 0.35rem;
          }
          .event-card__title {
            font-size: 1.05rem;
            font-weight: 700;
            color: #0f172a;
          }
          .event-card__description {
            font-size: 0.92rem;
            line-height: 1.5;
            color: #475569;
          }
          .event-card__delete {
            margin-left: auto;
            font-size: 0.85rem;
            color: #ef4444;
            font-weight: 600;
            background: transparent;
            border: none;
            cursor: pointer;
            transition: color 120ms ease;
          }
          .event-card__delete:hover {
            color: #dc2626;
          }
        `}</style>
      </div>
    </div>
  );
}

export async function getStaticProps() {
    try {
        const events = await getEvents().catch(() => []);
        return {
            props: {
                initialEvents: events || [],
            },
            // Revalidate every 60 seconds
            revalidate: 60,
        };
    } catch (error) {
        console.error('Error in getStaticProps for events:', error);
        return {
            props: {
                initialEvents: [],
            },
            revalidate: 60,
        };
    }
}
