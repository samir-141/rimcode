type IconProps = {
    className?: string;
};

export function SpeakerIcon({
    className = "",
    muted = false,
}: IconProps & { muted?: boolean }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            <path d="M11 5 6.8 8.4H3.5v7.2h3.3L11 19V5Z" />
            {muted ? (
                <>
                    <path d="m16 9.5 5 5" />
                    <path d="m21 9.5-5 5" />
                </>
            ) : (
                <>
                    <path d="M15.2 9.1a4.2 4.2 0 0 1 0 5.8" />
                    <path d="M18 6.4a7.8 7.8 0 0 1 0 11.2" />
                </>
            )}
        </svg>
    );
}

export function WaveIcon({ className = "" }: IconProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            <path d="M7.2 12.2V6.5a1.4 1.4 0 0 1 2.8 0V11" />
            <path d="M10 10.8V5.6a1.4 1.4 0 0 1 2.8 0v5" />
            <path d="M12.8 10.9V6.8a1.4 1.4 0 0 1 2.8 0v5.5" />
            <path d="M15.6 12.8V9.2a1.4 1.4 0 0 1 2.8 0v4.6c0 4.2-2.7 7.2-6.5 7.2-2.7 0-4.5-1.2-5.8-3.5L3.7 13a1.5 1.5 0 0 1 2.5-1.6l1.4 1.9" />
        </svg>
    );
}
