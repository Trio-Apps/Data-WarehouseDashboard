import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../pages/Services/auth.service';
import {
  SapSyncEntityKey,
  SapSyncResetResponse,
  SapSyncStateResponse
} from '../Models/sap-sync-reset.model';

@Injectable({
  providedIn: 'root'
})
export class SapSyncResetService {
  private baseUrl = environment.apiUrl;

  private readonly endpointByEntity: Record<SapSyncEntityKey, string> = {
    item: 'item',
    warehouse: 'warehouse',
    purchase: 'purchase',
    count: 'count',
    businessPartners: 'business-partners',
    itemUomGroup: 'item-uom-group',
    sales: 'sales'
  };

  headerOption;

  constructor(private http: HttpClient, private auth: AuthService) {
    this.headerOption = {
      headers: new HttpHeaders({
        accept: '*/*',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.auth.getToken()}`
      })
    };
  }

  getCompanySyncState(): Observable<SapSyncStateResponse> {
    return this.http.get<SapSyncStateResponse>(`${this.baseUrl}SapSyncReset/all-sync`, this.headerOption);
  }

  resetSyncByEntity(entity: SapSyncEntityKey, sapId: number): Observable<SapSyncResetResponse> {
    return this.resetSync(this.endpointByEntity[entity], sapId);
  }

  resetItemSync(sapId: number): Observable<SapSyncResetResponse> {
    return this.resetSyncByEntity('item', sapId);
  }

  resetWarehouseSync(sapId: number): Observable<SapSyncResetResponse> {
    return this.resetSyncByEntity('warehouse', sapId);
  }

  resetPurchaseSync(sapId: number): Observable<SapSyncResetResponse> {
    return this.resetSyncByEntity('purchase', sapId);
  }

  resetCountSync(sapId: number): Observable<SapSyncResetResponse> {
    return this.resetSyncByEntity('count', sapId);
  }

  resetBusinessPartnersSync(sapId: number): Observable<SapSyncResetResponse> {
    return this.resetSyncByEntity('businessPartners', sapId);
  }

  resetItemUomGroupSync(sapId: number): Observable<SapSyncResetResponse> {
    return this.resetSyncByEntity('itemUomGroup', sapId);
  }

  resetSalesSync(sapId: number): Observable<SapSyncResetResponse> {
    return this.resetSyncByEntity('sales', sapId);
  }

  private resetSync(endpoint: string, sapId: number): Observable<SapSyncResetResponse> {
    return this.http.patch<SapSyncResetResponse>(`${this.baseUrl}SapSyncReset/${endpoint}/${sapId}`, {}, this.headerOption);
  }
}
