'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, CheckCircle, X, Search } from 'lucide-react';
import useOnClickOutside from '@/hooks/useOnClickOutside';
import OverflowTooltip from '@/components/ui/OverflowTooltip';

interface Option {
    value: string;
    label: string;
    subtitle?: string;
    disabled?: boolean;
    className?: string; // Color styling for the option
}

interface CustomSelectProps {
    value: string | string[];
    onChange: (value: string | string[]) => void;
    options: Option[];
    placeholder?: string;
    label?: string;
    isMulti?: boolean;
    isCreatable?: boolean;
    disabled?: boolean;
    showSearch?: boolean;
    isSearchable?: boolean;
    error?: boolean;
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'default';
    size?: 'sm' | 'md' | 'lg';
    className?: string; // Added for extra flexibility
    labelClassName?: string; // Added for custom label styling
    checkAllOption?: boolean;
}

export default function CustomSelect({
    value,
    onChange,
    options,
    placeholder = 'Seçiniz...',
    label,
    isMulti = false,
    isCreatable = false,
    disabled = false,
    showSearch = false,
    isSearchable = false,
    error = false,
    variant = 'default',
    size = 'md',
    className = '',
    labelClassName = '',
    checkAllOption = false
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Internal showSearch determination
    const finalShowSearch = showSearch || isSearchable || isCreatable;
    const [position, setPosition] = useState({ top: 0 as number | undefined, bottom: undefined as number | undefined, left: 0, width: 0, maxHeight: 300 });
    const dropdownRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
                modalRef.current && !modalRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleScroll = (event: Event) => {
            // Sadece ana pencere veya döküman seviyesindeki gerçek kaydırmalarda kapat.
            // Modal içindeki kaydırmalar dropdown'ı kapatmamalı.
            if (event.target !== window && event.target !== document) {
                return;
            }
            setIsOpen(false);
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('resize', () => setIsOpen(false));
            window.addEventListener('scroll', handleScroll, true);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('resize', () => setIsOpen(false));
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [isOpen]);

    // Calculate position when opening
    useEffect(() => {
        if (isOpen && dropdownRef.current) {
            const updatePosition = () => {
                if (dropdownRef.current) {
                    const rect = dropdownRef.current.getBoundingClientRect();
                    const spaceBelow = window.innerHeight - rect.bottom;
                    const spaceAbove = rect.top;
                    const dropdownHeight = 350;

                    const openUpwards = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

                    setPosition({
                        top: openUpwards ? undefined : rect.bottom + 4,
                        bottom: openUpwards ? window.innerHeight - rect.top + 4 : undefined,
                        left: rect.left,
                        width: rect.width,
                        maxHeight: openUpwards ? Math.max(spaceAbove - 20, 150) : Math.max(spaceBelow - 20, 150)
                    });
                }
            };

            updatePosition();
            // Recalculate on next frame to ensure correct placement if layout shifts
            requestAnimationFrame(updatePosition);
        }
    }, [isOpen]);

    // Filter options based on search
    const filteredOptions = (options || []).filter(option =>
        (option.label?.toLocaleLowerCase('tr-TR') || '').includes(searchTerm.toLocaleLowerCase('tr-TR')) ||
        (option.subtitle?.toLocaleLowerCase('tr-TR') || '').includes(searchTerm.toLocaleLowerCase('tr-TR'))
    );

    const handleSelect = (optionValue: string, optionDisabled?: boolean) => {
        if (optionDisabled) return;

        if (isMulti) {
            const currentValues = Array.isArray(value) ? value : [];
            const newValues = currentValues.includes(optionValue)
                ? currentValues.filter(v => v !== optionValue)
                : [...currentValues, optionValue];
            onChange(newValues);
        } else {
            onChange(optionValue);
            setIsOpen(false);
        }
        
        // Reset search term when a selection is made
        if (isCreatable) {
            setSearchTerm('');
        }
    };

    const exactMatchExists = (options || []).some(o => o.label.toLocaleLowerCase('tr-TR') === searchTerm.toLocaleLowerCase('tr-TR'));
    
    // Create base display options
    let displayOptions = [...filteredOptions];
    
    // Add custom selected values to the dropdown so they can be unchecked
    if (isCreatable) {
        const currentValues = Array.isArray(value) ? value : (value ? [value] : []);
        currentValues.forEach(val => {
            const existsInOptions = (options || []).some(o => o.value === val);
            const existsInDisplay = displayOptions.some(o => o.value === val);
            if (!existsInOptions && !existsInDisplay) {
                // If it matches search term or search term is empty, show it
                if (searchTerm.trim() === '' || val.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR'))) {
                    displayOptions.push({
                        value: val,
                        label: val,
                        className: 'text-primary'
                    });
                }
            }
        });
    }

    if (isCreatable && searchTerm.trim() !== '' && !exactMatchExists) {
        displayOptions.push({
            value: searchTerm.trim(),
            label: `Ekle: "${searchTerm.trim()}"`,
            className: 'text-primary font-bold'
        });
    }

    const isSelected = (optionValue: string) => {
        if (isMulti) {
            return Array.isArray(value) && value.includes(optionValue);
        }
        return value === optionValue;
    };

    const getDisplayValue = () => {
        if (!value || (Array.isArray(value) && value.length === 0)) {
            return <span className="text-slate-400 font-semibold">{placeholder}</span>;
        }

        if (isMulti) {
            const count = (value as string[]).length;
            return <span className="text-slate-700 font-semibold text-sm">{count} seçildi</span>;
        }

        const selectedOption = options.find(o => o.value === value);
        return (
            <span className={`font-semibold truncate ${selectedOption?.className ? 'px-2 py-0.5 rounded text-sm ' + selectedOption.className : 'text-slate-700'}`}>
                {selectedOption?.label || value}
            </span>
        );
    };

    const toggleDropdown = () => {
        if (!disabled) {
            setIsOpen(!isOpen);
            setSearchTerm(''); // Reset search on open
        }
    };

    // Helper to get selected option styles for container (optional, if we want full bg)
    const getSelectedContainerStyle = () => {
        if (!isMulti && value) {
            const selectedOption = options.find(o => o.value === value);
            // If the option has a specific background class (starts with bg-), we might want to apply a lighter version or border color to the container
            // But for now, let's stick to colouring the text/span inside as implemented in getDisplayValue
            // If the user wants the WHOLE box colored, we'd check selectedOption.className
            if (selectedOption?.className?.includes('bg-')) {
                return selectedOption.className.replace('text-', 'border-').split(' ').filter(c => c.startsWith('bg-') || c.startsWith('border-')).join(' ') + ' bg-opacity-20 border-opacity-50';
            }
        }
        return '';
    };

    const selectedOption = !isMulti && value ? options.find(o => o.value === value) : null;
    const containerDynamicClass = selectedOption?.className ? selectedOption.className : '';

    const variants = {
        default: "bg-white border border-slate-200 text-slate-900 rounded-xl px-3.5 text-sm transition-all duration-200 hover:border-slate-300",
        primary: "bg-[#009c45] hover:bg-[#007a36] text-white shadow-md rounded-lg font-semibold px-4 h-9",
        secondary: "bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm rounded-lg font-semibold px-4 h-9",
        ghost: "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100 shadow-none rounded-lg font-semibold px-4 h-9",
        outline: "bg-transparent border border-slate-300 text-slate-700 hover:border-slate-400 hover:text-slate-900 shadow-none rounded-lg font-semibold px-4 h-9"
    };

    const sizes = {
        sm: 'h-8 px-3 text-xs',
        md: 'h-9 px-4 text-sm',
        lg: 'h-10 px-6 text-base',
    };

    const variantClass = variant !== 'default' ? variants[variant] : variants.default;
    const sizeClass = variant !== 'default' ? sizes[size] : '';

    return (
        <div className={`relative ${disabled ? 'opacity-60 pointer-events-none' : ''} ${className}`} ref={dropdownRef}>
            {label && (
                <label className={labelClassName || "block text-sm font-semibold text-slate-700 mb-1.5"}>
                    {label}
                </label>
            )}

            <div
                className={`
                    w-full flex items-center justify-between cursor-pointer transition-all gap-2 select-none outline-none focus:outline-none
                    ${variantClass} ${sizeClass} ${variant === 'default' ? 'min-h-[42px] py-2.5' : ''}
                    ${isOpen && variant === 'default' ? 'border-primary ring-4 ring-primary/10' : ''}
                    ${isOpen && variant !== 'default' ? 'ring-2 ring-primary/20 border-primary' : ''}
                    ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''}
                    ${containerDynamicClass} 
                `}
                style={{ WebkitTapHighlightColor: 'transparent' }}
                onClick={toggleDropdown}
                tabIndex={0}
            >
                <div className="flex-1 overflow-hidden flex items-center">
                    {/* If we applied the class to the container, we don't need to wrap the text in another span with same class, or we do specific text color handling */}
                    {/* Improved strategy: pass 'className' which usually contains bg and text colors. */}
                    {/* If container has bg, text should optionally be white or colored. */}
                    {/* Let's simplify: Only apply class to container if it exists. */}
                    {/* But getDisplayValue wraps it in a span too. Let's adjust getDisplayValue. */}
                    {!value || (Array.isArray(value) && value.length === 0) ? (
                        <span className="text-slate-400 font-semibold">{placeholder}</span>
                    ) : isMulti ? (
                        <span className="text-slate-700 font-semibold text-sm">{(value as string[]).length} seçildi</span>
                    ) : (
                        <OverflowTooltip content={selectedOption?.label || value as string}>
                            <span className={`truncate font-semibold block ${selectedOption?.className ? 'text-inherit' : (variant === 'secondary' ? 'text-slate-700' : 'text-slate-700')}`}>
                                {selectedOption?.label || value}
                            </span>
                        </OverflowTooltip>
                    )}
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${selectedOption?.className ? 'text-current opacity-70' : ''}`} />
            </div>

            {
                isOpen && position.width > 0 && typeof document !== 'undefined' && createPortal(
                    <div
                        ref={modalRef}
                        data-ignore-outside-clicks="true"
                        className="fixed z-[999999] bg-white/95 backdrop-blur-md border border-slate-200/60 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col"
                        style={{
                            ...(position.top !== undefined ? { top: position.top } : {}),
                            ...(position.bottom !== undefined ? { bottom: position.bottom } : {}),
                            left: position.left,
                            minWidth: position.width,
                            width: 'auto',
                            maxHeight: position.maxHeight
                        }}
                    >
                        {finalShowSearch && (
                            <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all bg-white"
                                        placeholder="Ara..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && isCreatable && searchTerm.trim() !== '') {
                                                e.preventDefault();
                                                const exactMatch = filteredOptions.find(o => o.label.toLocaleLowerCase('tr-TR') === searchTerm.toLocaleLowerCase('tr-TR'));
                                                if (exactMatch) {
                                                    handleSelect(exactMatch.value);
                                                } else {
                                                    handleSelect(searchTerm.trim());
                                                }
                                            }
                                        }}
                                        ref={(input) => {
                                            if (input) input.focus({ preventScroll: true });
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                            </div>
                        )}

                        {isMulti && checkAllOption && (
                            <div className="px-3 py-2 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const allValues = options.filter(o => !o.disabled).map(o => o.value);
                                        onChange(allValues);
                                    }}
                                    className="text-xs font-semibold text-primary hover:bg-primary/5 px-2 py-1 flex items-center gap-1.5 rounded transition-colors"
                                >
                                    <CheckCircle size={14} strokeWidth={2.5} />
                                    <span>Tümünü Seç</span>
                                </button>
                                {Array.isArray(value) && value.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onChange([]);
                                        }}
                                        className="text-xs font-semibold text-rose-600 hover:bg-rose-50 px-2 py-1 flex items-center gap-1.5 rounded transition-colors"
                                    >
                                        <X size={14} strokeWidth={2.5} />
                                        <span>Temizle</span>
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="p-1.5 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                            {displayOptions.length === 0 ? (
                                <div className="py-3 text-center text-xs text-gray-500">Sonuç bulunamadı</div>
                            ) : (
                                displayOptions.map((option) => {
                                    const selected = isSelected(option.value);
                                    return (
                                        <div
                                            key={option.value}
                                            className={`
                                            flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-all duration-200 mb-0.5 last:mb-0
                                            ${option.disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'cursor-pointer'}
                                            ${selected && !option.disabled ? 'bg-primary/10 text-primary font-bold shadow-sm' : ''}
                                            ${!selected && !option.disabled ? 'text-slate-600 hover:bg-slate-50 hover:text-slate-900' : ''}
                                            ${option.className && !selected ? option.className.replace('bg-', 'hover:bg-').replace('border-', 'hover:border-') : ''}  
                                        `}
                                            /* Note: applying fixed bg class to dropdown item might look weird if selected state overrides it. 
                                               Let's keep dropdown items clean or just apply text color? 
                                               User said "Risklerin rengine dönsün orası. SEÇİNCE ama." 
                                               So mainly focusing on the trigger button. 
                                               But nice to show color in dropdown too. 
                                               Let's add a small dot or text color in dropdown.
                                            */
                                            onClick={() => handleSelect(option.value, option.disabled)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`
                                                    w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-all
                                                    ${selected ? 'bg-primary border-primary' : 'border-gray-300 bg-white'}
                                                    ${option.disabled ? 'bg-gray-100' : ''}
                                                `}>
                                                    {selected && <Check size={12} className="text-white" />}
                                                </div>
                                                <div className="flex flex-col leading-tight">
                                                    <span className={option.className ? option.className.split(' ').filter(c => c.startsWith('text-')).join(' ') : ''}>
                                                        {option.label}
                                                    </span>
                                                    {option.subtitle && <span className="text-[10px] text-gray-400 font-normal">{option.subtitle}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                    </div>,
                    document.body
                )
            }
        </div >
    );
}
