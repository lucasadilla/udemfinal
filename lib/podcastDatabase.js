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

function writePodcastsFile(podcasts) {
  fs.writeFileSync(podcastsFile, JSON.stringify(podcasts, null, 2));
  return podcasts;
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
  writePodcastsFile(podcasts);
  return podcast;
}

export function deletePodcastById(id) {
  const podcasts = readPodcastsFile();
  const index = podcasts.findIndex((podcast) => podcast.id === id);

  if (index === -1) {
    return null;
  }

  const [removedPodcast] = podcasts.splice(index, 1);
  writePodcastsFile(podcasts);
  return removedPodcast;
}
