import { Router } from '@angular/router';

export function navigateToProcessByCard(
  router: Router,
  warehouseId: number | null,
  cardType: string
): void {
  if (!warehouseId) {
    return;
  }

  switch (cardType) {
    case 'barcodes':
      router.navigate(['/processes/item-barcodes', warehouseId]);
      break;
    case 'purchases':
      router.navigate(['/processes/purchases', warehouseId]);
      break;
    case 'sales':
      router.navigate(['/processes/sales', warehouseId]);
      break;
    case 'sales-return':
      router.navigate(['/processes/sales/sales-return-orders', warehouseId]);
      break;
    case 'delivery-note':
      router.navigate(['/processes/sales/delivery-note-orders', warehouseId]);
      break;
    case 'receipt':
      router.navigate(['/processes/purchases/receipt-orders', warehouseId]);
      break;
    case 'goods-return':
      router.navigate(['/processes/purchases/goods-return-orders', warehouseId]);
      break;
    case 'transferred':
      router.navigate(['/processes/transferred-request', warehouseId]);
      break;
    case 'transferred-stock':
      router.navigate(['/processes/transferred-request/transferred-stock-orders', warehouseId]);
      break;
    case 'quantity-adjustment-stock':
      router.navigate(['/processes/quantity-adjustment-stock/quantity-adjustment-stock-orders', warehouseId]);
      break;
    case 'stock-counting':
      router.navigate(['/processes/stock-counting/menu', warehouseId]);
      break;
    case 'production':
      router.navigate(['/processes/production/menu', warehouseId]);
      break;
    default:
      console.log('Card clicked:', cardType);
  }
}
