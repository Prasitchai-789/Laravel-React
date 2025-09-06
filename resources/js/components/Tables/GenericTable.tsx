"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export type Column<T> = {
  key: keyof T | "actions";
  label: string;
  sortable?: boolean;
  align?: "left" | "center" | "right";
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
};

export default function GenericTable<T extends Record<string, any>>({
  data,
  columns,
  idField,
  actions,
  initialSort,
  title = "ตารางข้อมูล",
  searchable = true,
  pagination = true,
  itemsPerPage = 10,
}: GenericTableProps<T>) {
  const [sortField, setSortField] = useState<keyof T | null>(initialSort ?? null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

  const handleSort = (field: keyof T) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  // Filter data based on search term and column filters
  const filteredData = data.filter((item) => {
    // Global search
    const matchesSearch = !searchTerm ||
      Object.values(item).some((value) =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );

    // Column filters
    const matchesColumnFilters = Object.entries(columnFilters).every(([key, filterValue]) =>
      !filterValue || item[key]?.toString().toLowerCase().includes(filterValue.toLowerCase())
    );

    return matchesSearch && matchesColumnFilters;
  });

  // Sort data
  const sortedData = sortField
    ? [...filteredData].sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        if (typeof aValue === "string") return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        if (typeof aValue === "number") return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
        return 0;
      })
    : filteredData;

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = pagination
    ? sortedData.slice(startIndex, startIndex + itemsPerPage)
    : sortedData;

  const getSortIcon = (field: keyof T) => {
    if (sortField !== field) return <ChevronDown size={16} className="opacity-30" />;
    return sortDirection === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };

  const handleFilterChange = (columnKey: string, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [columnKey]: value
    }));
    setCurrentPage(1);
  };

  return (
    <Card className="shadow-lg rounded-xl border-0 overflow-hidden font-anuphan h-full">
      <CardHeader className="">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="text-xl text-gray-800">{title}</CardTitle>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {searchable && (
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="ค้นหา..."
                  className="pl-8 w-full sm:w-[250px] rounded-full bg-white shadow-sm"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            )}

            <div className="flex gap-2">
              {/* <Button variant="outline" size="sm" className="rounded-full gap-1">
                <Filter size={16} />
                <span>ตัวกรอง</span>
              </Button> */}

              <Button variant="outline" size="sm" className="rounded-full gap-1">
                <Download size={16} />
                <span>ส่งออก</span>
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 h-full">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                {columns.map((col) => (
                  <TableHead
                    key={col.key as string}
                    className={`py-3 font-semibold text-gray-700 ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : ""}`}
                  >
                    <div className={`flex items-center ${col.align === "right" ? "justify-end" : col.align === "center" ? "justify-center" : "justify-between"}`}>
                      <span>{col.label}</span>
                      {col.sortable && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 ml-1"
                          onClick={() => col.sortable && handleSort(col.key as keyof T)}
                        >
                          {getSortIcon(col.key as keyof T)}
                        </Button>
                      )}
                    </div>

                    {col.filterable && (
                      <div className="mt-1">
                        <Input
                          placeholder="กรอง..."
                          className="h-7 text-xs"
                          value={columnFilters[col.key as string] || ""}
                          onChange={(e) => handleFilterChange(col.key as string, e.target.value)}
                        />
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((row, index) => (
                  <TableRow
                    key={row[idField] as React.Key}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                  >
                    {columns.map((col) => (
                      <TableCell
                        key={col.key as string}
                        className={`py-3 ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : ""}`}
                      >
                        {col.key === "actions" ? (
                          actions ? (
                            <div className="flex justify-center">
                                  {actions(row)}
                            </div>
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
                  <TableCell colSpan={columns.length} className="text-center py-12 text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="rounded-full bg-gray-100 p-3 mb-3">
                        <Search size={24} className="text-gray-400" />
                      </div>
                      <p className="font-medium">ไม่พบข้อมูล</p>
                      <p className="text-sm mt-1">ลองเปลี่ยนคำค้นหาหรือตัวกรองดูอีกครั้ง</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-gray-700">
              แสดง {startIndex + 1} ถึง {Math.min(startIndex + itemsPerPage, sortedData.length)} จาก {sortedData.length} รายการ
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
              </Button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Show pages around current page
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
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
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
