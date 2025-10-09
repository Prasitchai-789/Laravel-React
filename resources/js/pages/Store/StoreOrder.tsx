import React, { useState, useMemo, useEffect } from "react";
import { Head, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import Swal from "sweetalert2";
import { ShoppingCart, Calendar } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
interface Good {
    GoodID: string;
    GoodName: string;
    GoodCode: string;
    GoodStockUnitCode: string;
    GoodStockUnitName?: string;
    ProductType?: string;
    DeptID?: string;
    availableQty?: number;
}

interface CartItem extends Good {
    qty: number;
}

interface Props {
    goods?: Good[];
    flash?: {
        success?: boolean;
        message?: string;
        order_id?: string;
        document_number?: string;
    };
}

const codeToCategory: Record<string, string> = {
    "ST-EL": "อุปกรณ์ไฟฟ้า",
    "ST-FP": "อะไหล่ท่อ",
    "ST-SM": "อะไหล่",
    "ST-EQ": "วัสดุสิ้นเปลือง",
    "P-TS-AG001": "ทั่วไป",
};

function getProductType(goodCode: string): string {
    if (codeToCategory[goodCode]) return codeToCategory[goodCode];
    const prefix = goodCode.split("-").slice(0, 2).join("-");
    return codeToCategory[prefix] || "ไม่มีประเภท";
}

export default function StoreOrder({ goods = [], flash }: Props) {
    const goodsWithType: Good[] = useMemo(() => {
        return goods.map((g) => ({ ...g, ProductType: getProductType(g.GoodCode) }));
    }, [goods]);

    const [cart, setCart] = useState<CartItem[]>([]);
    const [adjustedGoods, setAdjustedGoods] = useState<Record<string, number>>({});
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [selectedCategory, setSelectedCategory] = useState<string>("ทั้งหมด");
    const [cartPage, setCartPage] = useState<number>(1);
    const [showCart, setShowCart] = useState<boolean>(false);
    const [note, setNote] = useState("");
    const [withdrawDate, setWithdrawDate] = useState(new Date().toISOString().split('T')[0]);


    useEffect(() => {
        if (flash?.success && flash?.message) {
            Swal.fire({
                icon: 'success',
                title: flash.message,
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                setCart([]);
                setShowCart(false);
                setCartPage(1);
                router.visit(route('Store/StoreOrder'), {
                    only: ['goods'],
                    preserveState: true
                });
            });
        }
    }, [flash]);

    const itemsPerPage = 10;
    const cartItemsPerPage = 10;
    const totalItemsInCart = useMemo(() => cart.reduce((sum, i) => sum + i.qty, 0), [cart]);

    // Filtered goods with adjusted availableQty
    const filteredGoods = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        return goodsWithType.filter((g) => {
            const usedQty = adjustedGoods[g.GoodID] ?? 0;

            // คืน stock และปรับ availableQty
            const actualReturn = Math.min(usedQty, g.reservedQty ?? 0);
            const available = (g.availableQty ?? 0) + actualReturn - usedQty;

            const matchesSearch =
                g.GoodName.toLowerCase().includes(term) ||
                g.GoodCode.toLowerCase().includes(term) ||
                (g.ProductType?.toLowerCase().includes(term) ?? false);

            return matchesSearch && available > 0;
        });
    }, [goodsWithType, searchTerm, adjustedGoods]);

    const categorizedGoods = useMemo(() => {
        if (selectedCategory === "ทั้งหมด") return filteredGoods;
        return filteredGoods.filter((g) =>
            selectedCategory === "ไม่มีประเภท" ? !g.ProductType : g.ProductType === selectedCategory
        );
    }, [filteredGoods, selectedCategory]);

    const totalPages = Math.ceil(categorizedGoods.length / itemsPerPage);
    const currentItems = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return categorizedGoods.slice(start, start + itemsPerPage);
    }, [categorizedGoods, currentPage]);

    const totalCartPages = Math.ceil(cart.length / cartItemsPerPage);
    const currentCartItems = useMemo(() => {
        const start = (cartPage - 1) * cartItemsPerPage;
        return cart.slice(start, start + cartItemsPerPage);
    }, [cart, cartPage]);

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    const goToCartPage = (page: number) => {
        if (page >= 1 && page <= totalCartPages) setCartPage(page);
    };

    const addToCart = (good: Good) => {
        const usedQty = adjustedGoods[good.GoodID] ?? 0;
        const available = (good.availableQty ?? 0) - usedQty;

        if (available <= 0) {
            Swal.fire({
                icon: "warning",
                title: `⚠ สินค้า "${good.GoodName}" ไม่พร้อมใช้งาน`,
                timer: 1500,
                showConfirmButton: false,
                customClass: { popup: 'rounded-2xl font-anuphan' },
            });
            return;
        }

        setCart((prev) => {
            const existing = prev.find((i) => i.GoodID === good.GoodID);
            if (existing) {
                const newQty = Math.min(existing.qty + 1, available);
                return prev.map((i) =>
                    i.GoodID === good.GoodID ? { ...i, qty: newQty } : i
                );
            }
            return [...prev, { ...good, qty: 1 }];
        });

        setAdjustedGoods((prev) => ({
            ...prev,
            [good.GoodID]: (prev[good.GoodID] ?? 0) + 1,
        }));
    };

    const updateCartQty = (goodId: string, newQty: number) => {
        if (newQty < 1) {
            removeFromCart(goodId);
            return;
        }

        const cartItem = cart.find(i => i.GoodID === goodId);
        if (!cartItem) return;

        const usedQty = adjustedGoods[goodId] ?? 0;
        const available = (cartItem.availableQty ?? 0) - usedQty + cartItem.qty;

        if (newQty > available) {
            Swal.fire({
                icon: "warning",
                title: "⚠ จำนวนสินค้าไม่เพียงพอ",
                text: `มีสินค้าพร้อมเบิกเพียง ${available} ${cartItem.GoodStockUnitName || 'หน่วย'}`,
                timer: 2000,
                showConfirmButton: false,
                customClass: { popup: 'rounded-2xl font-anuphan' },
            });
            return;
        }

        setCart((prev) =>
            prev.map((i) =>
                i.GoodID === goodId ? { ...i, qty: newQty } : i
            )
        );

        const qtyDifference = newQty - cartItem.qty;
        setAdjustedGoods((prev) => ({
            ...prev,
            [goodId]: (prev[goodId] ?? 0) + qtyDifference,
        }));
    };
    const handleQtyChange = (goodId: string, value: string) => {
        let qty = parseFloat(value);
        if (isNaN(qty) || qty < 0) return;

        // ดึง stock ของสินค้านี้
        const item = cart.find(i => i.GoodID === goodId);
        if (!item) return;

        // ถ้าเกิน stock ให้บังคับเป็น stock
        if (qty > item.availableQty) {
            qty = item.availableQty;
            Swal.fire({
                icon: 'warning',
                title: `จำนวนสินค้าสูงสุดคือ ${item.availableQty}`,
                timer: 1200,
                showConfirmButton: false,
                customClass: { popup: 'rounded-2xl font-anuphan' },
            });
        }

        if (qty === 0) {
            removeFromCart(goodId); // ลบสินค้า
        } else {
            setCart(prev =>
                prev.map(i =>
                    i.GoodID === goodId ? { ...i, qty } : i
                )
            );
        }
    };



    const removeFromCart = (goodId: string) => {
        const item = cart.find(i => i.GoodID === goodId);
        if (!item) return;

        Swal.fire({
            title: `ต้องการลบสินค้า "${item.GoodName}" ออกจากตะกร้าหรือไม่?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'ลบ',
            cancelButtonText: 'ยกเลิก',
            customClass: {
                popup: 'rounded-2xl font-anuphan',
                confirmButton: 'rounded-xl px-4 py-2 font-anuphan',
                cancelButton: 'rounded-xl px-4 py-2 font-anuphan'
            },
        }).then((result) => {
            if (result.isConfirmed) {
                setCart(prev => prev.filter(i => i.GoodID !== goodId));
                setAdjustedGoods(prev => {
                    const { [goodId]: _, ...rest } = prev;
                    return rest;
                });

                Swal.fire({
                    icon: 'success',
                    title: `ลบสินค้า "${item.GoodName}" เรียบร้อยแล้ว`,
                    timer: 1200,
                    showConfirmButton: false,
                    customClass: { popup: 'rounded-2xl font-anuphan' },
                });
            }
        });
    };

    const clearCart = () => {
        if (cart.length === 0) return;

        Swal.fire({
            title: 'ต้องการลบสินค้าทั้งหมดจากตะกร้าหรือไม่?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'ลบทั้งหมด',
            cancelButtonText: 'ยกเลิก',
            customClass: {
                popup: 'rounded-2xl font-anuphan',
                confirmButton: 'rounded-xl px-4 py-2 font-anuphan',
                cancelButton: 'rounded-xl px-4 py-2 font-anuphan'
            },
        }).then((result) => {
            if (result.isConfirmed) {
                setCart([]);
                setAdjustedGoods({});
                setCartPage(1);
            }
        });
    };

    const categories = useMemo(() => {
        // ดึงจาก goodsWithType แบบไม่ซ้ำกัน
        const allTypes = Array.from(
            new Set(goodsWithType.map(g => g.ProductType || "ไม่มีประเภท"))
        );
        return ["ทั้งหมด", ...allTypes];
    }, [goodsWithType]);

    const handleSubmit = () => {
        if (cart.length === 0) {
            Swal.fire({
                icon: "warning",
                title: "⚠ กรุณาเลือกสินค้าที่ต้องการเบิก",
                customClass: {
                    popup: 'rounded-2xl font-anuphan',
                    confirmButton: 'rounded-xl px-4 py-2 font-anuphan'
                }
            });
            return;
        }

        if (!withdrawDate) {
            Swal.fire({
                icon: "warning",
                title: "⚠ กรุณาเลือกวันที่เบิก",
                customClass: {
                    popup: 'rounded-2xl font-anuphan',
                    confirmButton: 'rounded-xl px-4 py-2 font-anuphan'
                }
            });
            return;
        }

        Swal.fire({
            title: `ยืนยันการเบิกสินค้า ${totalItemsInCart} ชิ้น ?`,
            html: `วันที่เบิก: <strong>${formatThaiDate(withdrawDate)}</strong>`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "ยืนยัน",
            cancelButtonText: "ยกเลิก",
            customClass: {
                popup: 'rounded-2xl font-anuphan',
                confirmButton: 'rounded-xl px-4 py-2 font-anuphan',
                cancelButton: 'rounded-xl px-4 py-2 font-anuphan'
            },
        }).then((confirmResult) => {
            if (!confirmResult.isConfirmed) return;

            const items = cart.map((i) => ({
                good_id: i.GoodID,
                qty: i.qty
            }));

            Swal.fire({
                title: "กำลังสร้างคำสั่งเบิก...",
                customClass: { popup: 'rounded-2xl font-anuphan' },
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            });

            // ✅ ใช้ชื่อ route ที่ Laravel ตั้งไว้ (store-orders.store)
            router.post(route('store-orders.store'), {
                items,
                note,
                withdraw_date: withdrawDate,
            }, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: (page) => {
                    Swal.close();

                    const flashData = page.props.flash;

                    Swal.fire({
                        icon: "success",
                        title: flashData?.message || "✅ ทำการเบิกสำเร็จ",
                        html: flashData?.document_number
                            ? `เลขที่เอกสาร: <strong>${flashData.document_number}</strong>`
                            : `เลขที่คำสั่งเบิก: <strong>${flashData?.order_id || 'N/A'}</strong>`,
                        customClass: {
                            popup: 'rounded-2xl font-anuphan',
                            confirmButton: 'rounded-xl px-4 py-2 font-anuphan'
                        }
                    });

                    // ✅ เคลียร์ตะกร้า
                    setCart([]);
                    setAdjustedGoods({});
                    setShowCart(false);
                    setCartPage(1);
                    setNote("");

                    // ✅ รีโหลดข้อมูลสินค้าใหม่ (ถ้ามี route index)
                    router.visit(route('store-orders.index'), {
                        only: ['goods'],
                        preserveState: true
                    });
                },
                onError: (errors) => {
                    Swal.close();
                    Swal.fire({
                        icon: "error",
                        title: "❌ เกิดข้อผิดพลาดในการสร้าง",
                        text: Object.values(errors).join(', '),
                        customClass: {
                            popup: 'rounded-2xl font-anuphan',
                            confirmButton: 'rounded-xl px-4 py-2 font-anuphan'
                        }
                    });
                }
            });
        });
    };


    // ฟังก์ชันจัดรูปแบบวันที่เป็นภาษาไทย
    const formatThaiDate = (dateString: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('th-TH', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };


    return (
        <AppLayout
            breadcrumbs={[
                { title: 'หน้าหลัก', href: route('dashboard') },
                { title: 'การเบิกสินค้า', href: route('StoreIssue.index') },
            ]}
        >
            <div className="p-6 space-y-6 w-full mx-auto  font-anuphan">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-white rounded-2xl shadow-sm border">
                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                                เลือกสินค้าเพื่อเบิก
                            </h1>
                            <p className="text-gray-600 mt-1 text-sm md:text-base">
                                ค้นหาและเลือกสินค้าที่ต้องการเบิกจากคลังสินค้า
                            </p>
                        </div>
                    </div>

                    {/* Cart Toggle Button for Mobile */}
                    <button
                        onClick={() => setShowCart(!showCart)}
                        className="lg:hidden flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        ตะกร้า ({cart.length})
                        {showCart ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* Cart Status Bar */}
                {cart.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="font-medium text-green-700">มีสินค้าในตะกร้า {totalItemsInCart} ชิ้น จาก {cart.length} รายการ</span>
                        </div>
                        <button
                            onClick={handleSubmit}
                            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-md flex items-center transition-all transform hover:-translate-y-0.5 whitespace-nowrap"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            ยืนยันการเบิก
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Left Sidebar - Categories */}
                    <div className="lg:col-span-1 bg-white p-5 rounded-2xl shadow-lg h-fit sticky top-4">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                            </svg>
                            หมวดหมู่สินค้า
                        </h2>

                        <div className="space-y-2">
                            {categories.map(category => (
                                <button
                                    key={category}
                                    onClick={() => {
                                        setSelectedCategory(category);
                                        setCurrentPage(1);
                                    }}
                                    className={`w-full text-left px-4 py-3 rounded-xl transition-all ${selectedCategory === category
                                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 text-blue-700 font-medium'
                                        : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main Content - Products */}
                    <div className="lg:col-span-2">
                        {/* Search Bar */}
                        <div className="mb-6 relative">
                            <svg
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="ค้นหาชื่อ, รหัส หรือประเภทสินค้า..."
                                className="border rounded-xl px-4 py-3 pl-10 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>

                        {/* Products Table */}
                        <div className="overflow-x-auto bg-white shadow-lg rounded-2xl">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 text-left rounded-t-2xl">
                                        <th className="p-4 border-b font-semibold text-sm w-[160px]">รหัสสินค้า</th>
                                        <th className="p-4 border-b font-semibold text-sm">ชื่อสินค้า</th>
                                        <th className="p-4 border-b font-semibold text-sm w-[150px]">ประเภทสินค้า</th>
                                        <th className="p-4 border-b font-semibold text-sm w-[120px] text-center">พร้อมเบิก</th>
                                        <th className="p-4 border-b font-semibold text-sm text-center">การดำเนินการ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.map((g) => (
                                        <tr
                                            key={g.GoodID}
                                            className="hover:bg-blue-50 transition-colors border-b last:border-b-0"
                                        >
                                            <td className="p-4 font-mono text-blue-600 font-medium">{g.GoodCode}</td>
                                            <td className="p-4 font-medium">{g.GoodName}</td>
                                            <td className="p-4">
                                                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                                                    {g.ProductType || "-"}
                                                </span>
                                            </td>

                                            <td className="p-4 text-center font-medium">
                                                {g.availableQty && g.availableQty > 0 ? (
                                                    <span className="text-green-600">
                                                        {g.availableQty.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} {g.GoodStockUnitName || 'หน่วย'}
                                                    </span>
                                                ) : (
                                                    <span className="text-red-500 font-semibold">0</span>
                                                )}
                                            </td>

                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => addToCart(g)}
                                                    disabled={!g.availableQty || g.availableQty === 0}
                                                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center mx-auto transition-all transform hover:scale-105
                                                    ${g.availableQty && g.availableQty > 0
                                                            ? 'bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white'
                                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                        }`}
                                                >
                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                    </svg>
                                                    เพิ่ม
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination สำหรับสินค้า */}
                        {totalPages > 1 && (
                            <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="text-sm text-gray-500">
                                    แสดง {Math.min(itemsPerPage, currentItems.length)} จาก {categorizedGoods.length} รายการ
                                </div>

                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => goToPage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="px-4 py-2 bg-white rounded-xl shadow-sm text-gray-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                        ก่อนหน้า
                                    </button>

                                    <div className="flex space-x-1">
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
                                                <button
                                                    key={pageNum}
                                                    onClick={() => goToPage(pageNum)}
                                                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${currentPage === pageNum
                                                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                                                        : 'bg-white text-gray-700 hover:bg-gray-100 shadow-sm'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button
                                        onClick={() => goToPage(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="px-4 py-2 bg-white rounded-xl shadow-sm text-gray-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        ถัดไป
                                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Sidebar - Cart (Hidden on mobile by default) */}
                    <div className={`lg:col-span-1 bg-white shadow-lg rounded-2xl p-5 h-fit lg:sticky top-4 border border-gray-100 ${showCart ? 'block' : 'hidden lg:block'}`}>
                        <div className="flex justify-between items-center mb-5 pb-3 border-b">
                            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                                <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                ตะกร้าสินค้า
                                <span className="ml-2 bg-blue-100 text-blue-600 rounded-full px-2 py-1 text-sm">
                                    {cart.length} รายการ
                                </span>
                            </h2>
                            {cart.length > 0 && (
                                <button
                                    onClick={() => clearCart()}
                                    className="text-red-400 hover:text-red-600 p-1 text-sm transition-colors"
                                    title="ลบสินค้าทั้งหมด"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {cart.length === 0 ? (
                            <div className="text-center py-16 px-6">
                                <div className="flex flex-col items-center justify-center space-y-4">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-medium text-gray-600">ตะกร้าว่างเปล่า</h3>
                                        <p className="text-gray-500 text-sm">
                                            เลือกสินค้าจากรายการเพื่อเริ่มเบิก
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* วันที่เบิก */}
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <label className="block text-sm font-medium text-blue-700 mb-2 flex items-center">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        วันที่เบิกสินค้า
                                    </label>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="date"
                                            value={withdrawDate}
                                            onChange={(e) => setWithdrawDate(e.target.value)}
                                            className="flex-1 border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                                        />
                                        <span className="text-sm text-blue-600 font-medium whitespace-nowrap">
                                            {formatThaiDate(withdrawDate)}
                                        </span>
                                    </div>
                                </div>


                                <div className="overflow-x-auto max-h-96 pr-2">
                                    <table className="w-full border-collapse">
                                        <thead className="sticky top-0 bg-white">
                                            <tr className="text-gray-700 text-left bg-gray-50 rounded-xl">
                                                <th className="p-3 text-xs font-semibold uppercase">สินค้า</th>
                                                <th className="p-3 text-xs font-semibold uppercase text-center">จำนวน</th>
                                                <th className="p-3 text-xs font-semibold uppercase text-center">จัดการ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentCartItems.map((item) => (
                                                <tr key={item.GoodID} className="hover:bg-blue-50 transition-colors border-b last:border-b-0">
                                                    <td className="p-3">
                                                        <div className="font-medium text-sm">{item.GoodName}</div>
                                                        <div className="font-mono text-xs text-blue-600">{item.GoodCode}</div>
                                                        {item.ProductType && (
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                {item.ProductType}
                                                            </div>
                                                        )}
                                                        <div className="text-xs text-gray-400 mt-1">
                                                            พร้อมเบิก: {item.availableQty} {item.GoodStockUnitName || 'หน่วย'}
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <div className="flex flex-col items-center space-y-2">
                                                           
                                                            <input
                                                                type="number"
                                                                step="0.1"
                                                                min="0"
                                                                value={item.qty}
                                                                onChange={(e) => handleQtyChange(item.GoodID, e.target.value)}
                                                                onFocus={(e) => e.target.select()} // ← เพิ่มบรรทัดนี้
                                                                className="w-24 px-3 py-2 text-center border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                                                            />



                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <button
                                                            onClick={() => removeFromCart(item.GoodID)}
                                                            className="text-red-400 hover:text-red-600 p-1 text-sm transition-colors"
                                                            title="ลบออกจากตะกร้า"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* หมายเหตุ */}
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        หมายเหตุ
                                    </label>
                                    <textarea
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        placeholder="กรอกหมายเหตุเพิ่มเติม (ถ้ามี)"
                                        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-shadow"
                                        rows={3}
                                    />
                                </div>

                                {/* Cart Pagination */}
                                {totalCartPages > 1 && (
                                    <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                                        <span className="text-xs text-gray-500">
                                            หน้า {cartPage} จาก {totalCartPages}
                                        </span>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => goToCartPage(cartPage - 1)}
                                                disabled={cartPage === 1}
                                                className="px-3 py-1 bg-white rounded-lg shadow-sm text-gray-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs"
                                            >
                                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                </svg>
                                                ก่อนหน้า
                                            </button>

                                            <button
                                                onClick={() => goToCartPage(cartPage + 1)}
                                                disabled={cartPage === totalCartPages}
                                                className="px-3 py-1 bg-white rounded-lg shadow-sm text-gray-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs"
                                            >
                                                ถัดไป
                                                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-6 pt-4 border-t border-gray-200">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-md font-semibold text-gray-700">รวมทั้งหมด:</span>
                                        <span className="text-blue-600 font-bold">{totalItemsInCart} ชิ้น</span>
                                    </div>
                                    <button
                                        onClick={handleSubmit}
                                        className="w-full px-5 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-md flex items-center justify-center transition-all transform hover:-translate-y-0.5"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        ยืนยันการเบิก
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
