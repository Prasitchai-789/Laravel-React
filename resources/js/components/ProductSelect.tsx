"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Product = {
  id: number;
  name: string;
  category?: string;
  price?: number;
  stock?: number;
};

interface ProductSelectProps {
  products: Product[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  showSearch?: boolean;
  showClear?: boolean;
  disabled?: boolean;
}

export default function ProductSelect({
  products,
  value,
  onChange,
  placeholder = "เลือกสินค้า",
  className,
  showSearch = true,
  showClear = true,
  disabled = false,
}: ProductSelectProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [open, setOpen] = React.useState(false);

  const filteredProducts = React.useMemo(() => {
    if (!searchTerm) return products;
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const selectedProduct = React.useMemo(() => {
    return products.find(product => product.id.toString() === value);
  }, [products, value]);

  const clearSelection = () => {
    if (onChange) {
      onChange("");
    }
  };

  return (
    <div className={cn("relative", className)}>
      <Select
        value={value}
        onValueChange={onChange}
        open={open}
        onOpenChange={setOpen}
        disabled={disabled}
      >
        <SelectTrigger
          className={cn(
            "w-full min-w-[240px] h-11 px-3 py-2 text-left rounded-lg border border-gray-300 bg-white",
            "focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500",
            "hover:border-gray-400 transition-colors duration-200",
            disabled && "opacity-50 cursor-not-allowed",
            "flex items-center justify-between"
          )}
        >
          <div className="flex items-center gap-2 flex-1 overflow-hidden">
            {selectedProduct ? (
              <>
                <div className="flex-1 truncate">
                  <span className="font-medium">{selectedProduct.name}</span>
                  {selectedProduct.price && (
                    <span className="text-sm text-gray-500 ml-2">
                      ฿{selectedProduct.price.toLocaleString()}
                    </span>
                  )}
                </div>
                {showClear && value && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearSelection();
                    }}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <X size={14} className="text-gray-500" />
                  </button>
                )}
              </>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </div>
          <ChevronDown
            size={16}
            className={cn(
              "text-gray-500 transition-transform duration-200",
              open && "transform rotate-180"
            )}
          />
        </SelectTrigger>
        <SelectContent
          className="p-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-[300px] overflow-y-auto"
          position="popper"
          sideOffset={4}
        >
          {showSearch && (
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="ค้นหาสินค้า..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <SelectItem
                key={product.id}
                value={product.id.toString()}
                className={cn(
                  "px-3 py-2 rounded-md cursor-pointer transition-colors",
                  "hover:bg-green-50 focus:bg-green-50",
                  "flex items-center justify-between"
                )}
              >
                <div className="flex-1">
                  <div className="font-medium">{product.name}</div>
                  {product.category && (
                    <div className="text-xs text-gray-500 mt-1">{product.category}</div>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    {product.price && (
                      <span className="text-sm text-green-600">
                        ฿{product.price.toLocaleString()}
                      </span>
                    )}
                    {product.stock !== undefined && (
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        product.stock > 10 ? "bg-green-100 text-green-800" :
                        product.stock > 0 ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      )}>
                        {product.stock > 0 ? `มีสต็อก ${product.stock}` : "สินค้าหมด"}
                      </span>
                    )}
                  </div>
                </div>
                {value === product.id.toString() && (
                  <Check size={16} className="text-green-600 ml-2 flex-shrink-0" />
                )}
              </SelectItem>
            ))
          ) : (
            <div className="px-3 py-4 text-center text-gray-500">
              {searchTerm ? "ไม่พบสินค้าที่ค้นหา" : "ไม่มีสินค้า"}
            </div>
          )}
        </SelectContent>
      </Select>

      {/* ข้อมูลเพิ่มเติมเมื่อเลือกสินค้าแล้ว */}
      {selectedProduct && (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium text-gray-800">{selectedProduct.name}</h4>
              {selectedProduct.category && (
                <p className="text-sm text-gray-600">หมวดหมู่: {selectedProduct.category}</p>
              )}
            </div>
            {selectedProduct.price && (
              <span className="text-lg font-bold text-green-600">
                ฿{selectedProduct.price.toLocaleString()}
              </span>
            )}
          </div>
          {selectedProduct.stock !== undefined && (
            <div className="mt-2 flex items-center">
              <span className={cn(
                "text-sm",
                selectedProduct.stock > 10 ? "text-green-600" :
                selectedProduct.stock > 0 ? "text-yellow-600" :
                "text-red-600"
              )}>
                {selectedProduct.stock > 0 ?
                  `มีสินค้าในสต็อก ${selectedProduct.stock} ชิ้น` :
                  "สินค้าหมด"
                }
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
