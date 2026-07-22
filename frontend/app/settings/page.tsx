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

    // Filtering
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedModules, setSelectedModules] = useState<string[]>([]);
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
    const [organizationUnits, setOrganizationUnits] = useState<string[]>([]);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            
            const flattenUnits = (units: any[]): string[] => {
                let list: string[] = [];
                for (const u of units) {
                    if (u.name) list.push(u.name);
                    if (u.children && Array.isArray(u.children)) {
                        list = list.concat(flattenUnits(u.children));
                    }
                }
                return list;
            };

            const [rolesData, permsData, usersData, orgData, deletedRolesData] = await Promise.all([
                adminApi.getRoles(),
                adminApi.getPermissions(),
                adminApi.getUsers(),
                organizationApi.getTree().catch(() => []),
                adminApi.getDeletedRoles().catch(() => [])
            ]);
            
            setRoles(rolesData);
            setAllPermissions(permsData);
            setUsers(usersData);
            setDeletedRoles(deletedRolesData);
            
            const allUnits = flattenUnits(orgData);
            setOrganizationUnits(Array.from(new Set(allUnits)).sort());

            if (rolesData.length > 0 && !selectedRoleId) {
                setSelectedRoleId(rolesData[0].id);
            }
        } catch (error) {
            console.error('Settings fetch error:', error);
            showToast('Veriler yüklenirken bir hata oluştu', 'error');
        } finally {
            setLoading(false);
        }
    };

    // --- Permission logic ---
    const togglePermission = (roleId: string, permissionId: string) => {
        setRoles(prev => prev.map(role => {
            if (role.id !== roleId) return role;
            const exists = role.permissions.some(p => p.permissionId === permissionId);
            const updatedPerms = exists
                ? role.permissions.filter(p => p.permissionId !== permissionId)
                : [...role.permissions, { permissionId, roleId, scope: 'ALL' }];
            return { ...role, permissions: updatedPerms };
        }));
    };

    const handleToggleAllPermissions = (roleId: string) => {
        const role = roles.find(r => r.id === roleId);
        if (!role) return;
        const allActive = role.permissions.length >= allPermissions.length;
        const newPerms = allActive ? [] : allPermissions.map(p => ({ permissionId: p.id, roleId, scope: 'ALL' as string }));
        setRoles(prev => prev.map(r => r.id === roleId ? { ...r, permissions: newPerms } : r));
        showToast(allActive ? 'Tüm yetkiler kaldırıldı' : 'Tüm yetkiler atandı', 'success');
    };

    const updatePermissionScope = (roleId: string, permissionId: string, scope: string) => {
        setRoles(prev => prev.map(role => {
            if (role.id !== roleId) return role;
            return { ...role, permissions: role.permissions.map(p => p.permissionId === permissionId ? { ...p, scope } : p) };
        }));
    };

    // --- Save ---
    const handleSavePermissions = async () => {
        try {
            setSaving(true);
            await Promise.all(roles.map(role =>
                adminApi.updateRolePermissions(role.id, role.permissions.map(p => ({ permissionId: p.permissionId, scope: p.scope })))
            ));
            await adminApi.createAuditLog({
                action: 'Yetki Matrisi Güncellendi',
                details: `${roles.length} rol için yetki matrisi güncellendi.`,
                targetType: 'Ayarlar',
                targetId: 'yetki-matrisi'
            });
            showToast('Yetki matrisi başarıyla güncellendi', 'success');
        } catch {
            showToast('Kayıt sırasında bir hata oluştu', 'error');
        } finally {
            setSaving(false);
        }
    };

    // --- Create Role ---
    const handleCreateRole = async () => {
        if (!newRoleData.name.trim()) return;
        try {
            setSaving(true);
            const code = newRoleData.name.toUpperCase()
                .replace(/İ/g, 'I').replace(/Ş/g, 'S').replace(/Ğ/g, 'G')
                .replace(/Ü/g, 'U').replace(/Ö/g, 'O').replace(/Ç/g, 'C')
                .replace(/[^A-Z0-9]/g, '_').replace(/_+/g, '_');
            const newRole = await adminApi.createRole({ code, name: newRoleData.name, description: newRoleData.description });
            setRoles(prev => [...prev, { ...newRole, permissions: newRole.permissions || [] }]);
            setSelectedRoleId(newRole.id);
            setShowNewRoleModal(false);
            setNewRoleData({ name: '', description: '' });
            
            await adminApi.createAuditLog({
                action: 'Rol Oluşturuldu',
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

    // --- Soft Delete Role with ConfirmModal ---
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
            
            // Remove from active roles list
            const remaining = roles.filter(r => r.id !== roleToDelete.id);
            setRoles(remaining);
            if (selectedRoleId === roleToDelete.id) {
                setSelectedRoleId(remaining[0]?.id || null);
            }

            // Fetch refreshed deleted roles list
            const updatedDeleted = await adminApi.getDeletedRoles().catch(() => []);
            setDeletedRoles(updatedDeleted);

            showToast(`"${roleToDelete.name}" rolü Geri Dönüşüm Kutusuna taşındı.`, 'success');
            setRoleToDelete(null);
            setDeleteReason('');
        } catch {
            showToast('Rol silinirken bir hata oluştu', 'error');
        } finally {
            setDeleting(false);
        }
    };

    // --- Restore Role with ConfirmModal ---
    const openRestoreConfirmModal = (role: DeletedRole) => {
        setRoleToRestore(role);
    };

    const handleConfirmRestoreRole = async () => {
        if (!roleToRestore) return;
        try {
            setRestoring(true);
            await adminApi.restoreRole(roleToRestore.id);
            
            // Remove from deleted list
            setDeletedRoles(prev => prev.filter(r => r.id !== roleToRestore.id));
            
            // Fetch updated active roles list
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

    // --- Update User Roles ---
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

    // --- Excel Export ---
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

    // --- Excel Export (Users) ---
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
            XLSX.utils.book_append_sheet(wb, ws, 'Kullanıcı Rol Atamaları');
            XLSX.writeFile(wb, `Kullanici_Roller_${new Date().toISOString().split('T')[0]}.xlsx`);
            showToast('Kullanıcı-rol listesi Excel olarak indirildi', 'success');
        } catch {
            showToast('Dışa aktarma başarısız oldu', 'error');
        }
    };

    // --- Filters ---
    const lc = (s?: string) => (s || '').toLocaleLowerCase('tr-TR');
    const term = lc(searchTerm);

    const filteredRoles = roles.filter(r => lc(r.name).includes(term));
    const filteredDeletedRoles = deletedRoles.filter(r => lc(r.name).includes(term) || lc(r.code).includes(term));
    const filteredUsers = users.filter(u => {
        const matchSearch = lc(u.displayName).includes(term) || lc(u.email).includes(term) || lc(u.username).includes(term);
        const matchDept = selectedDepartments.length === 0 || selectedDepartments.includes(u.department || '');
        return matchSearch && matchDept;
    });
    const filteredPermissions = allPermissions.filter(p => {
        const matchSearch = lc(getPermissionLabel(p)).includes(term) || lc(p.module).includes(term) || lc(p.action).includes(term);
        const matchModule = selectedModules.length === 0 || selectedModules.includes(p.module);
        return matchSearch && matchModule;
    });

    // --- Guards ---
    if (!user) return null;

    // Yetki kontrolü: ADMIN:VIEW yetkisi veya yönetici rolü gerekli
    const canAccessSettings = user.roles?.includes('ADMIN') || 
                              user.roles?.includes('SYSTEM_ADMIN') || 
                              user.roles?.includes('AUDIT_ADMIN') ||
                              user.permissions?.some(p => p.module === 'ADMIN' && (p.action === 'VIEW' || p.action === 'ALL'));

    if (!canAccessSettings) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4">
                    <div className="mx-auto w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center">
                        <Shield className="h-10 w-10 text-red-300" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-700">Erişim Yetkiniz Bulunmuyor</h2>
                    <p className="text-gray-500 text-sm max-w-md">
                        Bu sayfaya erişmek için yönetici yetkisi gereklidir. 
                        Yetki talep etmek için sistem yöneticinize başvurunuz.
                    </p>
                </div>
            </div>
        );
    }

    if (loading && roles.length === 0) return <LoadingState message="Ayarlar yükleniyor..." />;

    const selectedRole = roles.find(r => r.id === selectedRoleId);
    const modules = Array.from(new Set(allPermissions.map(p => p.module))).sort();
    
    const userDepartments = users.map(u => u.department).filter(Boolean) as string[];
    const departments = Array.from(new Set([...organizationUnits, ...userDepartments])).sort();

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
                <PageHeader title="Erişim Yönetimi" subtitle="Sistem rolleri, yetki matrisi, geri dönüşüm kutusu ve kullanıcı atamaları" />

                {/* Tabs */}
                <SegmentedTabs
                    tabs={[
                        { id: 'roles', label: 'Yetki Matrisi', icon: Shield },
                        { id: 'users', label: 'Kullanıcı Rol Atamaları', icon: Users },
                        { id: 'trash', label: `Silinen Roller (${deletedRoles.length})`, icon: Trash2 },
                    ]}
                    activeTab={activeTab}
                    onChange={(id) => setActiveTab(id as 'roles' | 'users' | 'trash')}
                />

                {/* Toolbar */}
                <PageToolbar
                    searchPlaceholder={activeTab === 'roles' ? "Rol veya yetki ara..." : activeTab === 'trash' ? "Silinen rol ara..." : "Kullanıcı ara..."}
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

                {/* Content Card */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    {activeTab === 'roles' ? (
                        <div className="grid grid-cols-12 min-h-[500px]">
                            {/* MASTER: Role List */}
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
                                                : "hover:bg-gray-50 text-gray-600"
                                        )}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <Shield size={14} className={selectedRoleId === role.id ? "text-white/80" : "text-gray-400"} />
                                            <span className="font-semibold text-sm truncate">{role.name}</span>
                                        </div>
                                        <ChevronRight size={14} className={clsx("shrink-0 opacity-50", selectedRoleId === role.id && "text-white")} />
                                    </button>
                                ))}
                                {filteredRoles.length === 0 && (
                                    <div className="text-center text-gray-400 text-xs py-8">Rol bulunamadı</div>
                                )}
                            </div>

                            {/* DETAIL: Permission Matrix */}
                            <div className="col-span-12 lg:col-span-9 p-6">
                                {selectedRole ? (
                                    <>
                                        {/* Role Header */}
                                        <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-100">
                                            <div>
                                                <h3 className="cell-title text-lg">{selectedRole.name}</h3>
                                                <p className="cell-subtitle uppercase tracking-wide">{selectedRole.code}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {!selectedRole.isSystem && (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        onClick={() => openDeleteConfirmModal(selectedRole)}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 size={16} className="mr-1.5" />
                                                        Rolü Sil
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => handleToggleAllPermissions(selectedRoleId!)}
                                                >
                                                    Tümünü Aç/Kapat
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Permission Grid */}
                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-6 gap-y-3">
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
                        /* === USERS TAB — Merkezi DataTable === */
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
                                    header: 'Rol Bilgisi',
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
                                    key: 'description',
                                    header: 'Açıklama',
                                    align: 'left',
                                    render: (r) => (
                                        <span className="text-xs text-gray-600">{r.description || '—'}</span>
                                    )
                                },
                                {
                                    key: 'deletedAt',
                                    header: 'Silinme Tarihi & Silen',
                                    align: 'left',
                                    sortable: true,
                                    render: (r) => (
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-1 text-xs text-gray-700 font-medium">
                                                <Clock size={12} className="text-gray-400" />
                                                {r.deletedAt ? new Date(r.deletedAt).toLocaleString('tr-TR') : '—'}
                                            </div>
                                            <div className="text-[11px] text-gray-400">
                                                Silen: <span className="font-semibold text-gray-600">{r.deletedBy || 'Sistem Yöneticisi'}</span>
                                            </div>
                                        </div>
                                    )
                                },
                                {
                                    key: 'status',
                                    header: 'Durum',
                                    align: 'center',
                                    render: () => (
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                            Silindi / Pasif
                                        </span>
                                    )
                                },
                                {
                                    key: 'actions',
                                    header: 'İşlem',
                                    align: 'right',
                                    render: (r) => (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => openRestoreConfirmModal(r)}
                                            leftIcon={<RotateCcw size={14} />}
                                            className="text-primary hover:bg-primary/10 border-primary/20 shadow-none"
                                        >
                                            Geri Yükle
                                        </Button>
                                    )
                                }
                            ] as Column<DeletedRole>[]}
                            data={filteredDeletedRoles}
                            rowKey="id"
                            loading={loading}
                            emptyTitle={searchTerm ? 'Silinen rol bulunamadı' : 'Geri Dönüşüm Kutusu Boş'}
                            emptyDescription={searchTerm ? 'Arama kriterlerinizi değiştirin.' : 'Silinmiş herhangi bir rol kaydı bulunmamaktadır.'}
                            emptyIcon={Trash2}
                            hoverable
                            paginated
                            itemsPerPage={15}
                            itemUnit="silinen rol"
                            searchTerm={searchTerm}
                        />
                    )}
                </div>

                {/* New Role Modal */}
                <Modal
                    isOpen={showNewRoleModal}
                    onClose={() => setShowNewRoleModal(false)}
                    title="Yeni Rol Oluştur"
                    footer={
                        <div className="flex justify-end gap-3 w-full">
                            <Button variant="secondary" onClick={() => setShowNewRoleModal(false)} className="px-6">
                                İptal
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleCreateRole}
                                disabled={!newRoleData.name.trim() || saving}
                                isLoading={saving}
                                className="px-8 shadow-md"
                            >
                                Kaydet
                            </Button>
                        </div>
                    }
                >
                    <div className="space-y-4 py-2">
                        <div>
                            <label className="form-label">Rol İsmi</label>
                            <input
                                type="text"
                                value={newRoleData.name}
                                onChange={(e) => setNewRoleData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Örn: Kıdemli Teftiş Uzmanı"
                                className="form-input"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="form-label">Açıklama</label>
                            <textarea
                                value={newRoleData.description}
                                onChange={(e) => setNewRoleData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Bu rolün görevlerini kısaca tanımlayınız..."
                                rows={3}
                                className="form-textarea"
                            />
                        </div>
                    </div>
                </Modal>

                {/* Central ConfirmModal for Role Deletion */}
                <ConfirmModal
                    isOpen={!!roleToDelete}
                    onClose={() => { if (!deleting) setRoleToDelete(null); }}
                    onConfirm={handleConfirmDeleteRole}
                    title="Rolü Silmek İstediğinize Emin Misiniz?"
                    message={`"${roleToDelete?.name}" (${roleToDelete?.code}) rolü sistemden pasife çekilerek Geri Dönüşüm Kutusuna kaldırılacaktır.`}
                    confirmText="Rolü Sil"
                    cancelText="Vazgeç"
                    type="danger"
                >
                    <div className="mt-4 text-left space-y-2">
                        <label className="form-label text-xs font-semibold text-gray-700">
                            Silme Gerekçesi (Denetim İzi Kaydı İçin Opsiyonel)
                        </label>
                        <textarea
                            value={deleteReason}
                            onChange={(e) => setDeleteReason(e.target.value)}
                            placeholder="Silme nedeninizi belirtebilirsiniz (örn: Birim yeniden yapılanması)..."
                            rows={2}
                            className="form-textarea text-xs"
                        />
                    </div>
                </ConfirmModal>

                {/* Central ConfirmModal for Role Restoration */}
                <ConfirmModal
                    isOpen={!!roleToRestore}
                    onClose={() => { if (!restoring) setRoleToRestore(null); }}
                    onConfirm={handleConfirmRestoreRole}
                    title="Rolü Geri Yükle"
                    message={`"${roleToRestore?.name}" (${roleToRestore?.code}) rolü Geri Dönüşüm Kutusundan çıkarılarak tekrar aktif yetki matrisine dahil edilecektir.`}
                    confirmText="Geri Yükle"
                    cancelText="Vazgeç"
                    type="success"
                />
            </div>
    );
}
