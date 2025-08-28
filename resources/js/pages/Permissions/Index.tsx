import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import ModalForm from '@/components/ModalForm';
import UseForm from './UseForm';
import Swal from 'sweetalert2';
import {
  Plus, Pencil, Trash2, Shield, Users, Key, Search,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { can } from '@/lib/can';

interface Permission {
  id: number | string;
  name: string;
  guard_name?: string;
  created_at?: string;
  updated_at?: string;
}

interface Paginator<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
  links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
  permissions: Paginator<Permission>;
}

export default function PermissionsIndex({ permissions }: Props) {
  const [isModalOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const canCreate = can('permission.create');
  const canEdit = can('permission.edit');
  const canDelete = can('permission.delete');
  const showActions = canEdit || canDelete;

  // Real-time search filtering
  const filteredPermissions = useMemo(() => {
    if (!searchTerm) return permissions.data;

    const searchLower = searchTerm.toLowerCase();
    return permissions.data.filter(permission =>
      permission.name.toLowerCase().includes(searchLower) ||
      (permission.guard_name && permission.guard_name.toLowerCase().includes(searchLower))
    );
  }, [permissions.data, searchTerm]);

  const openCreate = () => {
    if (!canCreate) return;
    setMode('create');
    setSelectedPermission(null);
    setIsOpen(true);
  };

  const openEdit = (permission: Permission) => {
    if (!canEdit) return;
    setMode('edit');
    setSelectedPermission(permission);
    setIsOpen(true);
  };

  const handleDelete = (id: number | string, name: string) => {
    if (!id || !canDelete) return;

    Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete permission "${name}"`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
    }).then((result) => {
      if (result.isConfirmed) {
        router.delete(route('permissions.destroy', id), {
          preserveState: true,
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              title: 'Deleted!',
              text: 'Permission has been deleted.',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false,
            });
          },
        });
      }
    });
  };

  const goToPage = (page: number) => {
    if (page < 1 || page > permissions.last_page || page === permissions.current_page) return;
    router.get(route('permissions.index'), { page, search: searchTerm }, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handleSearchSubmit = () => {
    router.get(route('permissions.index'), { search: searchTerm }, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Permissions', href: '/permissions' },
  ];

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const webGuardCount = permissions.data.filter(p => p.guard_name === 'web').length;
  const apiGuardCount = permissions.data.filter(p => p.guard_name === 'api').length;

  // Calculate stats for filtered results
  const filteredWebGuardCount = filteredPermissions.filter(p => p.guard_name === 'web').length;
  const filteredApiGuardCount = filteredPermissions.filter(p => p.guard_name === 'api').length;

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Permission Management" />
      <div className="mx-auto w-full px-4 py-8 sm:px-6 lg:px-8 font-sans" style={{ fontFamily: 'var(--font-anuphan)' }}>
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-gray-900">การจัดการสิทธิ์</h1>
          <p className="mt-2 text-gray-600">จัดการสิทธิ์และควบคุมการเข้าถึงระบบ</p>
        </div>

        {/* Search & Create */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="ค้นหาสิทธิ์ตามชื่อหรือ guard..."
              className="block w-full rounded-xl border-0 bg-white py-3 pl-10 pr-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
            />
            <button
              onClick={handleSearchSubmit}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-indigo-600 hover:text-indigo-800"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>

          {canCreate && (
            <button
              onClick={openCreate}
              className="flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 text-sm font-medium text-white shadow-lg transition-all hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl"
            >
              <Plus className="mr-2 h-5 w-5" />
              สร้างสิทธิ์ใหม่
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-4">
          <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-lg bg-indigo-100 p-2">
                <Shield className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-700">สิทธิ์ทั้งหมด</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {searchTerm ? filteredPermissions.length : permissions.total}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 p-4 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-lg bg-green-100 p-2">
                <Key className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-700">Web Guard</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {searchTerm ? filteredWebGuardCount : webGuardCount}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 p-4 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-lg bg-purple-100 p-2">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-700">API Guard</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {searchTerm ? filteredApiGuardCount : apiGuardCount}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-r from-gray-50 to-blue-gray-50 p-4 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-lg bg-gray-100 p-2">
                <Search className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-700">แสดงผล</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {searchTerm ? `1-${filteredPermissions.length}` : `${permissions.from}-${permissions.to}`} of {searchTerm ? filteredPermissions.length : permissions.total}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    สิทธิ์
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Guard
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    สร้างเมื่อ
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    อัปเดตเมื่อ
                  </th>
                  {showActions && (
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      การดำเนินการ
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredPermissions.length > 0 ? (
                  filteredPermissions.map((perm) => (
                    <tr key={perm.id} className="transition-all hover:bg-gray-50/80">
                      <td className="whitespace-nowrap px-6 py-5">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center shadow-sm">
                            <Key className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-base font-semibold text-gray-900">{perm.name}</div>
                            <div className="text-sm text-gray-500">ID: {perm.id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-6 py-5">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${perm.guard_name === 'web' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                          {perm.guard_name || 'web'}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-sm text-gray-600">
                        {formatDate(perm.created_at)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-sm text-gray-600">
                        {formatDate(perm.updated_at)}
                      </td>

                      {showActions && (
                        <td className="whitespace-nowrap px-6 py-5">
                          <div className="flex items-center space-x-3">
                            {canEdit && (
                              <button
                                onClick={() => openEdit(perm)}
                                className="inline-flex items-center rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 px-4 py-2.5 text-sm font-medium text-blue-700 transition-all hover:from-blue-100 hover:to-cyan-100 hover:shadow-sm"
                              >
                                <Pencil className="mr-1.5 h-4 w-4" />
                                แก้ไข
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleDelete(perm.id, perm.name)}
                                className="inline-flex items-center rounded-xl bg-gradient-to-r from-red-50 to-pink-50 px-4 py-2.5 text-sm font-medium text-red-700 transition-all hover:from-red-100 hover:to-pink-100 hover:shadow-sm"
                              >
                                <Trash2 className="mr-1.5 h-4 w-4" />
                                ลบ
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={showActions ? 5 : 4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
                          <Shield className="h-8 w-8 text-indigo-600" />
                        </div>
                        <p className="mt-4 text-lg font-medium">
                          {searchTerm ? 'ไม่พบสิทธิ์ที่ค้นหา' : 'ยังไม่มีสิทธิ์'}
                        </p>
                        <p className="mt-1 text-sm">
                          {searchTerm ? 'ลองปรับเปลี่ยนคำค้นหาของคุณ' : 'เริ่มต้นด้วยการสร้างสิทธิ์แรกของคุณ'}
                        </p>
                        {!searchTerm && canCreate && (
                          <button
                            onClick={openCreate}
                            className="mt-4 inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700"
                          >
                            สร้างสิทธิ์แรก
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination - Only show when not searching */}
          {!searchTerm && permissions.data.length > 0 && (
            <div className="border-t border-gray-200 bg-white px-6 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="mb-4 sm:mb-0">
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{permissions.from}</span> to <span className="font-medium">{permissions.to}</span> of <span className="font-medium">{permissions.total}</span> results
                  </p>
                </div>

                <div className="flex items-center space-x-2">

                  <button onClick={() => goToPage(permissions.current_page - 1)} disabled={permissions.current_page === 1} className="relative inline-flex items-center rounded-lg border border-gray-300 bg-white px-1.5 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <div className="hidden sm:flex space-x-1">
                    {permissions.links.slice(1, -1).map((link, index) => (
                      <button
                        key={index}
                        onClick={() => goToPage(parseInt(link.label))}
                        className={`relative inline-flex items-center rounded-lg border px-3.5 py-1.5 text-sm font-medium ${link.active ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'}`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                      />
                    ))}
                  </div>

                  <button onClick={() => goToPage(permissions.current_page + 1)} disabled={permissions.current_page === permissions.last_page} className="relative inline-flex items-center rounded-lg border border-gray-300 bg-white px-1.5 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Show search results info when searching */}
          {searchTerm && filteredPermissions.length > 0 && (
            <div className="border-t border-gray-200 bg-white px-6 py-4">
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  พบ {filteredPermissions.length} ผลลัพธ์สำหรับ "{searchTerm}"
                </p>
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
                >
                  ล้างการค้นหา
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal */}
        <ModalForm
          isModalOpen={isModalOpen}
          onClose={() => setIsOpen(false)}
          title={mode === 'create' ? 'สร้างสิทธิ์' : 'แก้ไขสิทธิ์'}
          size="max-w-md"
        >
          <UseForm
            mode={mode}
            data={selectedPermission}
            onClose={() => setIsOpen(false)}
            onSuccess={() => router.reload({ only: ['permissions'] })}
          />
        </ModalForm>
      </div>
    </AppLayout>
  );
}
