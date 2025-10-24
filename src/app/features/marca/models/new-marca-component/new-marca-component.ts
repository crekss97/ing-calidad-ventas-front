import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgOptimizedImage } from '@angular/common';
import { BrandService } from '../services/brand-service/brand-service';
import { Brand } from '../../../products/models/product.models';

@Component({
  selector: 'app-new-marca-component',
  standalone: true,
  imports: [ReactiveFormsModule, NgOptimizedImage],
  templateUrl: './new-marca-component.html',
  styleUrls: ['./new-marca-component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewMarcaComponent {
  submitted = output<Partial<Brand>>();

  private fb = inject(FormBuilder);
  private brandService = inject(BrandService);

  form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    isActive: [true],
  });

  mode = signal<'create' | 'edit'>('create');
  visible = signal<boolean>(false);

  imageFile = signal<File | null>(null);
  imagePreview = signal<string | ArrayBuffer | null>(null);

  open(mode: 'create' | 'edit', brand?: Brand): void {
    this.mode.set(mode);
    this.visible.set(true);
    this.imageFile.set(null);
    this.imagePreview.set(null);

    if (mode === 'edit' && brand) {
      this.form.patchValue({
        name: brand.name,
        description: brand.description,
        isActive: brand.isActive,
      });
      this.imagePreview.set(brand.logo ?? null);
    } else {
      this.form.reset({ isActive: true });
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.imageFile.set(input.files[0]);

      const reader = new FileReader();
      reader.onload = () => this.imagePreview.set(reader.result);
      reader.readAsDataURL(this.imageFile()!);
    }
  }

  close(): void {
    this.visible.set(false);
  }

  onSubmit(): void {
    //if (this.form.valid) {
    //  const data = {
    //    ...this.form.value,
    //    logo: this.imageFile() || undefined,
    //  };
    //  this.submitted.emit(data);
    //  this.close();
    //}
  }
}