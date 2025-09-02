// Components/SaleTable.tsx
"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Download
} from "lucide-react";

type Sale = {
  id: number;
  date: string;
  customer: string;
  product: string;
  quantity: number;
  price: number;
};

type Props = {
  sales: Sale[];
};

export default function SaleTable({ sales }: Props) {
  const [sortField, setSortField] = useState<string>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [actionMenu, setActionMenu] = useState<number | null>(null);

  // Sorting function
  const sortedSales = [...sales].sort((a, b) => {
    let aValue, bValue;

    if (sortField === "total") {
      aValue = a.quantity * a.price;
      bValue = b.quantity * b.price;
    } else {
      aValue = a[sortField as keyof Sale];
      bValue = b[sortField as keyof Sale];
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return sortDirection === "asc"
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });

  // Filter by search term
  const filteredSales = sortedSales.filter(sale =>
    sale.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.date.includes(searchTerm)
  );

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <ChevronDown size={16} className="opacity-30" />;
    return sortDirection === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };

  const toggleActionMenu = (id: number) => {
    setActionMenu(actionMenu === id ? null : id);
  };

  return (

      <CardContent className="p-4 pt-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead
                  className="w-28 cursor-pointer"
                  onClick={() => handleSort("date")}
                >
                  <div className="flex items-center gap-1">
                    วันที่
                    {getSortIcon("date")}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("customer")}
                >
                  <div className="flex items-center gap-1">
                    ลูกค้า
                    {getSortIcon("customer")}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("product")}
                >
                  <div className="flex items-center gap-1">
                    สินค้า
                    {getSortIcon("product")}
                  </div>
                </TableHead>
                <TableHead
                  className="text-right cursor-pointer"
                  onClick={() => handleSort("quantity")}
                >
                  <div className="flex items-center gap-1 justify-end">
                    จำนวน
                    {getSortIcon("quantity")}
                  </div>
                </TableHead>
                <TableHead
                  className="text-right cursor-pointer"
                  onClick={() => handleSort("price")}
                >
                  <div className="flex items-center gap-1 justify-end">
                    ราคาต่อหน่วย
                    {getSortIcon("price")}
                  </div>
                </TableHead>
                <TableHead
                  className="text-right cursor-pointer"
                  onClick={() => handleSort("total")}
                >
                  <div className="flex items-center gap-1 justify-end">
                    รวม (บาท)
                    {getSortIcon("total")}
                  </div>
                </TableHead>
                <TableHead className="text-center">สถานะ</TableHead>
                <TableHead className="text-center w-32">การดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.length > 0 ? (
                filteredSales.map((sale) => (
                  <TableRow key={sale.id} className="hover:bg-gray-50/50">
                    <TableCell className="font-medium">{formatDate(sale.date)}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{sale.customer}</div>
                        <div className="text-xs text-gray-500">ID: {sale.id.toString().padStart(4, '0')}</div>
                      </div>
                    </TableCell>
                    <TableCell>{sale.product}</TableCell>
                    <TableCell className="text-right">{sale.quantity.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{sale.price.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-medium text-green-700">
                      {(sale.quantity * sale.price).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          ชำระเงินแล้ว
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center relative">
                        <button
                          onClick={() => toggleActionMenu(sale.id)}
                          className="p-1 rounded hover:bg-gray-100"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {actionMenu === sale.id && (
                          <div className="absolute right-0 top-6 z-10 bg-white rounded-md shadow-lg border border-gray-200 py-1 w-32">
                            <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
                              <Eye size={14} />
                              ดูรายละเอียด
                            </button>
                            <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
                              <Edit size={14} />
                              แก้ไข
                            </button>
                            <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2">
                              <Trash2 size={14} />
                              ลบ
                            </button>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-2">ไม่พบข้อมูลการขาย</div>
                      <div className="text-sm">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {filteredSales.length > 0 && (
          <div className="px-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-center">
            <div className="text-sm text-gray-600 mb-2 sm:mb-0">
              แสดง {filteredSales.length} จาก {sales.length} รายการ
            </div>

            <div className="flex items-center gap-2">
              <button className="px-3 py-1 border border-gray-200 rounded text-sm disabled:opacity-50">
                ก่อนหน้า
              </button>
              <span className="px-2 text-sm">1 / 1</span>
              <button className="px-3 py-1 border border-gray-200 rounded text-sm disabled:opacity-50">
                ถัดไป
              </button>
            </div>
          </div>
        )}
      </CardContent>
  );
}
