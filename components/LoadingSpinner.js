import React from 'react';

export default function LoadingSpinner({ className = '', label = 'Chargement' }) {
    const containerClasses = className
        ? `loading-spinner__container ${className}`
        : 'loading-spinner__container';

    return (
        <div className={containerClasses}>
            <div className="loading-spinner" role="status" aria-live="polite" aria-busy="true">
                <span className="loading-spinner__circle" aria-hidden="true" />
                <span className="sr-only">{label}</span>
            </div>
        </div>
    );
}
