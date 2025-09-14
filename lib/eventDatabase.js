import fs from 'fs';
import path from 'path';

const eventsFile = path.join(process.cwd(), 'data', 'events.json');

export function getEvents() {
  try {
    const data = fs.readFileSync(eventsFile, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

export function addEvent(event) {
  const events = getEvents();
  events.push(event);
  fs.writeFileSync(eventsFile, JSON.stringify(events, null, 2));
  return events;
}
