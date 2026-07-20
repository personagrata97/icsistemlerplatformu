import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import { auditApi } from '@/lib/audit-api';
import { Shield, Plus, Check } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { SearchInput } from '@/components/ui/SearchInput';

interface ControlPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddControls: (selectedControls: any[]) => void;
}

export default function ControlPickerModal({ isOpen, onClose, onAddControls }: ControlPickerModalProps) {
    const [controls, setControls] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const router = useRouter();

    useEffect(() => {
        if (isOpen) {
            loadControls();
            setSelectedKeys(new Set());
            setSearchTerm('');
        }
    }, [isOpen]);

    const loadControls = async () => {
        setLoading(true);
        try {
            const data = await auditApi.getAllControls();
            setControls(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Kontrol kütüphanesi yüklenemedi:', error);
            setControls([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        const selectedControls = controls.filter(c => selectedKeys.has(c.id));
        onAddControls(selectedControls);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Merkezi Kütüphaneden Kontrol Ekle"
            size="2xl"
            footer={
                <div className="flex items-center justify-between w-full">
                    <Button variant="secondary" onClick={() => { onClose(); router.push('/audit/controls'); }} leftIcon={<Plus size={16} />}>
                        Kütüphanede Yok Mu? Yeni Oluştur
                    </Button>
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={onClose}>İptal</Button>
                        <Button 
                            variant="primary" 
                            onClick={handleAdd} 
                            disabled={selectedKeys.size === 0}
                            leftIcon={<Check size={16} />}
                        >
                            {selectedKeys.size > 0 ? `${selectedKeys.size} Kontrolü Ekle` : 'Seçilenleri Ekle'}
                        </Button>
                    </div>
                </div>
            }
        >
            <div className="p-4 space-y-4">
                <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                    <SearchInput 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        placeholder="Kütüphanede kontrol ara (isim, kod, kategori)..." 
                    />
                </div>
                
                <DataTable
                    data={controls}
                    loading={loading}
                    rowKey="id"
                    selectable={true}
                    selectedKeys={selectedKeys}
                    onSelectionChange={setSelectedKeys}
                    searchTerm={searchTerm}
                    onClearFilters={() => setSearchTerm('')}
                    paginated={true}
                    itemsPerPage={5}
                    columns={[
                        { key: 'code', header: 'Kod', sortable: true, render: (row: any) => <span className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded">{row.code || '-'}</span> },
                        { key: 'name', header: 'Kontrol Adı', sortable: true, render: (row: any) => <span className="font-medium text-gray-800">{row.name}</span> },
                        { key: 'category', header: 'Kategori', sortable: true },
                        { key: 'type', header: 'Tip', sortable: true },
                        { key: 'frequency', header: 'Sıklık', sortable: true },
                        { key: 'automation', header: 'Otomasyon', sortable: true, align: 'center', render: (row: any) => <StatusBadge type="status" value={row.automation || 'Manuel'} size="sm" /> }
                    ]}
                    emptyIcon={Shield}
                    emptyTitle="Kütüphane Boş"
                    emptyDescription="Merkezi kontrol kütüphanesinde henüz kontrol tanımlanmamış."
                    className="border border-gray-200 rounded-lg shadow-sm"
                />
            </div>
        </Modal>
    );
}
