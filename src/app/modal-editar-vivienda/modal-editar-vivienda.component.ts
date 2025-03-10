import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { Vivienda, ViviendaEdit } from 'src/app/services/viviendas.service';

@Component({
  selector: 'app-modal-editar-vivienda',
  templateUrl: './modal-editar-vivienda.component.html',
  styleUrls: ['./modal-editar-vivienda.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class ModalEditarViviendaComponent implements OnInit {
  @Input() vivienda!: Vivienda;
  editedVivienda: Vivienda = {
    id: 0,
    nombre: '',
    direccion: '',
    estado: 'No Alquilada',
    img: '',
    id_adm: 0,
    fecha_registro: '',
    precio_alquiler: 0, // Nuevo campo
    notas: '' // Nuevo campo
  };
  selectedImage: File | null = null;
  originalVivienda: Vivienda;

  constructor(private modalController: ModalController) {
    this.originalVivienda = { ...this.vivienda };
  }

  ngOnInit() {
    this.editedVivienda = { ...this.vivienda };
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    this.selectedImage = file || null;
    console.log('Imagen seleccionada o campo vacío:', this.selectedImage);
  }

  async closeModal() {
    console.log('Intentando guardar con datos editados:', this.editedVivienda);
  
    // Crear un objeto con solo los campos modificados
    const updatedData: Partial<ViviendaEdit> = {};
    if (this.editedVivienda.nombre !== this.originalVivienda.nombre) {
      updatedData.nombre = this.editedVivienda.nombre;
    }
    if (this.editedVivienda.direccion !== this.originalVivienda.direccion) {
      updatedData.direccion = this.editedVivienda.direccion;
    }
    if (this.editedVivienda.estado !== this.originalVivienda.estado) {
      updatedData.estado = this.editedVivienda.estado;
    }
    if (this.editedVivienda.precio_alquiler !== this.originalVivienda.precio_alquiler) {
      updatedData.precio_alquiler = Number(this.editedVivienda.precio_alquiler);
    }
    if (this.editedVivienda.notas !== this.originalVivienda.notas) {
      updatedData.notas = this.editedVivienda.notas;
    }
  
    // Solo incluir el campo img si se seleccionó una nueva imagen
    if (this.selectedImage) {
      updatedData.img = this.selectedImage;
    }
  
    // Forzar al menos un campo para actualizar (para pruebas)
    if (Object.keys(updatedData).length === 0) {
      console.log('No se detectaron cambios, forzando un cambio para prueba');
      updatedData.nombre = this.editedVivienda.nombre;
    }
  
    // Incluir explícitamente id e id_adm
    const dataToSend: ViviendaEdit = {
      ...this.originalVivienda,
      ...updatedData,
      id: this.vivienda.id,
      id_adm: this.vivienda.id_adm
    };
    console.log('Datos a enviar:', dataToSend);
    await this.modalController.dismiss(dataToSend, 'confirm');
  }

  validarPrecio() {
    if (this.editedVivienda.precio_alquiler <= 0) {
      this.editedVivienda.precio_alquiler = this.originalVivienda.precio_alquiler;
      alert('El precio de alquiler debe ser mayor a 0.');
    }
  }

  async cancel() {
    console.log('Cancelando modal');
    await this.modalController.dismiss(null, 'cancel');
  }
}