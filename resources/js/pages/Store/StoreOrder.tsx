import React, { useState, useMemo, useEffect } from "react";
import { Head, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import Swal from "sweetalert2";

interface Good {
  GoodID: string;
  GoodName: string;
  GoodCode: string;
  GoodStockUnitCode: string;
  ProductType?: string;
  DeptID?: string;
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
  // ถ้ามี mapping ของรหัสเต็ม ใช้ก่อน
  if (codeToCategory[goodCode]) return codeToCategory[goodCode];

  // ถ้าไม่มี mapping ของรหัสเต็ม ก็ลองใช้ prefix 2 ตัว
  const prefix = goodCode.split("-").slice(0, 2).join("-");
  return codeToCategory[prefix] || "ไม่มีประเภท";
}

export default function StoreOrder({ goods = [], flash }: Props) {
  const goodsWithType: Good[] = useMemo(() => {
    return goods.map((g) => ({ ...g, ProductType: getProductType(g.GoodCode) }));
  }, [goods]);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>("ทั้งหมด");
  const [cartPage, setCartPage] = useState<number>(1);
  const [showCart, setShowCart] = useState<boolean>(false);
  const [note, setNote] = useState("");

  // แสดง Swal เมื่อมี flash message จาก backend
  useEffect(() => {
    if (flash?.success && flash?.message) {
      Swal.fire({
        icon: 'success',
        title: flash.message,
        timer: 2000,
        showConfirmButton: false
      }).then(() => {
        // ล้างตะกร้าและรีเซ็ตสถานะ
        setCart([]);
        setShowCart(false);
        setCartPage(1);

        // ล้าง flash message โดยโหลดหน้าใหม่
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

  const filteredGoods = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return goodsWithType.filter(
      (g) =>
        g.GoodName.toLowerCase().includes(term) ||
        g.GoodCode.toLowerCase().includes(term) ||
        (g.ProductType?.toLowerCase().includes(term) ?? false)
    );
  }, [goodsWithType, searchTerm]);



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
    const available = good.availableQty ?? 0;

    if (available <= 0) {
      Swal.fire({
        icon: "warning",
        title: `⚠ สินค้า "${good.GoodName}" ไม่พร้อมใช้งาน`,
        timer: 1500,
        showConfirmButton: false,
      });
      return; // ไม่เพิ่มถ้าไม่มีพร้อมเบิก
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.GoodID === good.GoodID);

      if (existing) {
        const newQty = Math.min(existing.qty + 1, available);
        if (existing.qty >= available) {
          Swal.fire({
            icon: "warning",
            title: `⚠ จำนวนสินค้าถึงสูงสุดแล้ว`,
            timer: 1500,
            showConfirmButton: false,
          });
        }
        return prev.map((i) =>
          i.GoodID === good.GoodID ? { ...i, qty: newQty } : i
        );
      }

      return [...prev, { ...good, qty: 1 }];
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
    }).then((result) => {
      if (result.isConfirmed) {
        setCart([]);
        setCartPage(1);
        // Swal.fire({
        //   icon: 'success',
        //   title: 'ลบสินค้าทั้งหมดเรียบร้อยแล้ว',
        //   timer: 1200,
        //   showConfirmButton: false,
        // });
      }
    });
  };



  const decreaseQty = (goodId: string) => {
    setCart((prev) =>
      prev
        .map((i) => (i.GoodID === goodId ? { ...i, qty: Math.max(1, i.qty - 1) } : i))
        .filter((i) => i.qty > 0)
    );
  };


  const increaseQty = (goodId: string) => {
    setCart((prev) =>
      prev.map((i) => {
        const maxQty = i.availableQty ?? Infinity; // จำนวนสูงสุด
        if (i.GoodID === goodId) {
          if (i.qty >= maxQty) {
            // แจ้งเตือนถ้าเกินจำนวน
            Swal.fire({
              icon: "warning",
              title: "⚠ จำนวนสินค้าถึงสูงสุดแล้ว",
              timer: 1500,
              showConfirmButton: false,
            });
            return i; // ไม่เพิ่มจำนวน
          }
          return { ...i, qty: i.qty + 1 }; // เพิ่มจำนวน
        }
        return i;
      })
    );
  };

  const formattedNumber = (num: number) => {
    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
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
    }).then((result) => {
      if (result.isConfirmed) {
        setCart(prev => prev.filter(i => i.GoodID !== goodId));
        Swal.fire({
          icon: 'success',
          title: `ลบสินค้า "${item.GoodName}" เรียบร้อยแล้ว`,
          timer: 1200,
          showConfirmButton: false,
        });
      }
    });
  };


  const categories = useMemo(() => {
    // ดึงหมวดทั้งหมดจากสินค้า
    const allCats = Array.from(new Set(goodsWithType.map(g => g.ProductType || "ไม่มีประเภท")));

    // สร้างลำดับใหม่: "ทั้งหมด" -> "ทั่วไป" -> อื่น ๆ
    const orderedCats = ["ทั้งหมด"];

    if (allCats.includes("ทั่วไป")) orderedCats.push("ทั่วไป");

    allCats.forEach(cat => {
      if (cat !== "ทั่วไป") orderedCats.push(cat);
    });

    return orderedCats;
  }, [goodsWithType]);


  const handleSubmit = () => {
    if (cart.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "⚠ กรุณาเลือกสินค้าที่ต้องการเบิก",
      });
      return;
    }

    Swal.fire({
      title: `ยืนยันการเบิกสินค้า ${totalItemsInCart} ชิ้น ?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
    }).then((confirmResult) => {
      if (!confirmResult.isConfirmed) return;

      const items = cart.map((i) => ({ good_id: i.GoodID, qty: i.qty }));

      Swal.fire({
        title: "กำลังสร้างคำสั่งเบิก...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      router.post("/StoreOrder", {
        user_id: 1,
        department_id: 1,
        items,
        note, // <-- ส่ง note ไปด้วย
      }, {
        preserveScroll: true,
        preserveState: true,
        onSuccess: (page) => {
          Swal.close();
          Swal.fire({
            icon: "success",
            title: "✅ ทำการเบิกสำเร็จ",
          });

          // เคลียร์ตะกร้า
          setCart([]);
          setShowCart(false);
          setCartPage(1);

          // ถ้า backend ส่ง order_id กลับ
          const orderId = page.props.order_id;
          console.log("Order ID:", orderId);
        },
        onError: (errors) => {
          Swal.close();
          Swal.fire({
            icon: "error",
            title: "❌ เกิดข้อผิดพลาดในการสร้าง",
            text: Object.values(errors).join(', '),
          });
        }
      });
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
          <div className=" w-full p-6 md:p-8 bg-white rounded-3xl shadow-sm">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              🛒 เลือกสินค้าเพื่อเบิก
            </h1>
            <p className="text-gray-500 mt-2 md:mt-3 text-sm md:text-base">
              เลือกสินค้าที่ต้องการเบิกจากคลัง
            </p>
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
                    <th className="p-4 border-b font-semibold text-sm w-[120px] text-center">พร้อมเบิก</th> {/* <-- ใหม่ */}

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
              <div className="text-center py-8">
                <div className="text-5xl mb-4 text-gray-200">🛒</div>
                <p className="text-gray-500 mb-2 font-medium">ไม่มีสินค้าในตะกร้า</p>
                <p className="text-sm text-gray-400">เลือกสินค้าจากรายการด้านข้างเพื่อเริ่มเบิกสินค้า</p>
              </div>
            ) : (
              <div className="space-y-4">
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
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => decreaseQty(item.GoodID)}
                                className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-lg text-xs hover:bg-gray-200 transition-colors"
                              >
                                -
                              </button>
                              <span className="w-8 text-center font-medium text-sm bg-gray-50 py-1 rounded-md">{item.qty}</span>
                              <button
                                onClick={() => increaseQty(item.GoodID)}
                                className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-lg text-xs hover:bg-gray-200 transition-colors"
                              >
                                +
                              </button>
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
                  <div className="mt-6 pt-4 border-t border-gray-200 space-y-4">
                    {/* หมายเหตุ */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        หมายเหตุ
                      </label>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="กรอกหมายเหตุเพิ่มเติม (ถ้ามี)"
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-shadow"
                        rows={3}
                      />
                    </div>
                  </div>
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