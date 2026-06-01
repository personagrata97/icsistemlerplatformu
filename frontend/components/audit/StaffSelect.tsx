import React, { useState, useEffect, useRef } from 'react';
import { Check, ChevronsUpDown, Loader2, Search, X } from 'lucide-react';
import { auditApi, AuditStaff } from '@/lib/audit-api';
import useOnClickOutside from '@/hooks/useOnClickOutside';

interface StaffSelectProps {
    value: string | string[];
    onChange: (value: string | string[]) => void;
    label?: string;
    placeholder?: string;
    isMulti?: boolean;
    filterRole?: string | string[]; // Filter by specific roles (e.g. 'Müfettiş')
    excludeIds?: string[];
    disabled?: boolean;
    required?: boolean;
}

const StaffSelect: React.FC<StaffSelectProps> = ({
    value,
    onChange,
    label,
    placeholder = "Personel seçiniz...",
    isMulti = false,
    filterRole,
    excludeIds = [],
    disabled = false,
    required = false
}) => {
    const [staffList, setStaffList] = useState<AuditStaff[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const containerRef = useRef<HTMLDivElement>(null);
    useOnClickOutside(containerRef, () => setIsOpen(false));

    useEffect(() => {
        loadStaff();
    }, []);

    const loadStaff = async () => {
        try {
            setLoading(true);
            const data = await auditApi.getStaff();
            setStaffList(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Staff loading failed', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredOptions = staffList.filter(staff => {
        // 1. Status Filter (Only Active)
        if (staff.status !== 'Aktif') return false;

        // 2. Role Filter
        if (filterRole) {
            const roles = Array.isArray(filterRole) ? filterRole : [filterRole];
            // If staff has no title or doesn't match requested roles
            const staffTitle = staff.title || '';
            if (!roles.some(r => staffTitle.includes(r))) return false;
        }

        // 3. Exclude IDs
        if (excludeIds.includes(staff.id)) return false;

        // 4. Search Term
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            return (
                staff.name.toLowerCase().includes(search) ||
                (staff.title && staff.title.toLowerCase().includes(search))
            );
        }

        return true;
    });

    const handleSelect = (staffId: string) => {
        if (isMulti) {
            const currentValues = Array.isArray(value) ? value : [];
            if (currentValues.includes(staffId)) {
                onChange(currentValues.filter(id => id !== staffId));
            } else {
                onChange([...currentValues, staffId]);
            }
        } else {
            onChange(staffId);
            setIsOpen(false);
        }
    };

    const removeSelection = (e: React.MouseEvent, idToRemove: string) => {
        e.stopPropagation();
        if (isMulti && Array.isArray(value)) {
            onChange(value.filter(id => id !== idToRemove));
        } else {
            onChange('');
        }
    };

    const selectedLabels = () => {
        if (!value || (Array.isArray(value) && value.length === 0)) return null;

        if (isMulti && Array.isArray(value)) {
            return value.map(id => staffList.find(s => s.id === id)).filter(Boolean);
        } else {
            return [staffList.find(s => s.id === value)].filter(Boolean);
        }
    };

    const renderTrigger = () => {
        const selected = selectedLabels();

        return (
            <div
                className={`
                    bg-white border border-slate-200 text-slate-900 rounded-xl px-3.5 text-sm transition-all duration-200 hover:border-slate-300 flex items-center justify-between cursor-pointer w-full gap-2 min-h-[42px] py-2.5
                    ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-50' : ''}
                    ${isOpen ? 'border-primary ring-4 ring-primary/10 outline-none' : ''}
                `}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <div className="flex flex-wrap gap-1.5 flex-1">
                    {selected && selected.length > 0 ? (
                        selected.map((s: any) => (
                            <span key={s.id} className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-medium">
                                {s.name}
                                {!disabled && (
                                    <X size={12} className="hover:text-red-500 cursor-pointer" onClick={(e) => removeSelection(e, s.id)} />
                                )}
                            </span>
                        ))
                    ) : (
                        <span className="text-gray-400">{placeholder}</span>
                    )}
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <ChevronsUpDown size={14} />}
                </div>
            </div>
        );
    };

    return (
        <div className="relative" ref={containerRef}>
            {label && (
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>{label} {required && <span className="text-red-500">*</span>}</span>
                    {loading && <span className="text-[10px] text-gray-400 flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Yükleniyor</span>}
                </label>
            )}

            {renderTrigger()}

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2 border-b border-gray-50">
                        <div className="relative">
                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-primary transition-colors"
                                placeholder="Personel ara..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
                        {filteredOptions.length === 0 ? (
                            <div className="p-4 text-center text-xs text-gray-400">
                                {searchTerm ? 'Sonuç bulunamadı' : 'Gösterilecek personel yok'}
                            </div>
                        ) : (
                            filteredOptions.map(staff => {
                                const isSelected = Array.isArray(value) ? value.includes(staff.id) : value === staff.id;
                                return (
                                    <div
                                        key={staff.id}
                                        className={`
                                            flex items-center justify-between px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors mb-0.5
                                            ${isSelected ? 'bg-primary/5 text-primary font-medium' : 'text-gray-600 hover:bg-gray-50'}
                                        `}
                                        onClick={() => handleSelect(staff.id)}
                                    >
                                        <div className="flex flex-col">
                                            <span>{staff.name}</span>
                                            {staff.title && <span className="text-[10px] text-gray-400 font-normal">{staff.title}</span>}
                                        </div>
                                        {isSelected && <Check size={14} />}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {isMulti && (
                        <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-400 text-center">
                            Birden fazla seçim yapabilirsiniz
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default StaffSelect;
