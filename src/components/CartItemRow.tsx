import Link from 'next/link';
import { TrashIcon } from '@/icons/TrashIcon';
import { getProductImageUrl } from '@/utils/colorUtils';
import type { CartItem } from '@/utils/fetchCart';
import Badge from './ui/Badge';
import Button from './ui/Button';
import QuantitySelector from './ui/QuantitySelector';

type CartItemProps = {
  item: CartItem;
  onQuantityChange: (itemId: number, newQuantity: number) => void;
  onRemove: (itemId: number) => void;
  onSaveForLater?: (item: CartItem) => void | Promise<void>;
};

const CartItemRow = ({ item, onQuantityChange, onRemove, onSaveForLater }: CartItemProps) => {
  const lowStock = item.variant.stock < 5;
  const outOfStock = item.variant.stock === 0;
  const stockDisplay = item.variant.stock > 10 ? '10+' : item.variant.stock.toString();

  return (
    <div className="bg-gray-100 p-4 rounded-lg shadow flex items-center gap-4">
      {/* Product Image */}
      <Link
        href={`/pdp/${item.product.id}`}
        className="w-24 h-24 rounded overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
      >
        <img
          src={getProductImageUrl(item.variant.color, 200, 200)}
          alt={item.product.name}
          className="w-full h-full object-cover"
        />
      </Link>

      {/* Product Info */}
      <div className="flex-1">
        <Link
          href={`/pdp/${item.product.id}`}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          <h3 className="font-semibold text-lg text-gray-800">{item.product.name}</h3>
        </Link>
        <p className="text-sm text-gray-600">{item.product.category}</p>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-sm text-gray-600">
            Color: {item.variant.color} | Size: {item.variant.size}
          </p>
          {!outOfStock && (
            <Badge variant={lowStock ? 'warning' : 'success'}>Stock: {stockDisplay}</Badge>
          )}
          {outOfStock && <Badge variant="error">Out of stock</Badge>}
        </div>
        {lowStock && !outOfStock && (
          <p className="text-sm text-yellow-700 font-light mt-1">
            Only {item.variant.stock} left in stock
          </p>
        )}
        <p className="font-semibold text-gray-800 mt-2">${item.product.price.toFixed(2)}</p>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-start gap-3">
        <div className="flex flex-col gap-2">
          <QuantitySelector
            value={item.quantity}
            onChange={(newQuantity) => onQuantityChange(item.id, newQuantity)}
            min={1}
          />
          {onSaveForLater && (
            <Button
              variant="secondary"
              onClick={() => onSaveForLater(item)}
              className="text-xs font-light py-1 px-3"
            >
              Save for Later
            </Button>
          )}
        </div>
        <Button
          type="button"
          onClick={() => onRemove(item.id)}
          variant="ghost"
          className="h-7 w-7 p-0 hover:bg-gray-200"
          aria-label="Remove item"
        >
          <TrashIcon className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default CartItemRow;
