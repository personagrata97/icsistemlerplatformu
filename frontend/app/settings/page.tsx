'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Users, Save, Plus, ChevronRight, Trash2 } from 'lucide-react';
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
import SharedAuditLayout from '@/components/audit/AuditLayout';
import Modal from '@/components/ui/Modal';
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
    permissions: RolePermission[];
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

    const [activeTab, setActiveTab] = useState<'roles' | 'users'>('roles');
    const [roles, setRoles] = useState<Role[]>([]);
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showNewRoleModal, setShowNewRoleModal] = useState(false);
    const [newRoleData, setNewRoleData] = useState({ name: '', description: '' });

    // Filtering
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedModules, setSelectedModules] = useState<string[]>([]);
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
    const [organizationUnits, setOrganizationUnits] = useState<string[]>([]);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            
            // Extract all unit names securely
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

            const [rolesData, permsData, usersData, orgData] = await Promise.all([
                adminApi.getRoles(),
                adminApi.getPermissions(),
                adminApi.getUsers(),
                organizationApi.getTree().catch(() => []) // Fallback in case API is not active
            ]);
            
            setRoles(rolesData);
            setAllPermissions(permsData);
            setUsers(usersData);
            
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
            // M10: Yetki değişiklik logu
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
            // M10: Rol oluşturma logu
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

    // M5: Rol Silme (Sistem rolleri korumalı)
    const handleDeleteRole = async (roleId: string) => {
        const role = roles.find(r => r.id === roleId);
        if (!role) return;
        if (role.isSystem) {
            showToast('Sistem rolleri silinemez', 'error');
            return;
        }
        try {
            await adminApi.deleteRole(roleId);
            setRoles(prev => prev.filter(r => r.id !== roleId));
            if (selectedRoleId === roleId) setSelectedRoleId(roles[0]?.id || null);
            // M10: Rol silme logu
            await adminApi.createAuditLog({
                action: 'Rol Silindi',
                details: `"${role.name}" rolü silindi.`,
                targetType: 'Rol',
                targetId: roleId
            });
            showToast('Rol başarıyla silindi', 'success');
        } catch {
            showToast('Rol silinirken bir hata oluştu', 'error');
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
            // M10: Kullanıcı rol atama logu
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
    if (loading && roles.length === 0) return <LoadingState message="Ayarlar yükleniyor..." />;

    const selectedRole = roles.find(r => r.id === selectedRoleId);
    const modules = Array.from(new Set(allPermissions.map(p => p.module))).sort();
    
    // Use true organizational units as the source of truth for the dropdown, 
    // but also include any existing user departments that might not be in the org tree yet to prevent orphaned filters
    const userDepartments = users.map(u => u.department).filter(Boolean) as string[];
    const departments = Array.from(new Set([...organizationUnits, ...userDepartments])).sort();

    return (
        <SharedAuditLayout hideSidebar={true}>
            <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
                <PageHeader title="Erişim Yönetimi" subtitle="Sistem rolleri, yetki matrisi ve kullanıcı atamaları" />

                {/* Tabs */}
                <SegmentedTabs
                    tabs={[
                        { id: 'roles', label: 'Yetki Matrisi', icon: Shield },
                        { id: 'users', label: 'Kullanıcı Rol Atamaları', icon: Users },
                    ]}
                    activeTab={activeTab}
                    onChange={(id) => setActiveTab(id as 'roles' | 'users')}
                />

                {/* Toolbar */}
                <PageToolbar
                    searchPlaceholder={activeTab === 'roles' ? "Rol veya yetki ara..." : "Kullanıcı ara..."}
                    searchValue={searchTerm}
                    onSearchChange={setSearchTerm}
                    onRefresh={() => fetchData()}
                    showAddButton={activeTab === 'roles'}
                    addButtonText="Yeni Rol"
                    onAddClick={() => setShowNewRoleModal(true)}
                    showExportButton={true}
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
                        ) : (
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
                        )
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
                                                        onClick={() => handleDeleteRole(selectedRole.id)}
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
                    ) : (
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
            </div>
        </SharedAuditLayout>
    );
}
