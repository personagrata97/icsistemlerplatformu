'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Tooltip from './Tooltip';

/**
 * MERKEZİ TOOLTIP KULLANIM KURALLARI:
 * =====================================
 * 1. Sadece ikon olan butonlarda (yazısı olmayan) → Tooltip ZORUNLU
 * 2. Yazı kırpılmışsa (truncate) → Tooltip OTOMATİK gösterilecek
 * 3. Yazı tam görünüyorsa → Tooltip GÖSTERİLMEYECEK (gereksiz)
 * 4. HTML native title attribute ASLA KULLANILMAYACAK
 * 
 * Bu bileşen, yukarıdaki kuralları otomatik olarak uygular.
 * max-width veya truncate CSS'iyle kırpılan metinler için kullanılır.
 */

interface TruncatedTextProps {
    text: string;
    className?: string;
    maxWidth?: string;       // e.g. '200px', '100%'
    icon?: React.ReactNode;  // Optional leading icon
    tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
}

const TruncatedText: React.FC<TruncatedTextProps> = ({
    text,
    className = '',
    maxWidth = '200px',
    icon,
    tooltipPosition = 'top'
}) => {
    const textRef = useRef<HTMLSpanElement>(null);
    const [isTruncated, setIsTruncated] = useState(false);

    const checkTruncation = useCallback(() => {
        if (textRef.current) {
            setIsTruncated(textRef.current.scrollWidth > textRef.current.clientWidth);
        }
    }, []);

    useEffect(() => {
        checkTruncation();
        // Resize gözlemcisi ile yeniden boyutlandırma takibi
        const observer = new ResizeObserver(checkTruncation);
        if (textRef.current) observer.observe(textRef.current);
        return () => observer.disconnect();
    }, [text, checkTruncation]);

    return (
        <Tooltip content={text} position={tooltipPosition} disabled={!isTruncated}>
            <div className={`flex items-center gap-1.5 ${className}`} style={{ maxWidth }}>
                {icon && (
                    <span className="flex-shrink-0">
                        {React.isValidElement(icon) ? icon : (() => { const Icon: any = icon; return <Icon size={14} />; })()}
                    </span>
                )}
                <span ref={textRef} className="truncate">
                    {text || '-'}
                </span>
            </div>
        </Tooltip>
    );
};

export default TruncatedText;
