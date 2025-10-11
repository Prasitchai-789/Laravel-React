'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Search } from 'lucide-react';
import React, { useState } from 'react';

export type Column<T> = {
    key: keyof T | 'actions';
    label: string;
    sortable?: boolean;
    align?: 'left' | 'center' | 'right';
    render?: (row: T) => React.ReactNode;
    filterable?: boolean;
};

export type GenericTableProps<T> = {
    data: T[];
    columns: Column<T>[];
    idField: keyof T;
    actions?: (row: T) => React.ReactNode;
    initialSort?: keyof T;
    title?: string;
    searchable?: boolean;
    pagination?: boolean;
    itemsPerPage?: number;
    // External pagination control
    currentPage?: number;
    perPage?: number;
    totalRecords?: number;
    onPageChange?: (page: number) => void;
    onPerPageChange?: (perPage: number) => void;
    // External search/filter
    externalSearch?: boolean;
    externalSort?: boolean;
    loading?: boolean;
};

export default function GenericTable<T extends Record<string, any>>({
    data,
    columns,
    idField,
    actions,
    initialSort,
    title = 'ตารางข้อมูล',
    searchable = true,
    pagination = true,
    itemsPerPage = 10,
    // External pagination props
    currentPage: externalCurrentPage,
    perPage: externalPerPage,
    totalRecords: externalTotalRecords,
    onPageChange,
    onPerPageChange,
    externalSearch = false,
    externalSort = false,
    loading = false,
}: GenericTableProps<T>) {
    // State สำหรับ internal management
    const [internalSortField, setInternalSortField] = useState<keyof T | null>(initialSort ?? null);
    const [internalSortDirection, setInternalSortDirection] = useState<'asc' | 'desc'>('asc');
    const [internalSearchTerm, setInternalSearchTerm] = useState('');
    const [internalCurrentPage, setInternalCurrentPage] = useState(1);
    const [internalItemsPerPage, setInternalItemsPerPage] = useState(itemsPerPage);
    const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

    // กำหนดว่าจะใช้ external หรือ internal control
    const useExternalPagination = onPageChange !== undefined && onPerPageChange !== undefined;
    const useExternalSort = externalSort;

    // ใช้ค่าจาก external หรือ internal
    const currentPage = useExternalPagination ? externalCurrentPage || 1 : internalCurrentPage;
    const perPage = useExternalPagination ? externalPerPage || itemsPerPage : internalItemsPerPage;
    const totalRecords = useExternalPagination ? externalTotalRecords || 0 : data.length;

    // คำนวณ total pages
    const totalPages = Math.ceil(totalRecords / perPage);

    const handleSort = (field: keyof T) => {
        if (useExternalSort) {
            // ถ้าเป็น external sort ให้ส่ง event ไปยัง parent
            // ในกรณีนี้เราจะใช้ internal sort แทนเพราะไม่มี callback สำหรับ external sort
            console.log('External sort requested for:', field);
            return;
        }

        // Internal sort handling
        if (internalSortField === field) {
            setInternalSortDirection(internalSortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setInternalSortField(field);
            setInternalSortDirection('asc');
        }

        // Reset to first page when sorting
        resetToFirstPage();
    };

    const resetToFirstPage = () => {
        if (useExternalPagination) {
            onPageChange?.(1);
        } else {
            setInternalCurrentPage(1);
        }
    };

    // Filter data based on search term and column filters (สำหรับ internal filtering เท่านั้น)
    const filteredData = externalSearch
        ? data
        : data.filter((item) => {
              // Global search
              const matchesSearch =
                  !internalSearchTerm ||
                  Object.values(item).some((value) =>
                      value?.toString().toLowerCase().includes(internalSearchTerm.toLowerCase())
                  );

              // Column filters
              const matchesColumnFilters = Object.entries(columnFilters).every(
                  ([key, filterValue]) =>
                      !filterValue ||
                      item[key]?.toString().toLowerCase().includes(filterValue.toLowerCase())
              );

              return matchesSearch && matchesColumnFilters;
          });

    // Sort data (internal sorting เท่านั้น)
    const sortedData = useExternalSort
        ? filteredData
        : (internalSortField
            ? [...filteredData].sort((a, b) => {
                  const aValue = a[internalSortField];
                  const bValue = b[internalSortField];

                  if (aValue === null || aValue === undefined) return 1;
                  if (bValue === null || bValue === undefined) return -1;

                  if (typeof aValue === 'string' && typeof bValue === 'string') {
                      return internalSortDirection === 'asc'
                          ? aValue.localeCompare(bValue)
                          : bValue.localeCompare(aValue);
                  }
                  if (typeof aValue === 'number' && typeof bValue === 'number') {
                      return internalSortDirection === 'asc'
                          ? aValue - bValue
                          : bValue - aValue;
                  }
                  return 0;
              })
            : filteredData);

    // Pagination calculation
    const startIndex = (currentPage - 1) * perPage;

    // สำหรับ external pagination ใช้ data ที่ได้รับมาโดยตรง
    // สำหรับ internal pagination ใช้ sortedData หลังจาก filter/sort
    const displayData = useExternalPagination
        ? data
        : sortedData.slice(startIndex, startIndex + perPage);

    const getSortIcon = (field: keyof T) => {
        if (useExternalSort) {
            return <ChevronDown size={16} className="opacity-30" />;
        }

        if (internalSortField !== field) return <ChevronDown size={16} className="opacity-30" />;
        return internalSortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
    };

    const handleFilterChange = (columnKey: string, value: string) => {
        setColumnFilters((prev) => ({
            ...prev,
            [columnKey]: value,
        }));
        resetToFirstPage();
    };

    const handlePageChange = (page: number) => {
        if (useExternalPagination) {
            onPageChange?.(page);
        } else {
            setInternalCurrentPage(page);
        }
    };

    const handlePerPageChange = (newPerPage: number) => {
        if (useExternalPagination) {
            onPerPageChange?.(newPerPage);
        } else {
            setInternalItemsPerPage(newPerPage);
            setInternalCurrentPage(1);
        }
    };

    const handleSearchChange = (value: string) => {
        if (!externalSearch) {
            setInternalSearchTerm(value);
            resetToFirstPage();
        }
    };

    // Loading state
    if (loading) {
        return (
            <Card className="h-full overflow-hidden rounded-xl border-0 py-2 pt-4 font-anuphan shadow-lg">
                <CardContent className="flex h-64 items-center justify-center">
                    <div className="text-center">
                        <div className="mb-2">กำลังโหลดข้อมูล...</div>
                        <div className="text-sm text-gray-500">กรุณารอสักครู่</div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full overflow-hidden rounded-xl border-0 py-2 pt-4 font-anuphan shadow-lg">
            <CardHeader className="pt-2">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <CardTitle className="text-xl text-gray-800">{title}</CardTitle>

                    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                        {searchable && !externalSearch && (
                            <div className="relative">
                                <Search className="absolute top-3 left-4 h-4 w-4 text-gray-500" />
                                <Input
                                    type="search"
                                    placeholder="ค้นหา..."
                                    className="w-full rounded-full border border-gray-100 bg-white p-5 pr-5 pl-10 shadow-sm sm:w-[250px]"
                                    value={internalSearchTerm}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="h-full">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50 hover:bg-gray-50">
                                {columns.map((col) => (
                                    <TableHead
                                        key={col.key as string}
                                        className={`py-3 font-semibold text-gray-700 ${
                                            col.align === 'right' ? 'text-right' :
                                            col.align === 'center' ? 'text-center' : ''
                                        }`}
                                    >
                                        <div
                                            className={`flex items-center ${
                                                col.align === 'right' ? 'justify-end' :
                                                col.align === 'center' ? 'justify-center' : 'justify-between'
                                            }`}
                                        >
                                            <span>{col.label}</span>
                                            {col.sortable && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="ml-1 h-8 w-8 p-0"
                                                    onClick={() => col.sortable && handleSort(col.key as keyof T)}
                                                    disabled={useExternalSort}
                                                >
                                                    {getSortIcon(col.key as keyof T)}
                                                </Button>
                                            )}
                                        </div>

                                        {col.filterable && !externalSearch && (
                                            <div className="mt-1">
                                                <Input
                                                    placeholder="กรอง..."
                                                    className="h-7 text-xs"
                                                    value={columnFilters[col.key as string] || ''}
                                                    onChange={(e) => handleFilterChange(col.key as string, e.target.value)}
                                                />
                                            </div>
                                        )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {displayData.length > 0 ? (
                                displayData.map((row, index) => (
                                    <TableRow
                                        key={row[idField] as React.Key}
                                        className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                                    >
                                        {columns.map((col) => (
                                            <TableCell
                                                key={col.key as string}
                                                className={`py-3 ${
                                                    col.align === 'right' ? 'text-right' :
                                                    col.align === 'center' ? 'text-center' : ''
                                                }`}
                                            >
                                                {col.key === 'actions' ? (
                                                    actions ? (
                                                        <div className="flex justify-center">{actions(row)}</div>
                                                    ) : null
                                                ) : col.render ? (
                                                    col.render(row)
                                                ) : (
                                                    <span className="text-gray-700">{row[col.key]}</span>
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="mb-3 rounded-full bg-gray-100 p-3">
                                                <Search size={24} className="text-gray-400" />
                                            </div>
                                            <p className="font-medium">ไม่พบข้อมูล</p>
                                            <p className="mt-1 text-sm">ลองเปลี่ยนคำค้นหาหรือตัวกรองดูอีกครั้ง</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {pagination && totalPages > 0 && (
                    <div className="flex flex-col items-center justify-between gap-4 px-4 py-4 sm:flex-row">
                        {/* Items per page selector */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-700">แสดง</span>
                            <select
                                value={perPage}
                                onChange={(e) => handlePerPageChange(Number(e.target.value))}
                                className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                                disabled={!useExternalPagination && externalSearch}
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                            <span className="text-sm text-gray-700">รายการ</span>
                        </div>

                        <div className="text-sm text-gray-700">
                            แสดง {startIndex + 1} ถึง {Math.min(startIndex + perPage, totalRecords)} จาก {totalRecords} รายการ
                        </div>

                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft size={16} />
                            </Button>

                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }

                                return (
                                    <Button
                                        key={pageNum}
                                        variant={currentPage === pageNum ? 'subtle' : 'outline'}
                                        size="sm"
                                        onClick={() => handlePageChange(pageNum)}
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            })}

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                            >
                                <ChevronRight size={16} />
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
