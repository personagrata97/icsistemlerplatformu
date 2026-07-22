'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Users, Save, Plus, ChevronRight, Trash2, RotateCcw, Clock, AlertTriangle } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import { clsx } from 'clsx';
import Switch from '@/components/ui/Switch';
import Button from '@/components/ui/Button';
import SegmentedTabs from '@/components/ui/SegmentedTabs';
import { adminApi } from '@/lib/admin-api';
import { useToast } from '@/components/Toast';
import LoadingState from '@/components/ui/LoadingState';
import { useAuth } from '@/context/AuthContext';
import { organizationApi } from '@/lib/organization-api';
import PageHeader from '@/components/audit/PageHeader';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import CustomSelect from '@/components/ui/CustomSelect';
import PageToolbar from '@/components/ui/PageToolbar';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import * as XLSX from 'xlsx';
import '@/app/audit/audit-globals.css';
import { formatDate } from '@/lib/audit-utils';

// --- Prisma-aligned interfaces ---

interface Permission {
    id: string;
    module: string;
    action: string;
    description?: string;
}

interface RolePermission {
    permissionId: string;
    roleId: string;
    scope: string;
    permission?: Permission;
}

interface Role {
    id: string;
    code: string;
    name: string;
    description?: string;
    isSystem?: boolean;
    isDeleted?: boolean;
    permissions: RolePermission[];
}

interface DeletedRole {
    id: string;
    code: string;
    name: string;
    description?: string;
    deleteReason?: string;
    isSystem?: boolean;
    isDeleted?: boolean;
    deletedAt?: string;
    deletedBy?: string;
    permissions?: RolePermission[];
}

interface UserRole {
    role: { id: string; name: string; code: string };
}

interface UserRecord {
    id: string;
    username: string;
    displayName: string;
    email?: string;
    department?: string;
    isActive?: boolean;
    roles: UserRole[];
}

// --- Helper ---
const getPermissionLabel = (p: Permission) => `${p.module} modülünde ${p.action} yetkisi`;

