import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ButtonModule,
  CardBodyComponent,
  CardHeaderComponent,
  CardModule,
  GridModule,
  GutterDirective
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';

interface ReportCard {
  type: 'transactions' | 'in-warehouse';
  title: string;
  description: string;
  icon: string;
  iconClass: string;
}

@Component({
  selector: 'app-show-reports',
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
  templateUrl: './show-reports.component.html',
  styleUrl: './show-reports.component.scss'
})
export class ShowReportsComponent implements OnInit {
  warehouseId: number | null = null;

  readonly cards: ReportCard[] = [
    {
      type: 'transactions',
      title: 'Transaction Report',
      description: 'Track all stock movements by type and date',
      icon: 'cilListRich',
      iconClass: 'icon-blue'
    },
    {
      type: 'in-warehouse',
      title: 'In-Warehouse Report',
      description: 'Check current on-hand quantities per item',
      icon: 'cilStorage',
      iconClass: 'icon-mint'
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.warehouseId = Number(this.route.snapshot.paramMap.get('warehouseId'));
    if (!Number.isFinite(this.warehouseId) || this.warehouseId <= 0) {
      this.warehouseId = null;
    }
  }

  onCardClick(cardType: ReportCard['type']): void {
    if (!this.warehouseId) {
      return;
    }

    if (cardType === 'transactions') {
      this.router.navigate(['/inquiries/show-transaction-report', this.warehouseId]);
      return;
    }

    this.router.navigate(['/inquiries/show-in-warehouse-report', this.warehouseId]);
  }
}
