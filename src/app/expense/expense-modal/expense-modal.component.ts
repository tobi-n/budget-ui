import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import {filter, finalize, from, mergeMap, tap} from 'rxjs';
import { CategoryModalComponent } from '../../category/category-modal/category-modal.component';
import { ActionSheetService } from '../../shared/service/action-sheet.service';
import {Expense} from "../../shared/domain";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {ExpenseService} from "../expense.service";
import {ToastService} from "../../shared/service/toast.service";


@Component({
  selector: 'app-expense-modal',
  templateUrl: './expense-modal.component.html',

})
export class ExpenseModalComponent {

  readonly expenseForm: FormGroup;
  submitting = false;
  expense: Expense = {} as Expense;
  datetime: Date = new Date();

  constructor(
    private readonly actionSheetService: ActionSheetService,
    private readonly modalCtrl: ModalController,
    private readonly formBuilder: FormBuilder,
    private readonly expenseService: ExpenseService,
    private readonly toastService: ToastService
  ) {this.expenseForm = this.formBuilder.group({
    id: [],
    name: ['', [Validators.required, Validators.maxLength(40)]],
      amount: [null, [Validators.required]],
      date: [''],

  })
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
        this.expenseForm.patchValue({
            name: this.expense.name,
            amount: this.expense.amount
        });
    }


}
