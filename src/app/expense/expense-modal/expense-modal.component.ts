import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { filter, from } from 'rxjs';
import { CategoryModalComponent } from '../../category/category-modal/category-modal.component';
import { ActionSheetService } from '../../shared/service/action-sheet.service';
import {Category, Expense} from "../../shared/domain";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";

@Component({
  selector: 'app-expense-modal',
  templateUrl: './expense-modal.component.html',
})
export class ExpenseModalComponent {

  readonly expenseForm: FormGroup;
  submitting = false;
  expense: Expense = {} as Expense;

  constructor(
    private readonly actionSheetService: ActionSheetService,
    private readonly modalCtrl: ModalController,
    private readonly formBuilder: FormBuilder,
  ) {this.expenseForm = this.formBuilder.group({
    id: [],
    name: ['', [Validators.required, Validators.maxLength(40)]],
  })
  }

  cancel(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  save(): void {
    this.modalCtrl.dismiss(null, 'save');
  }

  delete(): void {
    from(this.actionSheetService.showDeletionConfirmation('Are you sure you want to delete this expense?'))
      .pipe(filter((action) => action === 'delete'))
      .subscribe(() => this.modalCtrl.dismiss(null, 'delete'));
  }

  async showCategoryModal(): Promise<void> {
    const categoryModal = await this.modalCtrl.create({ component: CategoryModalComponent });
    categoryModal.present();
    const { role } = await categoryModal.onWillDismiss();
    console.log('role', role);
  }


  ionViewWillEnter(): void {
    this.expenseForm.patchValue(this.expense);
  }
}
