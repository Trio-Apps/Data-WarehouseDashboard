import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../pages/Services/auth.service';
import { AddReturn, AddReturnBatchRequest, AddReturnItemRequest, UpdateReturn, UpdateReturnBatchRequest, UpdateReturnItemRequest } from '../Models/retrun-model';
import { AddGeneralItemRequest, UpdateGeneralItemRequest } from '../../Models/general-order';

@Injectable({
  providedIn: 'root',
})
export class GoodsReturnService {
   private baseUrl = environment.apiUrl;

  headerOption;
  constructor(private http: HttpClient, private auth: AuthService) {
    this.headerOption = {
      headers: new HttpHeaders({
        'accept': "*/*",
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.auth.getToken()}`
      })
    };
  }

  /**
   * Get all Receipts for a warehouse with pagination
   * @param warehouseId Warehouse ID
   * @param pageNumber Page number (1-based)
   * @param pageSize Number of items per page
   */
  getGoodsReturnOrdersWithFilterationByWarehouse(
    pageNumber: number,
    pageSize: number,
    warehouseId: number,
    status?: string,
    postingDate?: string,
    dueDate?: string
  ): Observable<any> {
    const baseUrl = `${this.baseUrl}GoodsReturnOrder/dashboard/warehouse/status/posting-date/due-date/${warehouseId}/${pageNumber}/${pageSize}`;

    let params = new HttpParams();

    if (status) {
      params = params.set('status', status);
    }
    if (postingDate) {
      params = params.set('postingDate', postingDate);
    }
    if (dueDate) {
      params = params.set('dueDate', dueDate);
    }

    return this.http.get<any>(baseUrl, {
      headers: this.headerOption.headers,
      params: params
    });
  }


  /**
   * Get Return by Receipt order ID
   */
  getReturnByReceiptId(ReceiptOrderId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}GoodsReturnOrder/receipt-purchase-order/${ReceiptOrderId}`, this.headerOption);
  }

  getReturnById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}GoodsReturnOrder/${id}`, this.headerOption);
  }
createReturn(returnData: AddReturn): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}GoodsReturnOrder`, returnData, this.headerOption);
  }
  createReturnWithOutReference(returnData: AddReturn): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}GoodsReturnOrder/without-reference`, returnData, this.headerOption);
  }

   createReturnWithDefaultItems(returnData: AddReturn): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}GoodsReturnOrder/with-default-items`, returnData, this.headerOption);
  }

  /**
   * Update Return
   */
  updateReturn(ReturnId: number, ReturnData: UpdateReturn): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}GoodsReturnOrder/${ReturnId}`, ReturnData, this.headerOption);
  }

  /**
   * Delete Return order
   */
  deleteReturnOrder(returnId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}GoodsReturnOrder/${returnId}`, this.headerOption);
  }

  /**
   * Get Return items by Return ID
   */
  getReturnItemsByReturnId(ReturnId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}GoodsReturnOrderItem/goods-return-order/${ReturnId}`, this.headerOption);
  }

  

  /**
   * Add Return item 
   */
  addReturnItem(ReceiptOrderId: number, itemData: AddReturnItemRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}GoodsReturnOrderItem/receipt-purchase-order/${ReceiptOrderId}`, itemData, this.headerOption);
  }

     addReceiptItemByBarcode(returnOrderId: number, barcode: string): Observable<any> {
      const request: AddGeneralItemRequest = {
        barcode: {
          barCode: barcode
        }
      };
      return this.http.post<any>(`${this.baseUrl}GoodsReturnOrderItem/witout-reference/goods-return-order/${returnOrderId}/add-barcode-or-no/${true}`, request, this.headerOption);
    }

    addReturnItemByBarcode(returnOrderId: number, barcode: string): Observable<any> {
      return this.addReceiptItemByBarcode(returnOrderId, barcode);
    }
  
    /**
     * Add receipt item manually
     */
    addReceiptItemManually(returnOrderId: number, itemData: {
      uoMEntry: number;
      quantity: number;
      itemId: number;
    }): Observable<any> {
      const request: AddGeneralItemRequest = {
        item: itemData
      };
      return this.http.post<any>(`${this.baseUrl}GoodsReturnOrderItem/witout-reference/goods-return-order/${returnOrderId}/add-barcode-or-no/${false}`, request, this.headerOption);
    }

    addReturnItemManually(returnOrderId: number, itemData: {
      uoMEntry: number;
      quantity: number;
      itemId: number;
    }): Observable<any> {
      return this.addReceiptItemManually(returnOrderId, itemData);
    }

  /**
   * Update Return item
   */
  updateReturnItem(returnItemId:number, itemData: UpdateReturnItemRequest): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}GoodsReturnOrderItem/${returnItemId}`, itemData, this.headerOption);
  }


  
    /**
     * Update receipt item
     */
    updateReturnItemWithoutReference(returnItemId:number, itemData: UpdateGeneralItemRequest): Observable<any> {
      return this.http.put<any>(`${this.baseUrl}GoodsReturnOrderItem/witout-reference/${returnItemId}`, itemData, this.headerOption);
    }
  

  /**
   * Delete Return item
   */
  deleteReturnItem(ReturnItemId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}GoodsReturnOrderItem/${ReturnItemId}`, this.headerOption);
  }

   /**
   * Get Return batches by Return item ID
   */
  getReturnBatchesByItemId(ReturnItemId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}GoodsReturnOrderBatch/goods-return-order-item/${ReturnItemId}`, this.headerOption);
  }

  /**
   * Add Return batch
   */
  addReturnBatch(returnItemId: number, batchData: AddReturnBatchRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}GoodsReturnOrderBatch/goods-return-order-item/${returnItemId}`, batchData, this.headerOption);
  }

  /**
   * Update Return batch
   */
  updateReturnBatch(batchId: number, batchData: UpdateReturnBatchRequest): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}GoodsReturnOrderBatch/${batchId}`, batchData, this.headerOption);
  }

  /**
   * Delete Return batch
   */
  deleteReturnBatch(batchId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}GoodsReturnOrderBatch/${batchId}`, this.headerOption);
  }
}
