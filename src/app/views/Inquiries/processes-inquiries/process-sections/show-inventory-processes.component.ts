import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CardBodyComponent, CardHeaderComponent, CardModule, ButtonModule } from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { ProcessCardGroupComponent } from './components/process-card-group/process-card-group.component';
import { ProcessCard } from './models/process-card.model';
import { navigateToProcessByCard } from './process-card-navigation';

@Component({
  selector: 'app-show-inventory-processes',
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    CardBodyComponent,
    CardHeaderComponent,
    IconDirective,
    ProcessCardGroupComponent
  ],
  templateUrl: './show-inventory-processes.component.html',
  styleUrl: './process-sections-page.component.scss',
})
export class ShowInventoryProcessesComponent implements OnInit {
  warehouseId: number | null = null;
  readonly cards: ProcessCard[] = [
    {
      type: 'transferred',
      title: 'Transferred Request',
      description: 'transfers',
      icon: 'cilShareAll',
      iconClass: 'icon-purple'
    },
    {
      type: 'transferred-stock',
      title: 'Transferred Stock',
      description: 'Transferred stock orders',
      icon: 'cilLayers',
      iconClass: 'icon-mint'
    },
    {
      type: 'transferred-received-stock',
      title: 'Transferred Received Stock',
      description: 'Received transferred stock orders',
      icon: 'cilInbox',
      iconClass: 'icon-green'
    },
    {
      type: 'quantity-adjustment-stock',
      title: 'Quantity Adjustment',
      description: 'Quantity adjustment stock orders',
      icon: 'cilGrid',
      iconClass: 'icon-mint'
    },
    {
      type: 'stock-counting',
      title: 'Stock Counting',
      description: 'Stock counting orders',
      icon: 'cilListRich',
      iconClass: 'icon-orange'
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const rawWarehouseId = this.route.snapshot.paramMap.get('warehouseId');
    const parsedWarehouseId = Number(rawWarehouseId);
    this.warehouseId = Number.isFinite(parsedWarehouseId) && parsedWarehouseId > 0 ? parsedWarehouseId : null;
  }

  onCardClick(cardType: string): void {
    navigateToProcessByCard(this.router, this.warehouseId, cardType);
  }

  goBackToDashboard(): void {
    if (this.warehouseId) {
      this.router.navigate(['/dashboard'], { queryParams: { warehouseId: this.warehouseId } });
      return;
    }
    this.router.navigate(['/dashboard']);
  }
}
