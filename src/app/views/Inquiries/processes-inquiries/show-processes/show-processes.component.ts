import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  CardModule,
  CardBodyComponent,
  CardHeaderComponent,
  ButtonModule,
  GridModule,
  GutterDirective
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';

@Component({
  selector: 'app-show-processes',
 imports: [
    CommonModule,
    CardModule,
    CardBodyComponent,
    CardHeaderComponent,
    ButtonModule,
    GridModule,
    GutterDirective,
    IconDirective
  ],
  templateUrl: './show-processes.component.html',
  styleUrl: './show-processes.component.scss',
})
export class ShowProcessesComponent implements OnInit {
  warehouseId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.warehouseId = +this.route.snapshot.paramMap.get('warehouseId')!;
  }
// 
  onCardClick(cardType: string): void {
    if (this.warehouseId) {
      // Navigate based on card type
      switch(cardType) {
        
          case 'barcodes':
          this.router.navigate(['/processes/item-barcodes', this.warehouseId]);
          break;

          case 'purchases':
          this.router.navigate(['/processes/purchases', this.warehouseId]);
          break;

          case 'sales':
          this.router.navigate(['/processes/sales', this.warehouseId]);
          break;

          case 'sales-return':
          this.router.navigate(['/processes/sales/sales-return-orders', this.warehouseId]);
          break;

          case 'delivery-note':
          this.router.navigate(['/processes/sales/delivery-note-orders', this.warehouseId]);
          break;

          case 'receipt':
          this.router.navigate(['/processes/purchases/receipt-orders', this.warehouseId]);
          break;
           case 'goods-return':
          this.router.navigate(['/processes/purchases/goods-return-orders', this.warehouseId]);
          break;
        default:
          console.log('Card clicked:', cardType);
      }
    }
  }
}

