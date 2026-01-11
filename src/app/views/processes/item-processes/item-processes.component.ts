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
  selector: 'app-item-processes',
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
  templateUrl: './item-processes.component.html',
  styleUrl: './item-processes.component.scss',
})
export class ItemProcessesComponent implements OnInit {
  itemId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.itemId = +this.route.snapshot.paramMap.get('itemId')!;
  }

  onCardClick(cardType: string): void {
    if (this.itemId) {
      // Navigate based on card type
      switch(cardType) {
        case 'barcodes':
          this.router.navigate(['/processes/item-barcodes', this.itemId]);
          break;
        case 'purchases':
          this.router.navigate(['/processes/purchases', this.itemId]);
          break;
        case 'sales':
          this.router.navigate(['/processes/sales', this.itemId]);
          break;
        default:
          console.log('Card clicked:', cardType);
      }
    }
  }
}
