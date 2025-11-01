import React from 'react';

export default function LoadingSpinner({ className = '', label = 'Chargement' }) {
    const classes = className ? `loading-spinner ${className}` : 'loading-spinner';

    return (
        <div className={classes} role="status" aria-live="polite" aria-busy="true">
            <span className="loading-spinner__circle" aria-hidden="true" />
            <span className="sr-only">{label}</span>
        </div>
    );
}
