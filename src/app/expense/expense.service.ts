import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {AllCategoryCriteria, Category, CategoryCriteria, Expense, ExpenseCriteria, Page} from '../shared/domain';
import { environment } from '../../environments/environment';


@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private readonly apiUrl = `${environment.backendURL}/expenses`;
  private readonly apiV2Url = `${environment.backendURL}/v2/expenses`;

  constructor(private readonly httpClient: HttpClient) {
  }


  getExpenses = (pagingCriteria: ExpenseCriteria): Observable<Page<Expense>> =>
    this.httpClient.get<Page<Expense>>(this.apiUrl, {params: new HttpParams({fromObject: {...pagingCriteria}})});


}
