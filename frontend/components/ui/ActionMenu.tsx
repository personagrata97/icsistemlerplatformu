'use client';
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal, LucideIcon } from 'lucide-react';
import Tooltip from '@/components/ui/Tooltip';
import Button from '@/components/ui/Button';


export type ActionMenuItem = {
    label: string;
    icon: LucideIcon | React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'danger' | 'success' | 'warning';
    disabled?: boolean;
    type?: never;
} | {
    type: 'divider';
};

interface ActionMenuProps {
    items: ActionMenuItem[];
    buttonSize?: number;
    variant?: 'default' | 'ghost' | 'outline';
}

export default function ActionMenu({ items, buttonSize = 20, variant = 'default' }: ActionMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
    const buttonRef = useRef<HTMLButtonElement>(null);

    const getButtonClasses = () => {
        const base = "flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded-full";
        if (variant === 'ghost') {
            return `${base} w-7 h-7 text-gray-400 hover:bg-gray-100 hover:text-gray-900 border-none shadow-none`;
        }
        if (variant === 'outline') {
            return `${base} w-8 h-8 text-gray-500 bg-white hover:bg-gray-50 border border-gray-200 shadow-sm`;
        }
        return `${base} w-8 h-8 text-gray-500 bg-gray-50 hover:bg-gray-100 hover:text-gray-900 border border-transparent hover:border-gray-200 shadow-sm`;
    };

    useEffect(() => {
        const handleScroll = () => {
            if (isOpen) setIsOpen(false);
        };
        if (isOpen) {
            window.addEventListener('scroll', handleScroll, true);
            window.addEventListener('resize', handleScroll);
        }
        return () => {
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleScroll);
        };
    }, [isOpen]);

    useEffect(() => {
        const listener = (event: MouseEvent | TouchEvent) => {
            if (isOpen && buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
                if (event.target instanceof Element && event.target.closest('[data-dropdown-id="action-menu"]')) {
                    return;
                }
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);
        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [isOpen]);

    const handleOpen = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const estimatedHeight = (items?.length || 0) * 40 + 20;
            const isTop = spaceBelow < estimatedHeight && rect.top > estimatedHeight;

            setDropdownStyle({
                position: 'fixed',
                top: isTop ? 'auto' : rect.bottom + 4,
                bottom: isTop ? window.innerHeight - rect.top + 4 : 'auto',
                left: rect.right - 208,
            });
        }
        setIsOpen(!isOpen);
    };

    if (items?.length === 1) {
        const item = items[0];
        if (item.type === 'divider') return null;
        
        const Icon: any = item.icon;
        
        if (variant === 'ghost') {
            return (
                <Tooltip content={item.label}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            item.onClick();
                        }}
                        className={`hover:scale-110 transition-transform p-2 rounded-lg flex items-center justify-center ${item.variant === 'danger' ? 'text-red-500 hover:bg-red-50' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                        type="button"
                    >
                        {React.isValidElement(Icon) ? Icon : <Icon size={18} />}
                    </button>
                </Tooltip>
            );
        }

        return (
            <Button
                variant={item.variant === 'danger' ? 'danger' : 'secondary'}
                size="sm"
                onClick={(e) => {
                    e.stopPropagation();
                    item.onClick();
                }}
                leftIcon={React.isValidElement(Icon) ? Icon : <Icon size={16} strokeWidth={2} />}
                className="shadow-sm hover:shadow-md transition-all whitespace-nowrap"
            >
                {item.label}
            </Button>
        );
    }

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                className={getButtonClasses()}
                onClick={handleOpen}
            >
                <MoreHorizontal size={buttonSize} />
            </button>

            {isOpen && typeof document !== 'undefined' && createPortal(
                <div
                    data-dropdown-id="action-menu"
                    className="w-52 p-1.5 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] bg-white ring-1 ring-black/5 z-[9999] animate-in fade-in zoom-in-95 duration-200"
                    style={dropdownStyle}
                >
                    <div className="flex flex-col gap-0.5">
                        {items?.map((item, index) => {
                            if (item.type === 'divider') {
                                return <div key={index} className="h-px bg-slate-200 my-1 mx-2" />;
                            }
                            const Icon: any = item.icon;
                            let baseClasses = "text-slate-700 hover:bg-slate-50 hover:text-slate-900";
                            let iconContainerClasses = "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-slate-700 group-hover:shadow-sm";

                            if (item.variant === 'danger') {
                                baseClasses = "text-rose-600 hover:bg-rose-50 hover:text-rose-700";
                                iconContainerClasses = "bg-rose-100/50 text-rose-500 group-hover:bg-rose-100 group-hover:text-rose-600";
                            } else if (item.variant === 'success') {
                                baseClasses = "text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800";
                                iconContainerClasses = "bg-emerald-100/50 text-emerald-500 group-hover:bg-emerald-100 group-hover:text-emerald-600";
                            } else if (item.variant === 'warning') {
                                baseClasses = "text-amber-700 hover:bg-amber-50 hover:text-amber-800";
                                iconContainerClasses = "bg-amber-100/50 text-amber-500 group-hover:bg-amber-100 group-hover:text-amber-600";
                            }

                            if (item.disabled) {
                                baseClasses = "text-slate-300 cursor-not-allowed";
                                iconContainerClasses = "bg-slate-50 text-slate-300";
                            }

                            return (
                                <button
                                    key={index}
                                    type="button"
                                    disabled={item.disabled}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!item.disabled) {
                                            setIsOpen(false);
                                            item.onClick();
                                        }
                                    }}
                                    className={`group flex items-center w-full px-2.5 py-2 text-[13px] font-medium rounded-lg transition-all duration-200 ${baseClasses}`}
                                >
                                    <div className={`p-1.5 rounded-md mr-2.5 transition-colors ${iconContainerClasses}`}>
                                        {Icon ? (React.isValidElement(Icon) ? Icon : <Icon size={14} strokeWidth={2.5} />) : null}
                                    </div>
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
