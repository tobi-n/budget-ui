// data-changed.service.ts
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DataChangedService {
  private dataChangedSource = new Subject<void>();

  dataChanged$ = this.dataChangedSource.asObservable();

  emitDataChanged(): void {
    this.dataChangedSource.next();
  }
}
