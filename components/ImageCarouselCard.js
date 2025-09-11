import { useState } from 'react';
import Image from 'next/image';

/**
 * A simple image carousel card for displaying a list of images with
 * previous/next navigation and a page counter.
 */
export default function ImageCarouselCard({ images = [] }) {
  const [index, setIndex] = useState(0);

  if (!images.length) {
    return null;
  }

  const prev = () => {
    setIndex((index - 1 + images.length) % images.length);
  };

  const next = () => {
    setIndex((index + 1) % images.length);
  };

  return (
    <div className="carousel-card">
      <div className="image-container">
        <Image
          src={images[index]}
          alt={`Image ${index + 1}`}
          width={450}
          height={300}
          className="carousel-image"
        />
      </div>
      <div className="navigation">
        <button className="nav-button" onClick={prev} aria-label="Previous image">
          ‹
        </button>
        <span className="page-counter">
          {index + 1}/{images.length}
        </span>
        <button className="nav-button" onClick={next} aria-label="Next image">
          ›
        </button>
      </div>
    </div>
  );
}
