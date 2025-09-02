import { useState } from "react";
import { Inertia } from "@inertiajs/inertia";
import { useForm } from "@inertiajs/react";

export default function SaleForm({ onClose }) {
  const { data, setData, post, processing, errors } = useForm({
    customer: "",
    product: "",
    quantity: "",
    price: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    post("/sales", {
      onSuccess: () => {
        if (onClose) onClose();
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <input
        type="text"
        placeholder="ชื่อลูกค้า"
        value={data.customer}
        onChange={(e) => setData("customer", e.target.value)}
        className="border p-2 w-full rounded"
      />
      <input
        type="text"
        placeholder="สินค้า"
        value={data.product}
        onChange={(e) => setData("product", e.target.value)}
        className="border p-2 w-full rounded"
      />
      <input
        type="number"
        placeholder="จำนวน"
        value={data.quantity}
        onChange={(e) => setData("quantity", e.target.value)}
        className="border p-2 w-full rounded"
      />
      <input
        type="number"
        placeholder="ราคา"
        value={data.price}
        onChange={(e) => setData("price", e.target.value)}
        className="border p-2 w-full rounded"
      />

      <button
        type="submit"
        disabled={processing}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        บันทึก
      </button>
    </form>
  );
}
