import { Component } from '@angular/core';
import { TableDirective } from '@coreui/angular';

@Component({
  selector: 'app-items',
  imports: [TableDirective],
  templateUrl: './items.component.html',
  styleUrl: './items.component.scss',
})
export class ItemsComponent {

}
