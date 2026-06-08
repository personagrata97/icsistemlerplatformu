
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
    content: React.ReactNode;
    children: React.ReactElement;
    position?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
}

const Tooltip: React.FC<TooltipProps> = ({
    content,
    children,
    position = 'top',
    delay = 100 // Reduced delay for better feel
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const updateCoords = () => {
        if (triggerRef.current && tooltipRef.current) {
            const triggerRect = triggerRef.current.getBoundingClientRect();
            const tooltipRect = tooltipRef.current.getBoundingClientRect();

            let top = 0;
            let left = 0;
            let effectivePosition = position;

            const scrollY = window.pageYOffset || document.documentElement.scrollTop;
            const scrollX = window.pageXOffset || document.documentElement.scrollLeft;

            // SMART POSITIONING (FLIP): Check if tooltip overflows top boundary
            if (position === 'top' && triggerRect.top < tooltipRect.height + 20) {
                effectivePosition = 'bottom';
            } 
            // Check if tooltip overflows bottom boundary
            else if (position === 'bottom' && window.innerHeight - triggerRect.bottom < tooltipRect.height + 20) {
                effectivePosition = 'top';
            }

            // Simplified and robust positioning
            if (effectivePosition === 'top') {
                top = triggerRect.top + scrollY - tooltipRect.height - 10;
                left = triggerRect.left + scrollX + (triggerRect.width / 2) - (tooltipRect.width / 2);
            } else if (effectivePosition === 'bottom') {
                top = triggerRect.bottom + scrollY + 10;
                left = triggerRect.left + scrollX + (triggerRect.width / 2) - (tooltipRect.width / 2);
            } else if (effectivePosition === 'left') {
                top = triggerRect.top + scrollY + (triggerRect.height / 2) - (tooltipRect.height / 2);
                left = triggerRect.left + scrollX - tooltipRect.width - 10;
            } else if (effectivePosition === 'right') {
                top = triggerRect.top + scrollY + (triggerRect.height / 2) - (tooltipRect.height / 2);
                left = triggerRect.right + scrollX + 10;
            }

            // Viewport boundary protection (Horizontal)
            const padding = 10;
            if (left < padding) left = padding;
            if (left + tooltipRect.width > window.innerWidth - padding) {
                left = window.innerWidth - tooltipRect.width - padding;
            }

            setCoords({ top, left });
            return effectivePosition;
        }
        return position;
    };

    const handleMouseEnter = () => {
        timerRef.current = setTimeout(() => {
            setIsVisible(true);
        }, delay);
    };

    const handleMouseLeave = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setIsVisible(false);
    };

    const [activePosition, setActivePosition] = useState(position);

    useEffect(() => {
        if (isVisible) {
            const newPos = updateCoords();
            if (newPos) setActivePosition(newPos);

            // Double check position after render to ensure accuracy
            const timeoutId = setTimeout(() => {
                const updatedPos = updateCoords();
                if (updatedPos) setActivePosition(updatedPos);
            }, 0);
            return () => clearTimeout(timeoutId);
        }
    }, [isVisible]);

    // Clone the child to attach event listeners
    const trigger = React.cloneElement(children, {
        ref: triggerRef,
        onMouseEnter: (e: React.MouseEvent) => {
            handleMouseEnter();
            if (children.props.onMouseEnter) children.props.onMouseEnter(e);
        },
        onMouseLeave: (e: React.MouseEvent) => {
            handleMouseLeave();
            if (children.props.onMouseLeave) children.props.onMouseLeave(e);
        }
    });

    return (
        <>
            {trigger}
            {isVisible && createPortal(
                <div
                    ref={tooltipRef}
                    style={{
                        position: 'absolute',
                        top: `${coords.top}px`,
                        left: `${coords.left}px`,
                        zIndex: 100010, // Must be higher than Toast (100001) and Modals (9999)
                        pointerEvents: 'none',
                        visibility: coords.top === 0 && coords.left === 0 ? 'hidden' : 'visible'
                    }}
                    className="tooltip-container z-[100010] pointer-events-none"
                >
                    <div className="relative bg-white/95 text-slate-700 text-xs font-medium py-1.5 px-3 rounded-lg shadow-xl border border-slate-200/80 backdrop-blur-md animate-tooltip-in">
                        {content}
                        {/* Arrow */}
                        <div className={`absolute w-2 h-2 bg-white border-slate-200/80 transform rotate-45 ${activePosition === 'top' ? 'bottom-[-5px] left-1/2 -translate-x-1/2 border-r border-b' :
                            activePosition === 'bottom' ? 'top-[-5px] left-1/2 -translate-x-1/2 border-l border-t' :
                                activePosition === 'left' ? 'right-[-5px] top-1/2 -translate-y-1/2 border-r border-t' :
                                    'left-[-5px] top-1/2 -translate-y-1/2 border-l border-b'
                            }`} />
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default Tooltip;
