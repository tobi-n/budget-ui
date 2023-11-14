import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import {filter, finalize, from, mergeMap, tap} from 'rxjs';
import { CategoryModalComponent } from '../../category/category-modal/category-modal.component';
import { ActionSheetService } from '../../shared/service/action-sheet.service';
import {Category, CategoryCriteria, Expense, Page} from "../../shared/domain";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {ExpenseService} from "../expense.service";
import {ToastService} from "../../shared/service/toast.service";
import {CategoryService} from "../../category/category.service";

@Component({
  selector: 'app-expense-modal',
  templateUrl: './expense-modal.component.html',

})
export class ExpenseModalComponent {

  readonly expenseForm: FormGroup;
  submitting = false;
  expense: Expense = {} as Expense;
  datetime: Date = new Date();
  categories: Category[] = [];
  minDate: string;
  maxDate: string;
  constructor(
    private readonly actionSheetService: ActionSheetService,
    private readonly modalCtrl: ModalController,
    private readonly formBuilder: FormBuilder,
    private readonly expenseService: ExpenseService,
    private readonly toastService: ToastService,
    private readonly categoryService: CategoryService,
  ) {this.expenseForm = this.formBuilder.group({
    id: [],
    name: ['', [Validators.required, Validators.maxLength(40)]],
      amount: [null, [Validators.required]],
      date: [''],
      categoryId: [null],

  })
      this.minDate = new Date().toISOString(); // Example: set to current date
      this.maxDate = new Date(new Date().getFullYear() + 1, 11, 31).toISOString()
  }

  cancel(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  save(): void {
    this.submitting = true;
    this.expenseService
      .upsertExpense(this.expenseForm.value)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          this.toastService.displaySuccessToast('Expense saved');
          this.modalCtrl.dismiss(null, 'refresh');
        },
        error: (error) => this.toastService.displayErrorToast('Could not save expense', error),
      });
  }

    delete(): void {
        from(this.actionSheetService.showDeletionConfirmation('Are you sure you want to delete this expense?'))
            .pipe(
                filter((action) => action === 'delete'),
                tap(() => (this.submitting = true)),
                mergeMap(() => this.expenseService.deleteExpense(this.expense.id!)),
                finalize(() => (this.submitting = false)),
            )
            .subscribe({
                next: () => {
                    this.toastService.displaySuccessToast('Expense deleted');
                    this.modalCtrl.dismiss(null, 'refresh');
                },
                error: (error) => this.toastService.displayErrorToast('Could not delete expense', error),
            });
    }

    ionViewWillEnter(): void {
        if (this.expense.id) {
            // When editing, set the initial value for the date
            this.expenseForm.patchValue({
                id: this.expense.id,
                name: this.expense.name,
                amount: this.expense.amount,
                date: this.expense.date, // Assuming this is a valid date value
            });
        } else {
            // It's a new expense, set default or initial values
            this.expenseForm.patchValue({
                id: null,
                name: '',
                amount: null,
                date: null,
            });
        }

      if (this.expense.id && this.expense.category && this.expense.category.id) {
        this.expenseForm.patchValue({
          categoryId: this.expense.category.id,
        });
      } else {

        this.expenseForm.patchValue({
          categoryId: null,
        });
      }

        this.expenseForm.patchValue({
            name: this.expense.name,
            amount: this.expense.amount
        });
    }

  ngOnInit(): void {
    this.loadCategories();
  }

  private loadCategories(): void {
    this.categoryService.getCategories().subscribe(
      (page: Page<Category>) => {
        this.categories = page.content;
      },
      (error) => {
        console.error('Error loading categories', error);
      }
    );
  }

}
