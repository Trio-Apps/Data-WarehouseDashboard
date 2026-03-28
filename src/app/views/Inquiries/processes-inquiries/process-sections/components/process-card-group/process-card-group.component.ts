import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CardBodyComponent, CardModule, GridModule, GutterDirective } from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { ProcessCard } from '../../models/process-card.model';

@Component({
  selector: 'app-process-card-group',
  imports: [
    CommonModule,
    CardModule,
    CardBodyComponent,
    GridModule,
    GutterDirective,
    IconDirective
  ],
  templateUrl: './process-card-group.component.html',
  styleUrl: './process-card-group.component.scss'
})

export class ProcessCardGroupComponent {
  @Input({ required: true }) title = '';
  @Input({ required: true }) cards: ProcessCard[] = [];
  @Output() cardClick = new EventEmitter<string>();

  onCardClick(cardType: string): void {
    this.cardClick.emit(cardType);
  }
}
