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

type ProcessSection = 'purchasing' | 'outbound' | 'production' | 'inventory';

interface ProcessCard {
  type: string;
  title: string;
  description: string;
  icon: string;
  iconClass: string;
  sections: ProcessSection[];
}

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
  selectedSection: ProcessSection | null = null;

  private readonly allCards: ProcessCard[] = [
    {
      type: 'purchases',
      title: 'Purchases',
      description: 'Create & manage purchases',
      icon: 'cilBasket',
      iconClass: 'icon-emerald',
      sections: ['purchasing']
    },
    {
      type: 'receipt',
      title: 'Receipt Order',
      description: 'Receipt Return',
      icon: 'cilInbox',
      iconClass: 'icon-mint',
      sections: ['purchasing']
    },
    {
      type: 'goods-return',
      title: 'Goods Return Order',
      description: 'Goods Return',
      icon: 'cilInbox',
      iconClass: 'icon-green',
      sections: ['purchasing']
    },
    {
      type: 'sales',
      title: 'Sales Order',
      description: 'Customer orders',
      icon: 'cilDollar',
      iconClass: 'icon-blue',
      sections: ['outbound']
    },
    {
      type: 'delivery-note',
      title: 'Delivery Note',
      description: 'Delivery note orders',
      icon: 'cilShareBoxed',
      iconClass: 'icon-blue',
      sections: ['outbound']
    },
    {
      type: 'sales-return',
      title: 'Sales Return Order',
      description: 'Sales returns',
      icon: 'cilArrowLeft',
      iconClass: 'icon-blue',
      sections: ['outbound']
    },
    {
      type: 'transferred',
      title: 'Transferred',
      description: 'Stock transfers',
      icon: 'cilShareAll',
      iconClass: 'icon-purple',
      sections: ['inventory']
    },
    {
      type: 'transferred-stock',
      title: 'Transferred Stock',
      description: 'Transferred stock orders',
      icon: 'cilLayers',
      iconClass: 'icon-mint',
      sections: ['inventory']
    },
    {
      type: 'quantity-adjustment-stock',
      title: 'Quantity Adjustment',
      description: 'Quantity adjustment stock orders',
      icon: 'cilGrid',
      iconClass: 'icon-mint',
      sections: ['inventory']
    },
    {
      type: 'stock-counting',
      title: 'Stock Counting',
      description: 'Count and reconcile stock',
      icon: 'cilCalculator',
      iconClass: 'icon-mint',
      sections: ['inventory']
    },
    {
      type: 'production',
      title: 'Production',
      description: 'Manufacturing process',
      icon: 'cilIndustry',
      iconClass: 'icon-orange',
      sections: ['production']
    }
  ];

  visibleCards: ProcessCard[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.warehouseId = +this.route.snapshot.paramMap.get('warehouseId')!;

    const section = (this.route.snapshot.queryParamMap.get('section') || '').toLowerCase();
    this.selectedSection = this.parseSection(section);
    const selectedSection = this.selectedSection;
    this.visibleCards = selectedSection
      ? this.allCards.filter(card => card.sections.includes(selectedSection))
      : this.allCards;
  }

  private parseSection(section: string): ProcessSection | null {
    switch (section) {
      case 'purchasing':
      case 'outbound':
      case 'production':
      case 'inventory':
        return section;
      default:
        return null;
    }
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
        case 'transferred':
          this.router.navigate(['/processes/transferred-request', this.warehouseId]);
          break;
        case 'transferred-stock':
          this.router.navigate(['/processes/transferred-request/transferred-stock-orders', this.warehouseId]);
          break;
        case 'quantity-adjustment-stock':
          this.router.navigate([
            '/processes/quantity-adjustment-stock/quantity-adjustment-stock-orders',
            this.warehouseId
          ]);
          break;
        case 'stock-counting':
          this.router.navigate(['/processes/stock-counting/orders', this.warehouseId]);
          break;
        case 'production':
          this.router.navigate(['/processes/production/menu', this.warehouseId]);
          break;
        default:
          console.log('Card clicked:', cardType);
      }
    }
  }
}
