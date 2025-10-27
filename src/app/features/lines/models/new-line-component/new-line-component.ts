import { ChangeDetectionStrategy, Component, inject, Output, EventEmitter, signal } from '@angular/core';
import { LineService } from '../services/line.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Linea, Marca } from '../../../../models/global.models';
import { NgOptimizedImage } from '@angular/common';
import { ProductsService } from '../../../products/models/services/products.service';

@Component({
  selector: 'app-new-line-component',
  imports: [ReactiveFormsModule, NgOptimizedImage],
  templateUrl: './new-line-component.html',
  styleUrls: ['./new-line-component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,

})
export class NewLineComponent {
  @Output() submitted = new EventEmitter<any>();
  private fb = inject(FormBuilder);
  private lineService = inject(LineService);
  private productsService = inject(ProductsService);

  brands = signal<Marca[]>([]);

  form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    marcaId: ['', Validators.required]
  });

  mode = signal<'create' | 'edit'>('create');
  visible = signal<boolean>(false);

  imageFile = signal<File | null>(null);
  imagePreview = signal<string | ArrayBuffer | null>(null);

  constructor() {
    // Cargar marcas para el select
    this.productsService.getBrands().subscribe({
      next: (res: any) => {
        const items = Array.isArray(res) ? res : (res?.data ?? res);
        this.brands.set(items || []);
      },
      error: () => this.brands.set([]),
    });
  }


  open(mode: 'create' | 'edit', line?: Linea | any): void {
    this.mode.set(mode);
    this.visible.set(true);
    this.imageFile.set(null);
    this.imagePreview.set(null);

    if (mode === 'edit' && line) {
      this.form.patchValue(line);
      // adapt property names if needed (line may have marcaId)
      this.form.controls['marcaId'].setValue((line as any).marcaId ?? (line as any).brandId ?? '');
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
      const fv = this.form.value as any;
      const data = {
        nombre: fv.name,
        descripcion: fv.description,
        marcaId: Number(fv.marcaId),
        image: this.imageFile() || undefined
      };
      this.submitted.emit(data);
      this.close();
    }
  }
}
