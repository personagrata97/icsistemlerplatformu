import React, { useRef, useState, useEffect } from 'react';
import Tooltip from './Tooltip';

interface OverflowTooltipProps {
    content: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

export default function OverflowTooltip({ content, children, className = '' }: OverflowTooltipProps) {
    const textRef = useRef<HTMLDivElement>(null);
    const [isTruncated, setIsTruncated] = useState(false);

    useEffect(() => {
        const checkTruncation = () => {
            if (textRef.current) {
                // Determine if the scrollWidth is greater than the clientWidth.
                // We add a tiny buffer (1-2px) to prevent strict rounding issues causing false positives 
                setIsTruncated(textRef.current.scrollWidth > textRef.current.clientWidth + 2);
            }
        };

        checkTruncation();
        
        // Handle window resize which might change the truncation state
        window.addEventListener('resize', checkTruncation);
        return () => window.removeEventListener('resize', checkTruncation);
    }, [content, children]);

    if (!isTruncated) {
        return (
            <div ref={textRef} className={`truncate w-full block ${className}`}>
                {children}
            </div>
        );
    }

    return (
        <Tooltip content={content}>
            <div ref={textRef} className={`truncate w-full block ${className}`}>
                {children}
            </div>
        </Tooltip>
    );
}
