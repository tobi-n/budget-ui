import { Component } from '@angular/core';
import { addMonths, set } from 'date-fns';
import {InfiniteScrollCustomEvent, ModalController, RefresherCustomEvent} from '@ionic/angular';
import { ExpenseModalComponent } from '../expense-modal/expense-modal.component';
import {FormBuilder, FormGroup} from "@angular/forms";
import {debounce, finalize, interval, Subscription} from "rxjs";
import {Expense, ExpenseCriteria, SortOption} from "../../shared/domain";
import {ExpenseService} from "../expense.service";
import {ToastService} from "../../shared/service/toast.service";

@Component({
  selector: 'app-expense-overview',
  templateUrl: './expense-list.component.html',
})
export class ExpenseListComponent {
  date = set(new Date(), { date: 1 });
  loading = false;
  readonly initialSort = 'name,asc';
  expenses: Expense[] | null = null;
  lastPageReached = false;
  searchCriteria: ExpenseCriteria = { page: 0, size: 25, sort: this.initialSort };
  private readonly searchFormSubscription: Subscription;
  constructor(

    private readonly modalCtrl: ModalController,
    private readonly formBuilder: FormBuilder,
    private readonly expenseService: ExpenseService,
    private readonly toastService: ToastService,

  ) {
    this.searchForm = this.formBuilder.group({name: [], sort: [this.initialSort]});

    this.searchFormSubscription = this.searchForm.valueChanges
      .pipe(debounce((value) => interval(value.name?.length ? 400 : 0)))
      .subscribe((value) => {
        this.searchCriteria = { ...this.searchCriteria, ...value, page: 0 };
        this.loadExpenses();
      });

  }

  addMonths = (number: number): void => {
    this.date = addMonths(this.date, number);
  };

  async openModal(expense?: Expense): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: ExpenseModalComponent,
      componentProps: { expense: expense ? { ...expense } : {} },
    });
    modal.present();
    const { role } = await modal.onWillDismiss();
    console.log('role', role);
  }

  readonly searchForm: FormGroup;
  readonly sortOptions: SortOption[] = [
    { label: 'Created at (newest first)', value: 'createdAt,desc' },
    { label: 'Created at (oldest first)', value: 'createdAt,asc' },
    { label: 'Date (newest first)', value: 'createdAt,asc' },
    { label: 'Date (oldest first)', value: 'createdAt,asc' },
    { label: 'Name (A-Z)', value: 'name,asc' },
    { label: 'Name (Z-A)', value: 'name,desc' },
  ];


  private loadExpenses(next: () => void = () => {}): void {
    if (!this.searchCriteria.name) delete this.searchCriteria.name;
    this.loading = true;
    this.expenseService
      .getExpenses(this.searchCriteria)
      .pipe(
        finalize(() => {
          this.loading = false;
          next();
        }),
      )
      .subscribe({
        next: (expenses) => {
          if (this.searchCriteria.page === 0 || !this.expenses) this.expenses = [];
          this.expenses.push(...expenses.content);
          this.lastPageReached = expenses.last;
        },
        error: (error) => this.toastService.displayErrorToast('Could not load expenses', error),
      });
  }
    loadNextExpensePage($event: any) {
        this.searchCriteria.page++;
        this.loadExpenses(() => ($event as InfiniteScrollCustomEvent).target.complete());
    }

  reloadExpenses($event?: any): void {
    this.searchCriteria.page = 0;
    this.loadExpenses(() => ($event ? ($event as RefresherCustomEvent).target.complete() : {}));
  }

}
