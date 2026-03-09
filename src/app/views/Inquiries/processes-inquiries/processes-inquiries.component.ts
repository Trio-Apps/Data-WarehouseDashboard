import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { 
  FormModule, 
  CardModule, 
  ButtonModule, 
  GridModule,
  GutterDirective
} from '@coreui/angular';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { InquiryService } from '../Services/inquiry.service';
import { Warehouse } from '../Models/warehouse.model';
import {ChangeDetectionStrategy} from '@angular/core';
import {MatSelectModule} from '@angular/material/select';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { ToastrService } from 'ngx-toastr';


@Component({
  selector: 'app-processes-inquiries',
  imports: [
    CommonModule, 
    FormModule, 
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    GridModule,
    GutterDirective,
    MatAutocompleteModule, 
    MatButtonModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatSelectModule
  ],
  templateUrl: './processes-inquiries.component.html',
  styleUrl: './processes-inquiries.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProcessesInquiriesComponent {
  
  form!: FormGroup;
  options = ['Cairo', 'Giza', 'Alex', 'Aswan', 'Luxor', 'Suez'];
  warehouseList: Warehouse[] = [];
  filteredOption:  Warehouse[] = [];

  constructor(
    private fb: FormBuilder,
    private inquiryService: InquiryService, 
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      warehouseId: ['', Validators.required]
    });
    this.getSap();
    this.getWarehouses();
  }
cityControl = new FormControl();


onSearchChange(event: Event): void {
  const value = (event.target as HTMLInputElement).value.toLowerCase();

  this.filteredOption = this.warehouseList.filter(w =>
    w.warehouseName.toLowerCase().includes(value)
  );
}

onWarehouseSelected(warehouseId: number) {
  this.form.patchValue({
    warehouseId: warehouseId
  });
}

/** عشان يعرض الاسم بدل الـ id في input */
displayWarehouseName(id: number | null): string {
  const warehouse = this.warehouseList.find(w => w.warehouseId === id);
  return warehouse ? warehouse.warehouseName : '';
}
getWarehouses(){
  this.inquiryService.getWarehouses().subscribe({
  next:(res:any) =>{
    this.warehouseList = res.data.map((w:any) =>({
          warehouseId: w.warehouseId,
           warehouseName: w.warehouseName,
            sapId: w.sapId
    }));
    console.log(res);

    this.filteredOption = this.warehouseList;
    console.log(this.filteredOption);
    
    if (this.warehouseList.length > 0) {
      this.toastr.success(`Loaded ${this.warehouseList.length} warehouse(s) successfully`, 'Success');
    }

  },
  error:(err)=>{  
   console.log(err);
   this.toastr.error('Failed to load warehouses. Please try again.', err.error?.detail || 'Error' );
  }
  });
}
getSap(){
  this.inquiryService.getSap().subscribe({
  next:(res:any) =>{
    console.log("Sap Id :", res);
    if (res && res.data) {
      this.toastr.info('SAP connection loaded successfully', 'Info');
    }
  },
  error:(err)=>{  
   //console.log(err);
   // this.toastr.warning('Failed to load SAP connection', 'Warning');
  }
  });
}


submit() {
  if (this.form.invalid) {
    this.toastr.error('Please select a warehouse', 'Validation Error');
    return;
  }

  const warehouseId = this.form.value.warehouseId;
  const selectedWarehouse = this.warehouseList.find(w => w.warehouseId === warehouseId);
  
  if (selectedWarehouse) {
    this.toastr.success(`Warehouse ${selectedWarehouse.warehouseName} selected successfully.`, 'Success');
    this.router.navigate(['/dashboard'], {
      queryParams: { warehouseId }
    });
  } else {
    this.toastr.error('Invalid warehouse selected', 'Error');
  }
}


}
