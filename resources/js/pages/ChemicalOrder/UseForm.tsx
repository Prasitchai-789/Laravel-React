import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import Swal from 'sweetalert2';

interface Chemical {
  id: number;
  name: string;
}

interface Item {
  chemical_id?: number;
  quantity?: number;
  unit?: string;
  unit_price?: number;
  expiry_date?: string;
  images?: Array<{ id: number; url: string }>; // เพิ่ม images ในแต่ละ item
}

interface ImageFile {
  id?: number;
  file?: File;
  url?: string;
  isNew?: boolean;
  itemIndex?: number; // เพิ่ม itemIndex เพื่อระบุว่ารูปภาพอยู่ใน item ใด
}

interface UseFormProps {
  mode: 'create' | 'edit';
  data?: {
    id?: number;
    lot_number?: string;
    order_date?: string;
    items?: Item[];
    images?: Array<{ id: number; url: string }>;
  };
  chemicals?: Chemical[];
  onClose: () => void;
  onSuccess?: () => void;
}

export default function UseForm({ mode, data, chemicals = [], onClose, onSuccess }: UseFormProps) {
  const [lotNumber, setLotNumber] = useState(data?.lot_number || '');
  const [orderDate, setOrderDate] = useState(data?.order_date || '');
  const [items, setItems] = useState<Item[]>(data?.items || [{ chemical_id: undefined, quantity: 0, unit: '', unit_price: 0, expiry_date: '' }]);
  const [itemImages, setItemImages] = useState<{[key: number]: ImageFile[]}>({}); // เก็บรูปภาพของแต่ละ item
  const [isDragging, setIsDragging] = useState(false);
  const [currentDragItem, setCurrentDragItem] = useState<number | null>(null); // เก็บ index ของ item ที่กำลัง drag

  // โหลดรูปภาพจากข้อมูลเดิม (ในโหมดแก้ไข)
  useEffect(() => {
    if (data?.items) {
      const initialItemImages: {[key: number]: ImageFile[]} = {};
      
      data.items.forEach((item, index) => {
        if (item.images && item.images.length > 0) {
          initialItemImages[index] = item.images.map(img => ({
            id: img.id,
            url: img.url,
            isNew: false,
            itemIndex: index
          }));
        }
      });
      
      setItemImages(initialItemImages);
    }
  }, [data]);

  // เพิ่มรายการใหม่
  const addItem = () => {
    const newItems = [...items, { chemical_id: undefined, quantity: 0, unit: '', unit_price: 0, expiry_date: '' }];
    setItems(newItems);
  };

  // ลบรายการ
  const removeItem = (index: number) => {
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
    
    // ลบรูปภาพที่เกี่ยวข้องกับ item นี้
    const updatedItemImages = {...itemImages};
    delete updatedItemImages[index];
    setItemImages(updatedItemImages);
  };

  // เปลี่ยนค่ารายการ
  const updateItem = (index: number, key: keyof Item, value: any) => {
    const updated = [...items];
    updated[index][key] = value;
    setItems(updated);
  };

  // จัดการการอัปโหลดไฟล์สำหรับแต่ละ item
  const handleItemFileChange = (e: React.ChangeEvent<HTMLInputElement>, itemIndex: number) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        url: URL.createObjectURL(file),
        isNew: true,
        itemIndex
      }));
      
      setItemImages(prev => ({
        ...prev,
        [itemIndex]: [...(prev[itemIndex] || []), ...newFiles]
      }));
    }
  };

  // ลบรูปภาพจาก item
  const removeItemImage = (itemIndex: number, imageIndex: number) => {
    const updatedItemImages = {...itemImages};
    if (updatedItemImages[itemIndex]) {
      updatedItemImages[itemIndex].splice(imageIndex, 1);
      setItemImages(updatedItemImages);
    }
  };

  // Drag and Drop handlers สำหรับแต่ละ item
  const handleItemDragOver = (e: React.DragEvent<HTMLDivElement>, itemIndex: number) => {
    e.preventDefault();
    setIsDragging(true);
    setCurrentDragItem(itemIndex);
  };

  const handleItemDragLeave = () => {
    setIsDragging(false);
    setCurrentDragItem(null);
  };

  const handleItemDrop = (e: React.DragEvent<HTMLDivElement>, itemIndex: number) => {
    e.preventDefault();
    setIsDragging(false);
    setCurrentDragItem(null);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).map(file => ({
        file,
        url: URL.createObjectURL(file),
        isNew: true,
        itemIndex
      }));
      
      setItemImages(prev => ({
        ...prev,
        [itemIndex]: [...(prev[itemIndex] || []), ...newFiles]
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // สร้าง FormData object สำหรับส่งข้อมูลรวมถึงไฟล์
    const formData = new FormData();
    formData.append('lot_number', lotNumber);
    formData.append('order_date', orderDate);
    
    // เพิ่ม items ข้อมูล
    const itemsData = items.map((item, index) => {
      const itemImagesData = itemImages[index] || [];
      const existingImageIds = itemImagesData
        .filter(img => !img.isNew && img.id)
        .map(img => img.id) as number[];
      
      return {
        ...item,
        existing_image_ids: existingImageIds
      };
    });
    
    formData.append('items', JSON.stringify(itemsData));
    
    // เพิ่มรูปภาพใหม่ลงใน FormData
    Object.entries(itemImages).forEach(([itemIndex, images]) => {
      images.forEach((image, imgIndex) => {
        if (image.isNew && image.file) {
          formData.append(`items[${itemIndex}][images][${imgIndex}]`, image.file);
        }
      });
    });

    if (mode === 'create') {
      router.post('/chemicalorder', formData, {
        onSuccess: () => {
          Swal.fire({ position: 'center', icon: 'success', title: 'เพิ่มสำเร็จ', showConfirmButton: false, timer: 1500 });
          onSuccess?.();
          onClose();
        },
        onError: (errors: any) => {
          Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: Object.values(errors).flat().join(', ') });
        },
        forceFormData: true,
      });
    } else if (mode === 'edit' && data?.id) {
      router.post(`/chemicalorder/${data.id}`, {
        ...formData,
        _method: 'put'
      }, {
        onSuccess: () => {
          Swal.fire({ position: 'center', icon: 'success', title: 'แก้ไขสำเร็จ', showConfirmButton: false, timer: 1500 });
          onSuccess?.();
          onClose();
        },
        onError: (errors: any) => {
          Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: Object.values(errors).flat().join(', ') });
        },
        forceFormData: true,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center p-4 z-50">
      <div className="relative bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-6 border-b border-gray-200 rounded-t-lg flex justify-between items-center z-10">
          <h3 className="text-xl font-semibold text-gray-800">
            {mode === 'create' ? 'เพิ่ม Order สารเคมี' : 'แก้ไข Order สารเคมี'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500 text-2xl">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lot Number</label>
              <input
                type="text"
                value={lotNumber}
                onChange={e => setLotNumber(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order Date</label>
              <input
                type="date"
                value={orderDate}
                onChange={e => setOrderDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-medium text-gray-800">รายการสารเคมี</h4>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                เพิ่มรายการ
              </button>
            </div>

            {items.map((item, idx) => (
              <div key={idx} className="bg-gray-50 p-4 rounded-lg mb-4 relative">
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="absolute top-3 right-3 text-red-500 hover:text-red-700"
                  aria-label="ลบรายการ"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">สารเคมี</label>
                    <select
                      value={item.chemical_id || ''}
                      onChange={e => updateItem(idx, 'chemical_id', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">เลือกสารเคมี</option>
                      {chemicals.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ปริมาณ</label>
                    <input
                      type="number"
                      placeholder="Quantity"
                      value={item.quantity}
                      onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">หน่วย</label>
                    <input
                      type="text"
                      placeholder="Unit"
                      value={item.unit}
                      onChange={e => updateItem(idx, 'unit', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ราคาต่อหน่วย</label>
                    <input
                      type="number"
                      placeholder="Unit Price"
                      value={item.unit_price}
                      onChange={e => updateItem(idx, 'unit_price', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">วันหมดอายุ</label>
                    <input
                      type="date"
                      placeholder="Expiry Date"
                      value={item.expiry_date || ''}
                      onChange={e => updateItem(idx, 'expiry_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* ส่วนอัปโหลดรูปภาพสำหรับแต่ละ item */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h5 className="text-md font-medium text-gray-700 mb-3">รูปภาพสำหรับสินค้านี้</h5>
                  
                  <div 
                    className={`border-2 border-dashed rounded-lg p-4 text-center ${isDragging && currentDragItem === idx ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                    onDragOver={(e) => handleItemDragOver(e, idx)}
                    onDragLeave={handleItemDragLeave}
                    onDrop={(e) => handleItemDrop(e, idx)}
                  >
                    <svg className="mx-auto h-8 w-8 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="mt-2 flex justify-center text-sm text-gray-600">
                      <label htmlFor={`file-upload-${idx}`} className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                        <span>อัปโหลดไฟล์</span>
                        <input 
                          id={`file-upload-${idx}`}
                          name={`file-upload-${idx}`}
                          type="file" 
                          className="sr-only" 
                          multiple 
                          accept="image/*"
                          onChange={(e) => handleItemFileChange(e, idx)}
                        />
                      </label>
                      <p className="pl-1">หรือลากและวางที่นี่</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF สูงสุด 10MB</p>
                  </div>

                  {/* แสดงภาพตัวอย่างสำหรับ item นี้ */}
                  {itemImages[idx] && itemImages[idx].length > 0 && (
                    <div className="mt-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {itemImages[idx].map((image, imgIdx) => (
                          <div key={imgIdx} className="relative group">
                            <img 
                              src={image.url} 
                              alt={`Uploaded ${imgIdx}`} 
                              className="h-24 w-full object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeItemImage(idx, imgIdx)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label="ลบรูปภาพ"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              {mode === 'create' ? 'เพิ่ม Order' : 'บันทึกการแก้ไข'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}