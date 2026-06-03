import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { ToolService } from '../../services/tool.service';

@Component({
  selector: 'app-tool-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatDialogModule,
    MatFormFieldModule, 
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  templateUrl: './tool-dialog.component.html',
  styleUrls: ['./tool-dialog.component.scss']
})
export class ToolDialogComponent implements OnInit {
  toolForm: FormGroup;
  errorMessage = '';
  isEditMode = false;
  categories = ['Fúró/Csavarozó', 'Fűrész', 'Sarokcsiszoló', 'Fúrókalapács', 'Csiszoló', 'Tartozék'];

  constructor(
    private fb: FormBuilder,
    private toolService: ToolService,
    public dialogRef: MatDialogRef<ToolDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.isEditMode = !!data?.tool;
    const tool = data?.tool || {};

    this.toolForm = this.fb.group({
      name: [tool.name || '', Validators.required],
      brand: [tool.brand || '', Validators.required],
      category: [tool.category || '', Validators.required],
      price: [tool.price || '', [Validators.required, Validators.min(0)]],
      quantity: [tool.quantity || '', [Validators.required, Validators.min(0)]],
      imageUrl: [tool.imageUrl || '']
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.toolForm.valid) {
      const toolData = {
        ...this.toolForm.value,
        price: Number(this.toolForm.value.price),
        quantity: Number(this.toolForm.value.quantity)
      };

      if (isNaN(toolData.price) || isNaN(toolData.quantity)) {
        this.errorMessage = 'Az ár és a mennyiség csak szám lehet!';
        return;
      }

      if (this.isEditMode) {
        this.toolService.updateTool(this.data.tool._id, toolData).subscribe({
          next: (res) => this.dialogRef.close(res),
          error: (err) => this.errorMessage = err.error?.message || 'Hiba történt a módosítás során.'
        });
      } else {
        this.toolService.addTool(toolData).subscribe({
          next: (res) => this.dialogRef.close(res),
          error: (err) => this.errorMessage = err.error?.message || 'Hiba történt a hozzáadás során.'
        });
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
