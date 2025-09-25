import fs from 'fs';
import path from 'path';

const podcastsFile = path.join(process.cwd(), 'data', 'podcasts.json');

function readPodcastsFile() {
  try {
    const data = fs.readFileSync(podcastsFile, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

export function getPodcasts() {
  return readPodcastsFile();
}

export function getPodcastBySlug(slug) {
  return readPodcastsFile().find((podcast) => podcast.slug === slug) || null;
}

export function addPodcast(podcast) {
  const podcasts = readPodcastsFile();
  podcasts.push(podcast);
  fs.writeFileSync(podcastsFile, JSON.stringify(podcasts, null, 2));
  return podcast;
}
