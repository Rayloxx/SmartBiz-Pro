import React, { useEffect } from 'react';

export interface ReceiptItem {
  name: string;
  qty: number;
  price: number;
}

export interface ReceiptData {
  receiptNo: string;
  date: string;
  cashier: string;
  items: ReceiptItem[];
  subtotal: number;
  vat: number;
  discount: number;
  total: number;
  paymentMethod: string;
  mpesaCode?: string;
}

interface ReceiptProps {
  data: ReceiptData | null;
  businessName?: string;
  location?: string;
  phone?: string;
  autoPrint?: boolean;
  onClose?: () => void;
}

const Receipt: React.FC<ReceiptProps> = ({ 
  data, 
  businessName = "SmartBiz Pro", 
  location = "Nairobi CBD", 
  phone = "0712 345 678",
  autoPrint = false,
  onClose
}) => {

  useEffect(() => {
    if (data && autoPrint) {
      // Allow DOM to render before triggering print
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [data, autoPrint]);

  if (!data) return null;

  return (
    <div id="receipt" className="font-mono text-sm leading-tight text-black bg-white p-4 mx-auto w-[80mm] min-h-[100px] border border-gray-200 printable-receipt shadow-xl relative">
      {/* Action Buttons for non-print view */}
      <div className="absolute top-2 right-2 flex gap-2 no-print drop-shadow-md">
         <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded">
           🖨️ Print
         </button>
         {onClose && (
           <button onClick={onClose} className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded">
             ❌ Close
           </button>
         )}
      </div>

      <div className="text-center mb-4">
        <h2 className="text-xl font-bold uppercase tracking-widest">{businessName}</h2>
        <p className="text-xs">{location}</p>
        <p className="text-xs">Tel: {phone}</p>
      </div>

      <div className="mb-3 text-xs">
        <p>Receipt: <span className="font-semibold">{data.receiptNo}</span></p>
        <p>Date: {new Date(data.date).toLocaleString('en-KE')}</p>
        <p>Cashier: {data.cashier}</p>
      </div>

      <div className="border-t border-dashed border-black my-2"></div>
      
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left font-semibold">
            <th className="py-1">Item</th>
            <th className="py-1 text-center">Qty</th>
            <th className="py-1 text-right">Price</th>
            <th className="py-1 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, index) => (
            <tr key={index} className="align-top">
              <td className="py-1 pr-1 w-2/5 break-words">{item.name}</td>
              <td className="py-1 text-center">{item.qty}</td>
              <td className="py-1 text-right">{item.price.toFixed(2)}</td>
              <td className="py-1 text-right">{(item.qty * item.price).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-dashed border-black my-2"></div>

      <div className="flex justify-between text-xs my-1">
        <span>Subtotal:</span>
        <span>{data.subtotal.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-xs my-1">
        <span>VAT (16%):</span>
        <span>{data.vat.toFixed(2)}</span>
      </div>
      {data.discount > 0 && (
        <div className="flex justify-between text-xs my-1">
          <span>Discount:</span>
          <span>-{data.discount.toFixed(2)}</span>
        </div>
      )}

      <div className="border-t border-dashed border-black my-2"></div>

      <div className="flex justify-between text-sm font-bold my-1">
        <span>GRAND TOTAL:</span>
        <span>KES {data.total.toFixed(2)}</span>
      </div>

      <div className="border-t border-dashed border-black my-2"></div>

      <div className="mb-4 text-xs">
        <p>Paid by: <span className="font-semibold">{data.paymentMethod}</span></p>
        {data.mpesaCode && (
          <p>M-Pesa Code: <span className="font-semibold">{data.mpesaCode}</span></p>
        )}
      </div>

      <div className="text-center text-xs mt-4 mb-2">
        <p className="font-semibold">*** THANK YOU ***</p>
        <p>Please come again</p>
        <p className="mt-1 text-[10px]">Goods once sold are not returnable</p>
      </div>

      {/* SVG Barcode logic stub */}
      <div className="mt-4 flex justify-center">
        <div className="w-48 h-10 border border-black flex items-center justify-center font-bold text-gray-500 tracking-[0.3em] overflow-hidden">
           ||||| | |||| || | | ||
        </div>
      </div>
      <p className="text-center text-[10px] mt-1">{data.receiptNo}</p>
    </div>
  );
};

export default Receipt;