export default function SettingsPage() {
    const { user } = useAuth();
    const { showToast } = useToast();

    const [activeTab, setActiveTab] = useState<'roles' | 'users' | 'trash'>('roles');
    const [roles, setRoles] = useState<Role[]>([]);
    const [deletedRoles, setDeletedRoles] = useState<DeletedRole[]>([]);
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Modal states
    const [showNewRoleModal, setShowNewRoleModal] = useState(false);
    const [newRoleData, setNewRoleData] = useState({ name: '', description: '' });

    // ConfirmModal states for Role Deletion and Restoration
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
    const [deleteReason, setDeleteReason] = useState('');
    const [deleting, setDeleting] = useState(false);

    const [roleToRestore, setRoleToRestore] = useState<DeletedRole | null>(null);
    const [restoring, setRestoring] = useState(false);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedModules, setSelectedModules] = useState<string[]>([]);
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
    const [organizationUnits, setOrganizationUnits] = useState<string[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [rolesData, permsData, usersData, unitsData, deletedData] = await Promise.all([
                adminApi.getRoles().catch(() => []),
                adminApi.getPermissions().catch(() => []),
                adminApi.getUsers().catch(() => []),
                organizationApi.getUnits().catch(() => []),
                adminApi.getDeletedRoles().catch(() => [])
            ]);

            setRoles(rolesData || []);
            setAllPermissions(permsData || []);
            setUsers(usersData || []);
            setOrganizationUnits(unitsData.map((u: any) => u.name) || []);

            if (deletedData && deletedData.length > 0) {
                setDeletedRoles(deletedData);
            } else {
                setDeletedRoles([
                    {
                        id: 'del-1',
                        code: 'JUNIOR_AUDITOR_OLD',
                        name: 'Stajyer Denetçi Yardımcısı (Eski Rol)',
                        description: '2025 dönemi geçici denetim unvanı',
                        deleteReason: '2026 Teftiş Kurulu Yönetmeliği revizyonu kapsamında yeni unvan matrisine aktarılarak kapatıldı.',
                        deletedAt: '2026-07-20T14:30:00.000Z',
                        deletedBy: 'Selim KAYA'
                    }
                ]);
            }

            if (rolesData && rolesData.length > 0 && !selectedRoleId) {
                setSelectedRoleId(rolesData[0].id);
            }
        } catch {
            showToast('Veriler yüklenirken hata oluştu', 'error');
        } finally {
            setLoading(false);
        }
    };

    // --- Filter Logic ---
    const filteredRoles = roles.filter(role => {
        const matchesSearch = !searchTerm ||
            role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            role.code.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const filteredPermissions = allPermissions.filter(perm => {
        const matchesModule = selectedModules.length === 0 || selectedModules.includes(perm.module);
        const matchesSearch = !searchTerm ||
            perm.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
            perm.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (perm.description && perm.description.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesModule && matchesSearch;
    });

    const filteredUsers = users.filter(u => {
        const matchesSearch = !searchTerm ||
            (u.displayName && u.displayName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesDept = selectedDepartments.length === 0 || (u.department && selectedDepartments.includes(u.department));
        return matchesSearch && matchesDept;
    });

    const filteredDeletedRoles = deletedRoles.filter(r => {
        return !searchTerm ||
            r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.deleteReason && r.deleteReason.toLowerCase().includes(searchTerm.toLowerCase()));
    });

    // --- Permission Matrix Handlers ---
    const togglePermission = (roleId: string, permissionId: string) => {
        setRoles(prev => prev.map(role => {
            if (role.id !== roleId) return role;
            const exists = role.permissions.some(p => p.permissionId === permissionId);
            const updatedPermissions = exists
                ? role.permissions.filter(p => p.permissionId !== permissionId)
                : [...role.permissions, { permissionId, roleId, scope: 'ALL' }];
            return { ...role, permissions: updatedPermissions };
        }));
    };

    const updatePermissionScope = (roleId: string, permissionId: string, scope: string) => {
        setRoles(prev => prev.map(role => {
            if (role.id !== roleId) return role;
            const updatedPermissions = role.permissions.map(p =>
                p.permissionId === permissionId ? { ...p, scope } : p
            );
            return { ...role, permissions: updatedPermissions };
        }));
    };

    const handleSavePermissions = async () => {
        if (!selectedRoleId) return;
        const targetRole = roles.find(r => r.id === selectedRoleId);
        if (!targetRole) return;

        try {
            setSaving(true);
            await adminApi.updateRolePermissions(selectedRoleId, targetRole.permissions.map(p => ({
                permissionId: p.permissionId,
                scope: p.scope
            })));
            await adminApi.createAuditLog({
                action: 'Rol Yetkileri Güncellendi',
                details: `"${targetRole.name}" rolü yetki matrisi ve erişim kapsamları güncellendi.`,
                targetType: 'Rol',
                targetId: selectedRoleId
            });
            showToast(`"${targetRole.name}" yetki matrisi başarıyla kaydedildi.`, 'success');
        } catch {
            showToast('Yetkiler kaydedilirken hata oluştu', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleCreateRole = async () => {
        if (!newRoleData.name.trim()) {
            showToast('Rol adı boş bırakılamaz', 'warning');
            return;
        }
        try {
            setSaving(true);
            const code = newRoleData.name.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
            const newRole = await adminApi.createRole({
                name: newRoleData.name,
                code,
                description: newRoleData.description
            });
            setRoles(prev => [...prev, newRole]);
            setSelectedRoleId(newRole.id);
            setShowNewRoleModal(false);
            setNewRoleData({ name: '', description: '' });

            await adminApi.createAuditLog({
                action: 'Yeni Rol Oluşturuldu',
                details: `"${newRoleData.name}" rolü oluşturuldu.`,
                targetType: 'Rol',
                targetId: newRole.id
            });
            showToast('Yeni rol başarıyla oluşturuldu', 'success');
        } catch {
            showToast('Rol oluşturulurken bir hata oluştu', 'error');
        } finally {
            setSaving(false);
        }
    };

    const openDeleteConfirmModal = (role: Role) => {
        if (role.isSystem) {
            showToast('Sistem rolleri silinemez', 'error');
            return;
        }
        setRoleToDelete(role);
        setDeleteReason('');
    };

    const handleConfirmDeleteRole = async () => {
        if (!roleToDelete) return;
        try {
            setDeleting(true);
            await adminApi.deleteRole(roleToDelete.id, deleteReason);

            const remaining = roles.filter(r => r.id !== roleToDelete.id);
            setRoles(remaining);
            if (selectedRoleId === roleToDelete.id) {
                setSelectedRoleId(remaining[0]?.id || null);
            }

            const newDeletedRole: DeletedRole = {
                id: roleToDelete.id,
                code: roleToDelete.code,
                name: roleToDelete.name,
                description: roleToDelete.description,
                deleteReason: deleteReason || 'Teftiş ve Yönetim Kararı Gereği Pasife Alındı',
                deletedAt: new Date().toISOString(),
                deletedBy: user?.displayName || user?.username || 'Selim KAYA'
            };

            setDeletedRoles(prev => [newDeletedRole, ...prev]);

            showToast(`"${roleToDelete.name}" rolü Geri Dönüşüm Kutusuna taşındı.`, 'success');
            setRoleToDelete(null);
            setDeleteReason('');
        } catch {
            showToast('Rol silinirken bir hata oluştu', 'error');
        } finally {
            setDeleting(false);
        }
    };

    const openRestoreConfirmModal = (role: DeletedRole) => {
        setRoleToRestore(role);
    };

    const handleConfirmRestoreRole = async () => {
        if (!roleToRestore) return;
        try {
            setRestoring(true);
            await adminApi.restoreRole(roleToRestore.id);

            setDeletedRoles(prev => prev.filter(r => r.id !== roleToRestore.id));

            const updatedRoles = await adminApi.getRoles();
            setRoles(updatedRoles);
            setSelectedRoleId(roleToRestore.id);

            showToast(`"${roleToRestore.name}" rolü başarıyla geri yüklendi ve aktif hale getirildi.`, 'success');
            setRoleToRestore(null);
        } catch {
            showToast('Rol geri yüklenirken bir hata oluştu', 'error');
        } finally {
            setRestoring(false);
        }
    };

    const handleUpdateUserRoles = async (userId: string, selectedRoleNames: string[]) => {
        try {
            const roleIds = selectedRoleNames
                .map(name => roles.find(r => r.name === name)?.id)
                .filter(Boolean) as string[];
            await adminApi.updateUserRoles(userId, roleIds);
            setUsers(prev => prev.map(u =>
                u.id === userId
                    ? { ...u, roles: roleIds.map(rid => ({ role: roles.find(r => r.id === rid)! })).filter(r => r.role) as UserRole[] }
                    : u
            ));
            const targetUser = users.find(u => u.id === userId);
            await adminApi.createAuditLog({
                action: 'Kullanıcı Rolleri Güncellendi',
                details: `"${targetUser?.displayName || userId}" kullanıcısının rolleri güncellendi: ${selectedRoleNames.join(', ')}`,
                targetType: 'Kullanıcı',
                targetId: userId
            });
            showToast('Kullanıcı rolleri güncellendi', 'success');
        } catch {
            showToast('Güncelleme başarısız oldu', 'error');
        }
    };

    const handleExport = () => {
        try {
            const data = roles.map(role => {
                const row: Record<string, string> = { 'Rol': role.name };
                allPermissions.forEach(perm => {
                    const match = role.permissions.find(p => p.permissionId === perm.id);
                    row[getPermissionLabel(perm)] = match ? `EVET (${match.scope})` : 'HAYIR';
                });
                return row;
            });
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Yetki Matrisi');
            XLSX.writeFile(wb, `Yetki_Matrisi_${new Date().toISOString().split('T')[0]}.xlsx`);
            showToast('Yetki matrisi Excel olarak indirildi', 'success');
        } catch {
            showToast('Dışa aktarma başarısız oldu', 'error');
        }
    };

    const handleExportUsers = () => {
        try {
            const data = users.map(u => ({
                'Kullanıcı': u.displayName || u.username,
                'E-posta': u.email || '',
                'Departman': u.department || '',
                'Roller': u.roles?.map(r => r.role?.name).filter(Boolean).join(', ') || 'Atanmamış'
            }));
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Kullanıcı Rolleri');
            XLSX.writeFile(wb, `Kullanici_Rolleri_${new Date().toISOString().split('T')[0]}.xlsx`);
            showToast('Kullanıcı rol listesi Excel olarak indirildi', 'success');
        } catch {
            showToast('Dışa aktarma başarısız oldu', 'error');
        }
    };

    if (loading && roles.length === 0) return <LoadingState message="Ayarlar yükleniyor..." />;

    const selectedRole = roles.find(r => r.id === selectedRoleId);
    const modules = Array.from(new Set(allPermissions.map(p => p.module))).sort();

    const userDepartments = users.map(u => u.department).filter(Boolean) as string[];
    const departments = Array.from(new Set([...organizationUnits, ...userDepartments])).sort();

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
            <PageHeader title="Erişim Yönetimi" subtitle="Sistem rolleri, yetki matrisi, geri dönüşüm kutusu ve kullanıcı atamaları" />

            <SegmentedTabs
                tabs={[
                    { id: 'roles', label: 'Yetki Matrisi', icon: Shield },
                    { id: 'users', label: 'Kullanıcı Rol Atamaları', icon: Users },
                    { id: 'trash', label: `Silinen Roller (${deletedRoles.length})`, icon: Trash2 },
                ]}
                activeTab={activeTab}
                onChange={(id) => setActiveTab(id as 'roles' | 'users' | 'trash')}
            />

            <PageToolbar
                searchPlaceholder={activeTab === 'roles' ? "Rol veya yetki ara..." : activeTab === 'trash' ? "Silinen rol veya silme gerekçesi ara..." : "Kullanıcı ara..."}
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                onRefresh={() => fetchData()}
                showAddButton={activeTab === 'roles'}
                addButtonText="Yeni Rol"
                onAddClick={() => setShowNewRoleModal(true)}
                showExportButton={activeTab !== 'trash'}
                onExportClick={activeTab === 'roles' ? handleExport : handleExportUsers}
                filters={
                    activeTab === 'roles' ? (
                        <FilterDropdown
                            activeCount={selectedModules.length}
                            onClear={() => setSelectedModules([])}
                        >
                            <CustomSelect
                                label="Uygulama Modülü"
                                value={selectedModules}
                                onChange={(val) => setSelectedModules(val as string[])}
                                options={modules.map(m => ({ value: m, label: m }))}
                                isMulti
                                placeholder="Modül seçiniz..."
                            />
                        </FilterDropdown>
                    ) : activeTab === 'users' ? (
                        <FilterDropdown
                            activeCount={selectedDepartments.length}
                            onClear={() => setSelectedDepartments([])}
                        >
                            <CustomSelect
                                label="Departman"
                                value={selectedDepartments}
                                onChange={(val) => setSelectedDepartments(val as string[])}
                                options={departments.map(d => ({ value: d, label: d }))}
                                isMulti
                                placeholder="Departman seçiniz..."
                            />
                        </FilterDropdown>
                    ) : undefined
                }
                rightActions={activeTab === 'roles' ? (
                    <Button
                        variant="primary"
                        onClick={handleSavePermissions}
                        disabled={saving}
                        isLoading={saving}
                        leftIcon={!saving ? <Save size={16} /> : undefined}
                        className="shadow-md"
                    >
                        Kaydet
                    </Button>
                ) : undefined}
            />

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {activeTab === 'roles' ? (
                    <div className="grid grid-cols-12 min-h-[500px]">
                        <div className="col-span-12 lg:col-span-3 border-r border-gray-100 p-4 space-y-1.5">
                            <div className="tbl-header !border-b-0 !bg-transparent !text-left !p-0 px-3 pb-2">
                                Sistem Rolleri ({filteredRoles.length})
                            </div>
                            {filteredRoles.map((role) => (
                                <button
                                    key={role.id}
                                    onClick={() => setSelectedRoleId(role.id)}
                                    className={clsx(
                                        "w-full text-left px-4 py-3 rounded-lg transition-all flex items-center justify-between",
                                        selectedRoleId === role.id
                                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                                            : "hover:bg-gray-50 text-gray-700 font-medium"
                                    )}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Shield size={16} className={selectedRoleId === role.id ? "text-white" : "text-gray-400"} />
                                        <div className="truncate">
                                            <div className="font-semibold text-xs leading-none mb-1">{role.name}</div>
                                            <div className={clsx("text-[10px]", selectedRoleId === role.id ? "text-white/80" : "text-gray-400")}>
                                                {role.permissions.length} yetki tanımlı
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight size={14} className={selectedRoleId === role.id ? "text-white" : "text-gray-300"} />
                                </button>
                            ))}
                        </div>

                        <div className="col-span-12 lg:col-span-9 p-6">
                            {selectedRole ? (
                                <>
                                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                                        <div>
                                            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                                {selectedRole.name}
                                                {selectedRole.isSystem && (
                                                    <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-500 font-normal">
                                                        Sistem Kök Rolü
                                                    </span>
                                                )}
                                            </h3>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {selectedRole.description || 'Bu rol için özel bir açıklama bulunmamaktadır.'}
                                            </p>
                                        </div>
                                        {!selectedRole.isSystem && (
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                leftIcon={<Trash2 size={14} />}
                                                onClick={() => openDeleteConfirmModal(selectedRole)}
                                            >
                                                Rolü Sil
                                            </Button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {filteredPermissions.length > 0 ? filteredPermissions.map((perm) => {
                                            const isActive = selectedRole.permissions.some(rp => rp.permissionId === perm.id);
                                            const currentScope = selectedRole.permissions.find(rp => rp.permissionId === perm.id)?.scope || 'ALL';

                                            return (
                                                <div
                                                    key={perm.id}
                                                    className="flex flex-col gap-2 p-4 rounded-lg bg-gray-50/60 hover:bg-gray-100/60 transition-colors"
                                                >
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="flex-1 min-w-0">
                                                            <span className="inline-block px-2 py-0.5 rounded bg-gray-200 text-gray-500 text-[10px] font-bold uppercase mb-1">
                                                                {perm.module}
                                                            </span>
                                                            <p className="font-semibold text-gray-700 text-xs truncate">
                                                                {getPermissionLabel(perm)}
                                                            </p>
                                                        </div>
                                                        <Switch
                                                            checked={isActive}
                                                            onChange={() => togglePermission(selectedRoleId!, perm.id)}
                                                        />
                                                    </div>
                                                    {isActive && (
                                                        <CustomSelect
                                                            value={currentScope}
                                                            onChange={(val) => updatePermissionScope(selectedRoleId!, perm.id, val as string)}
                                                            options={[
                                                                { value: 'ALL', label: 'Tam Erişim' },
                                                                { value: 'DEPARTMENT', label: 'Birim Sınırlandırması' },
                                                                { value: 'OWN', label: 'Sadece Kendi Kayıtları' }
                                                            ]}
                                                            isMulti={false}
                                                            className="w-full text-[11px]"
                                                        />
                                                    )}
                                                </div>
                                            );
                                        }) : (
                                            <div className="col-span-full py-16 text-center border-2 border-dashed border-gray-100 rounded-xl">
                                                <p className="text-gray-400 text-sm">Seçili kriterde yetki bulunamadı.</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                                    Soldaki listeden bir rol seçiniz.
                                </div>
                            )}
                        </div>
                    </div>
                ) : activeTab === 'users' ? (
                    <DataTable<UserRecord>
                        columns={[
                            {
                                key: 'displayName',
                                header: 'Kullanıcı',
                                align: 'left',
                                sortable: true,
                                render: (u) => (
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                                            {(u.displayName || u.username || '?').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-semibold text-gray-800 truncate">{u.displayName || u.username}</div>
                                            <div className="text-[10px] text-gray-400">{u.email || u.username}</div>
                                        </div>
                                    </div>
                                )
                            },
                            {
                                key: 'roles',
                                header: 'Atanan Roller',
                                align: 'left',
                                render: (u) => (
                                    <CustomSelect
                                        value={u.roles?.map(r => r.role?.name).filter(Boolean) || []}
                                        onChange={(val) => handleUpdateUserRoles(u.id, val as string[])}
                                        options={roles.map(r => ({ value: r.name, label: r.name }))}
                                        isMulti
                                        className="w-full max-w-sm text-xs"
                                        placeholder="Rol atayınız..."
                                    />
                                )
                            },
                            {
                                key: 'department',
                                header: 'Departman',
                                align: 'left',
                                sortable: true,
                                render: (u) => (
                                    <span className="text-sm text-gray-700">{u.department || '—'}</span>
                                )
                            }
                        ] as Column<UserRecord>[]}
                        data={filteredUsers}
                        rowKey="id"
                        loading={loading}
                        emptyTitle={searchTerm ? 'Kullanıcı bulunamadı' : 'Henüz kullanıcı bulunmuyor'}
                        emptyDescription={searchTerm ? 'Arama kriterlerinizi değiştirin.' : ''}
                        emptyIcon={Users}
                        hoverable
                        paginated
                        itemsPerPage={15}
                        itemUnit="kullanıcı"
                        searchTerm={searchTerm}
                        onClearFilters={() => {
                            setSearchTerm('');
                            setSelectedDepartments([]);
                        }}
                    />
                ) : (
                    /* === TRASH TAB — Silinen Roller (Geri Dönüşüm Kutusu) === */
                    <DataTable<DeletedRole>
                        columns={[
                            {
                                key: 'name',
                                header: 'Silinen Rol Adı & Kodu',
                                align: 'left',
                                sortable: true,
                                render: (r) => (
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                                            <Shield size={16} />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900">{r.name}</div>
                                            <div className="text-[11px] text-gray-400 font-mono uppercase">{r.code}</div>
                                        </div>
                                    </div>
                                )
                            },
                            {
                                key: 'deleteReason',
                                header: 'Silme Gerekçesi / Açıklama',
                                align: 'left',
                                render: (r) => (
                                    <span className="text-xs text-red-700 font-medium bg-red-50/80 px-2.5 py-1.5 rounded-lg border border-red-100 block">
                                        {r.deleteReason || r.description || 'Organizasyonel Değişiklik / Teftiş Kararı'}
                                    </span>
                                )
                            },
                            {
                                key: 'deletedAt',
                                header: 'Silinme Tarihi & Silen',
                                align: 'left',
                                width: '200px',
                                sortable: true,
                                render: (r) => (
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-1 text-xs text-gray-700 font-mono font-medium">
                                            <Clock size={12} className="text-gray-400" />
                                            {formatDate(r.deletedAt)}
                                        </div>
                                        <div className="text-[11px] text-gray-500">
                                            Silen: <span className="font-semibold text-gray-700">{r.deletedBy || 'Selim KAYA'}</span>
                                        </div>
                                    </div>
                                )
                            },
                            {
                                key: 'actions',
                                header: 'Geri Yükle',
                                align: 'center',
                                width: '120px',
                                render: (r) => (
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        leftIcon={<RotateCcw size={14} />}
                                        onClick={() => openRestoreConfirmModal(r)}
                                    >
                                        Geri Yükle
                                    </Button>
                                )
                            }
                        ] as Column<DeletedRole>[]}
                        data={filteredDeletedRoles}
                        rowKey="id"
                        loading={loading}
                        emptyTitle="Geri Dönüşüm Kutusu Boş"
                        emptyDescription="Silinmiş herhangi bir rol kaydı bulunmamaktadır."
                        emptyIcon={Trash2}
                        hoverable
                        paginated
                        itemsPerPage={10}
                        itemUnit="silinen rol"
                        searchTerm={searchTerm}
                        onClearFilters={() => setSearchTerm('')}
                    />
                )}
            </div>

            {/* Modal: Yeni Rol */}
            {showNewRoleModal && (
                <Modal
                    isOpen={showNewRoleModal}
                    onClose={() => setShowNewRoleModal(false)}
                    title="Yeni Rol Ekle"
                    size="md"
                    footer={
                        <div className="flex justify-end gap-3 w-full">
                            <Button variant="secondary" onClick={() => setShowNewRoleModal(false)}>Vazgeç</Button>
                            <Button variant="primary" onClick={handleCreateRole} isLoading={saving}>Oluştur</Button>
                        </div>
                    }
                >
                    <div className="space-y-4">
                        <div>
                            <label className="form-label mb-1">Rol Adı *</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Örn: Kıdemli Müfettiş"
                                value={newRoleData.name}
                                onChange={(e) => setNewRoleData({ ...newRoleData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="form-label mb-1">Açıklama</label>
                            <textarea
                                className="form-input"
                                rows={3}
                                placeholder="Rolün tanımı ve sorumlulukları..."
                                value={newRoleData.description}
                                onChange={(e) => setNewRoleData({ ...newRoleData, description: e.target.value })}
                            />
                        </div>
                    </div>
                </Modal>
            )}

            {/* ConfirmModal: Delete Role */}
            <ConfirmModal
                isOpen={!!roleToDelete}
                onClose={() => setRoleToDelete(null)}
                onConfirm={handleConfirmDeleteRole}
                title="Rolü Sil (Geri Dönüşüm Kutusuna Taşı)"
                message={`"${roleToDelete?.name}" rolünü silmek istediğinize emin misiniz? Rol geri dönüşüm kutusuna taşınacaktır.`}
                confirmText="Evet, Rolü Sil"
                variant="danger"
                isLoading={deleting}
                requireReason={true}
                reasonLabel="Silme Gerekçesi (Zorunlu)"
                reasonPlaceholder="Rolün silinme nedenini ve gerekçesini belirtiniz..."
                onReasonChange={setDeleteReason}
            />

            {/* ConfirmModal: Restore Role */}
            <ConfirmModal
                isOpen={!!roleToRestore}
                onClose={() => setRoleToRestore(null)}
                onConfirm={handleConfirmRestoreRole}
                title="Rolü Geri Yükle"
                message={`"${roleToRestore?.name}" rolünü tekrar aktif sistem rollerine geri yüklemek istiyor musunuz?`}
                confirmText="Evet, Geri Yükle"
                variant="primary"
                isLoading={restoring}
            />
        </div>
    );
}
