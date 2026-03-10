import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CardBodyComponent, CardHeaderComponent, CardModule, ButtonModule } from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { ProcessCardGroupComponent } from './components/process-card-group/process-card-group.component';
import { ProcessCard } from './models/process-card.model';
import { navigateToProcessByCard } from './process-card-navigation';

@Component({
  selector: 'app-show-outbound-processes',
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    CardBodyComponent,
    CardHeaderComponent,
    IconDirective,
    ProcessCardGroupComponent
  ],
  templateUrl: './show-outbound-processes.component.html',
  styleUrl: './process-sections-page.component.scss',
})
export class ShowOutboundProcessesComponent implements OnInit {
  warehouseId: number | null = null;
  readonly cards: ProcessCard[] = [
    {
      type: 'sales',
      title: 'Sales Order',
      description: 'Customer orders',
      icon: 'cilDollar',
      iconClass: 'icon-blue'
    },
    {
      type: 'delivery-note',
      title: 'Delivery Note',
      description: 'Delivery note orders',
      icon: 'cilShareBoxed',
      iconClass: 'icon-blue'
    },
    {
      type: 'sales-return',
      title: 'Sales Return Order',
      description: 'Sales returns',
      icon: 'cilArrowLeft',
      iconClass: 'icon-blue'
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
