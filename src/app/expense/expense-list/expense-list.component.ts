import {Component, Input, NgModule} from '@angular/core';
import {addMonths, parse, set} from 'date-fns';
import {InfiniteScrollCustomEvent, ModalController, RefresherCustomEvent} from '@ionic/angular';
import { ExpenseModalComponent } from '../expense-modal/expense-modal.component';
import {FormBuilder, FormGroup, FormsModule} from "@angular/forms";
import {debounce, finalize, groupBy, interval, Observable, Subscription} from "rxjs";
import {CategoryCriteria, Expense, ExpenseCriteria, SortOption} from "../../shared/domain";
import {ExpenseService} from "../expense.service";
import {ToastService} from "../../shared/service/toast.service";
import {CategoryService} from "../../category/category.service";



@Component({
  selector: 'app-expense-overview',
  templateUrl: './expense-list.component.html',

})
export class ExpenseListComponent {
  date = set(new Date(), { date: 1 });
  loading = false;
  readonly initialSort = 'name,asc';
  expenses: Expense[] = [];
  lastPageReached = false;
  searchCriteria: ExpenseCriteria = { page: 0, size: 25, sort: this.initialSort };
  private readonly searchFormSubscription: Subscription;
  categories: any[] | undefined;

  constructor(

    private readonly modalCtrl: ModalController,
    private readonly formBuilder: FormBuilder,
    private readonly expenseService: ExpenseService,
    private readonly toastService: ToastService,
    private readonly categoryService: CategoryService,


  ) {
    this.searchForm = this.formBuilder.group({name: [], sort: [this.initialSort]});

    this.searchFormSubscription = this.searchForm.valueChanges
      .pipe(debounce((value) => interval(value.name?.length ? 400 : 0)))
      .subscribe((value) => {
        this.searchCriteria = { ...this.searchCriteria, ...value, page: 0 };
        this.loadExpenses();
      });


    this.expenses = this.getExpensesByDate(this.date);


  }

  addMonths(number: number): void {
    this.date = addMonths(this.date, number);
    this.searchCriteria = { ...this.searchCriteria, page: 0 };
    this.loadExpenses();
  }

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
  ionViewDidEnter(): void {
    this.loadExpenses();
  }

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

            const selectedYear = this.date.getFullYear();
            const selectedMonth = this.date.getMonth();

            const filteredExpenses = expenses.content.filter(expense => {
              const expenseDate = new Date(expense.date);
              const expenseYear = expenseDate.getFullYear();
              const expenseMonth = expenseDate.getMonth();

              return expenseYear === selectedYear && expenseMonth === selectedMonth;
            });

            this.expenses = filteredExpenses;
            this.lastPageReached = expenses.last;
          },
          error: (error) => this.toastService.displayErrorToast('Could not load expenses', error),
        });
  }

  loadNextExpensePage($event: any) {
        this.searchCriteria.page++;
        this.loadExpenses(() => ($event as InfiniteScrollCustomEvent).target.complete());
    }

  reloadExpenses(event: any): void {
    this.searchCriteria.page = 0;
    this.loadExpenses(() => {
      if (event) {
        event.target.complete();
      }
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadExpenses();
  }

  private loadCategories(): void {

    const defaultCriteria: CategoryCriteria = { page: 0, size: 25, sort: 'defaultSortField,defaultSortOrder' };

    this.categoryService.getCategories(defaultCriteria).subscribe(
      (categories) => {
        this.categories = categories.content.map(category => ({ value: category.id, label: category.name }));
      },
      (error) => {
        console.error('Error loading categories', error);
      }
    );
  }

  private getExpensesByDate(date: Date): Expense[] {
    if (!this.expenses) {
      return [];
    }

    const selectedMonth = date.getMonth();
    const selectedYear = date.getFullYear();


    const filteredExpenses = this.expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const expenseMonth = expenseDate.getMonth();
      const expenseYear = expenseDate.getFullYear();

      return expenseMonth === selectedMonth && expenseYear === selectedYear;
    });

    return filteredExpenses;
  }

  getExpensesSwitchValue(): number | null {
    if (this.loading) {
      return null;
    } else if (!this.expenses || this.expenses.length === 0) {
      return 0;
    } else {
      return this.expenses.length;
    }
  }



}
