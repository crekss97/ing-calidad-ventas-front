import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { LineService } from '../services/line.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Line } from '../../../products/models/product.models';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-new-line-component',
  imports: [ReactiveFormsModule, NgOptimizedImage],
  templateUrl: './new-line-component.html',
  styleUrl: './new-line-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,

})
export class NewLineComponent {
  submitted = output<any>();
  private fb = inject(FormBuilder);
  private lineService = inject(LineService);

  brands = this.lineService.brands();

  form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    brandId: ['', Validators.required]
  });

  mode = signal<'create' | 'edit'>('create');
  visible = signal<boolean>(false);

  imageFile = signal<File | null>(null);
  imagePreview = signal<string | ArrayBuffer | null>(null);


  open(mode: 'create' | 'edit', line?: Line): void {
    this.mode.set(mode);
    this.visible.set(true);
    this.imageFile.set(null);
    this.imagePreview.set(null);

    if (mode === 'edit' && line) {
      this.form.patchValue(line);
      this.form.controls['brandId'].setValue(line.brandId);
      this.imagePreview.set(line.image ?? null)
    } else {
      this.form.reset();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.imageFile.set(input.files[0]);

      const reader = new FileReader();
      reader.onload = () => (this.imagePreview.set(reader.result));
      reader.readAsDataURL(this.imageFile()!);
    }
  }

  close(): void {
    this.visible.set(false);
  }

  onSubmit(): void {
    if (this.form.valid) {
      const data = {
        ...this.form.value,
        image: this.imageFile() || undefined
      };
      this.submitted.emit(data);
      this.close();
    }
  }
}
