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
  editedVivienda: Vivienda = { id: 0, nombre: '', direccion: '', estado: 'No Alquilada', img: '', id_adm: 0 };
  selectedImage: File | null = null;
  originalVivienda: Vivienda;

  constructor(private modalController: ModalController) {
    this.originalVivienda = { ...this.vivienda };
  }

  ngOnInit() {
    this.editedVivienda = { ...this.vivienda };
  }

  onFileSelected(event: any) {
    this.selectedImage = event.target.files[0];
    console.log('Imagen seleccionada:', this.selectedImage);
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
    if (this.selectedImage) {
      updatedData.img = this.selectedImage; // Enviar File para subir al servidor
    }

    // Si no hay cambios, cerrar sin guardar
    if (Object.keys(updatedData).length === 0) {
      console.log('No se detectaron cambios');
      await this.modalController.dismiss(null, 'cancel');
      return;
    }

    // Enviar datos al padre
    const dataToSend: ViviendaEdit = {
      ...this.originalVivienda,
      ...updatedData,
      id: this.vivienda.id
    };
    console.log('Datos a enviar:', dataToSend);
    await this.modalController.dismiss(dataToSend, 'confirm');
  }

  async cancel() {
    console.log('Cancelando modal');
    await this.modalController.dismiss(null, 'cancel');
  }
}