import React, { useState, useRef } from 'react';
import { ChevronDown, CheckCircle, Search, X } from 'lucide-react';
import { AuditStaff } from '@/lib/audit-api';
import useOnClickOutside from '@/hooks/useOnClickOutside';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';

interface StaffMultiSelectProps {
    staffList: AuditStaff[];
    selectedIds: string[];
    onChange: (ids: string[]) => void;
    label?: string;
    placeholder?: string;
    disabledIds?: string[]; // IDs that should be disabled (e.g. supervisor)
}

const StaffMultiSelect: React.FC<StaffMultiSelectProps> = ({
    staffList,
    selectedIds,
    onChange,
    label = "Müfettişler",
    placeholder = "Müfettiş Seçiniz...",
    disabledIds = []
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    useOnClickOutside(containerRef, () => setIsOpen(false));

    const toggleSelection = (id: string) => {
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter(sid => sid !== id));
        } else {
            onChange([...selectedIds, id]);
        }
    };

    return (
        <div className="form-group relative" ref={containerRef}>
            {label && <label className="form-label">{label} ({selectedIds.length})</label>}
            <Button
                type="button"
                variant="secondary"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full justify-between bg-white min-h-[42px] px-3 font-normal"
                rightIcon={<ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
            >
                <span className="truncate text-sm text-gray-700">
                    {selectedIds.length > 0
                        ? `${selectedIds.length} Personel Seçili`
                        : placeholder}
                </span>
            </Button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto p-1">
                    {staffList.length === 0 ? (
                        <div className="p-3 text-sm text-gray-500 text-center">Personel bulunamadı</div>
                    ) : (
                        staffList
                            .filter(s => s.status === 'Aktif')
                            .map(staff => {
                                const isDisabled = disabledIds.includes(staff.id);
                                const isSelected = selectedIds.includes(staff.id);
                                return (
                                    <div
                                        key={staff.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (!isDisabled) toggleSelection(staff.id);
                                        }}
                                        className={`flex items-center justify-between p-2 hover:bg-gray-50 rounded text-sm cursor-pointer ${isDisabled ? 'opacity-50' : ''}`}
                                    >
                                        <Checkbox 
                                            id={`staff-chk-${staff.id}`} 
                                            checked={isSelected} 
                                            onChange={() => {}} 
                                            disabled={isDisabled}
                                            label={staff.name}
                                        />
                                        <span className="text-xs text-gray-400 font-normal">{staff.role || staff.title}</span>
                                    </div>
                                );
                            })
                    )}
                </div>
            )}
            <p className="text-xs text-gray-400 mt-1">Listeden birden fazla personel seçebilirsiniz.</p>
        </div>
    );
};

export default StaffMultiSelect;
