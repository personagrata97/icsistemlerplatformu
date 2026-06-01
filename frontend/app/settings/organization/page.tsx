'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, Plus, Edit2, Trash2, Home, Network, ChevronRight, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import Modal from '@/components/ui/Modal';
import { organizationApi } from '@/lib/organization-api';
import Button from '@/components/ui/Button';
import CustomSelect from '@/components/ui/CustomSelect';
import Tooltip from '@/components/ui/Tooltip';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmModal from '@/components/ConfirmModal';
import LoadingState from '@/components/ui/LoadingState';

// Utility for tree manipulation
const generateId = () => Math.random().toString(36).substring(2, 9);

interface OrgNode {
    id: string;
    name: string;
    type: string;
    manager?: string;
    auditCycle?: string;
    riskScore?: number;
    isActive: boolean;
    children?: OrgNode[];
}

export default function OrganizationSettingsPage() {
    const { showToast } = useToast();

    const [hierarchy, setHierarchy] = useState<OrgNode[]>([]);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [editingNode, setEditingNode] = useState<OrgNode | null>(null);
    const [parentNodeId, setParentNodeId] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '', // Yeni alan: Birim Kodu
        type: 'Departman',
        manager: '',
        riskScore: '',
        auditCycle: '1 Yıl',
        description: '' // Yeni alan: Açıklama
    });

    useEffect(() => {
        fetchHierarchy();
    }, []);

    const fetchHierarchy = async () => {
        setIsLoading(true);
        try {
            const data = await organizationApi.getTree();
            setHierarchy(data || []);
            // Expand all root nodes initially
            const rootIds = data.map((node: any) => node.id);
            setExpandedNodes(new Set(rootIds));
        } catch (error) {
            showToast('Organizasyon yapısı yüklenemedi.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleExpand = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedNodes(newExpanded);
    };

    const handleCreateRoot = () => {
        setModalMode('create');
        setParentNodeId(null);
        setEditingNode(null);
        setFormData({ name: '', code: '', type: 'Genel Müdürlük', manager: '', riskScore: '', auditCycle: '1 Yıl', description: '' });
        setIsModalOpen(true);
    };

    const handleAddChild = (parentId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setModalMode('create');
        setParentNodeId(parentId);
        setEditingNode(null);
        setFormData({ name: '', code: '', type: 'Servis', manager: '', riskScore: '', auditCycle: '1 Yıl', description: '' });

        // Auto expand parent when adding child
        if (!expandedNodes.has(parentId)) {
            const newExpanded = new Set(expandedNodes);
            newExpanded.add(parentId);
            setExpandedNodes(newExpanded);
        }

        setIsModalOpen(true);
    };

    const handleEdit = (node: OrgNode, e: React.MouseEvent) => {
        e.stopPropagation();
        setModalMode('edit');
        setEditingNode(node);
        setFormData({
            name: node.name,
            code: (node as any).code || '',
            type: node.type || 'Servis',
            manager: node.manager || '',
            riskScore: node.riskScore ? String(node.riskScore) : '',
            auditCycle: node.auditCycle || '1 Yıl',
            description: (node as any).description || ''
        });
        setIsModalOpen(true);
    };

    const confirmDelete = async () => {
        if (deleteConfirm) {
            try {
                await organizationApi.deleteNode(deleteConfirm);
                showToast('Birim başarıyla silindi.', 'success');
                fetchHierarchy();
            } catch (err) {
                showToast('Birim silinemedi.', 'error');
            } finally {
                setDeleteConfirm(null);
            }
        }
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteConfirm(id);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const payload = {
                name: formData.name.trim(),
                code: formData.code.trim(),
                type: formData.type,
                parentId: parentNodeId || undefined,
                manager: formData.manager,
                riskScore: formData.riskScore ? parseFloat(formData.riskScore) : undefined,
                auditCycle: formData.auditCycle,
                description: formData.description.trim()
            };

            if (modalMode === 'create') {
                await organizationApi.createNode(payload);
                showToast(parentNodeId ? 'Alt birim eklendi' : 'Ana birim eklendi', 'success');
            } else if (modalMode === 'edit' && editingNode) {
                // Ignore parent id for updating since we just edit properties from list view
                const { parentId, ...updatePayload } = payload;
                await organizationApi.updateNode(editingNode.id, updatePayload);
                showToast('Birim güncellendi', 'success');
            }
            fetchHierarchy();
            setIsModalOpen(false);
        } catch (err: any) {
            showToast(err.message || 'İşlem başarısız.', 'error');
        }
    };

    const renderTree = (nodes: OrgNode[], level = 0) => {
        return (
            <div className={`space-y-2 ${level > 0 ? 'mt-2 ml-6 pl-4 border-l-2 border-gray-100' : ''}`}>
                {nodes.map(node => {
                    const hasChildren = node.children && node.children.length > 0;
                    const isExpanded = expandedNodes.has(node.id);

                    return (
                        <div key={node.id} className="animate-in fade-in zoom-in-95 duration-200">
                            <div
                                className={`flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:border-primary/30 hover:shadow-sm transition-all group ${hasChildren ? 'cursor-pointer' : ''}`}
                                onClick={hasChildren ? (e) => toggleExpand(node.id, e) : undefined}
                            >
                                <div className="flex items-center gap-3">
                                    {hasChildren ? (
                                        <button
                                            className="w-6 h-6 flex items-center justify-center rounded-md bg-gray-50 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
                                        >
                                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        </button>
                                    ) : (
                                        <div className="w-6 h-6" /> // Spacer
                                    )}
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <Network size={16} className={level === 0 ? "text-primary" : "text-gray-400"} />
                                            <span className={`font-medium ${level === 0 ? "text-gray-900" : "text-gray-700"}`}>
                                                {node.name}
                                            </span>
                                            <span className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                                {node.type}
                                            </span>
                                        </div>
                                        {node.manager && (
                                            <div className="text-xs text-gray-500 ml-6 flex gap-3 mt-1">
                                                <span>Yönetici: {node.manager}</span>
                                                {node.riskScore && <span>• Risk: {node.riskScore}</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Tooltip content="Alt Birim Ekle">
                                        <button
                                            onClick={(e) => handleAddChild(node.id, e)}
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </Tooltip>
                                    <Tooltip content="Düzenle">
                                        <button
                                            onClick={(e) => handleEdit(node, e)}
                                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    </Tooltip>
                                    <Tooltip content="Sil">
                                        <button
                                            onClick={(e) => handleDelete(node.id, e)}
                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </Tooltip>
                                </div>
                            </div>

                            {hasChildren && isExpanded && (
                                renderTree(node.children!, level + 1)
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="p-8 max-w-[1400px] mx-auto pb-24">

            <div className="flex items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white shadow-sm border border-gray-100 rounded-xl flex items-center justify-center">
                        <Settings className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Organizasyon Yapısı</h1>
                        <p className="text-gray-500 text-sm">Kurum içi genel müdürlük, başkanlık, müdürlük ve servis hiyerarşisini yönetin</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/settings"
                        className="btn btn-secondary gap-2"
                    >
                        <Settings className="w-5 h-5" />
                        <span className="font-medium text-sm">Diğer Ayarlar</span>
                    </Link>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Kurumsal Hiyerarşi Modeli</h2>
                        <p className="text-sm text-gray-500 mt-1">Sistemdeki yetki devirleri, mutabakatlar ve kullanıcı atamaları bu ağaca göre çalışır.</p>
                    </div>
                    <Button
                        leftIcon={<Plus size={18} />}
                        onClick={handleCreateRoot}
                    >
                        Ana (Kök) Birim Ekle
                    </Button>
                </div>

                <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100/50">
                    {isLoading ? (
                        <LoadingState message="Organizasyon yapısı yükleniyor..." />
                    ) : hierarchy.length === 0 ? (
                        <EmptyState
                            title="Sistemde kayıtlı organizasyon yapısı bulunmuyor"
                            description="Denetim evreninizi oluşturmak için hiyerarşi modelini kurmaya başlayın"
                            icon={Network}
                            action={{
                                label: "İlk Birimi Ekle",
                                onClick: handleCreateRoot
                            }}
                        />
                    ) : (
                        renderTree(hierarchy)
                    )}
                </div>
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={modalMode === 'create' ? (parentNodeId ? 'Alt Birim Ekle' : 'Ana Birim Ekle') : 'Birim Düzenle'}
            >
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-1">
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Birim Kodu</label>
                            <input
                                required
                                type="text"
                                placeholder="Örn: BT-001"
                                className="form-input"
                                value={formData.code}
                                onChange={e => setFormData({ ...formData, code: e.target.value })}
                            />
                        </div>

                        <div className="md:col-span-1">
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Birim Adı</label>
                            <input
                                required
                                type="text"
                                placeholder="Örn: Bilgi Teknolojileri Servisi"
                                className="form-input"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div>
                            <CustomSelect
                                label="Birim Tipi"
                                value={formData.type}
                                onChange={(val) => setFormData({ ...formData, type: String(val) })}
                                options={[
                                    { value: 'Genel Müdürlük', label: 'Genel Müdürlük' },
                                    { value: 'Departman', label: 'Departman' },
                                    { value: 'Müdürlük', label: 'Müdürlük' },
                                    { value: 'Şube', label: 'Şube' },
                                    { value: 'Servis', label: 'Servis' }
                                ]}
                            />
                        </div>

                        <div>
                            <CustomSelect
                                label="Denetim Döngüsü"
                                value={formData.auditCycle}
                                onChange={(val) => setFormData({ ...formData, auditCycle: String(val) })}
                                options={[
                                    { value: '6 Ay', label: 'Her 6 Ayda Bir' },
                                    { value: '1 Yıl', label: 'Her Yıl Düzenli' },
                                    { value: '2 Yıl', label: '2 Yılda Bir' },
                                    { value: '3 Yıl', label: '3 Yılda Bir' },
                                ]}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mevcut Risk Skoru</label>
                            <input
                                type="number"
                                step="0.1"
                                placeholder="Örn: 8.5"
                                className="form-input"
                                value={formData.riskScore}
                                onChange={e => setFormData({ ...formData, riskScore: e.target.value })}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Birim Açıklaması / Misyonu (Opsiyonel)</label>
                            <textarea
                                rows={3}
                                placeholder="Birimin görev alanını ve sorumluluklarını kısaca açıklayın..."
                                className="form-input resize-none"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-100">
                        <Button
                            variant="secondary"
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                        >
                            İptal
                        </Button>
                        <Button type="submit">
                            {modalMode === 'create' ? 'Kaydet' : 'Güncelle'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={confirmDelete}
                title="Birimi Sil"
                message="Bu birimi ve ona bağlı tüm alt birimleri silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
                confirmText="Evet, Sil"
                cancelText="İptal"
                type="danger"
            />

        </div>
    );
}
