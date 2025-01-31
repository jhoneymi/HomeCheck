import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonInput, IonItem, IonList, IonSelect, IonSelectOption } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonInput, IonItem, IonList, IonSelect, IonSelectOption,
    CommonModule, FormsModule
  ]
})
export class RegisterPage {
  userData = {
    nombre_completo: '',
    direccion: '',
    email: '',
    numero_cedula: '',
    tipo_domicilio: 'Casa',
    password: '',
    telefono: '',         // Nuevo campo
    fecha_registro: ''    // Nuevo campo
  };

  constructor(public router: Router, private http: HttpClient) {}

  goToLogin() {
    this.router.navigate(['/login']);
  }

  // Validación antes de hacer el registro
  register() {
    // Verificar si todos los campos obligatorios están completos
    if (!this.userData.nombre_completo || !this.userData.email || !this.userData.password || !this.userData.telefono) {
      alert('Todos los campos son obligatorios');
      return;
    }

    // Verificar si el formato de email es correcto
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(this.userData.email)) {
      alert('Por favor, ingrese un email válido');
      return;
    }

    // Asignar la fecha actual a fecha_registro
    this.userData.fecha_registro = new Date().toISOString();

    // Enviar los datos al backend
    this.http.post('http://localhost:3000/api/auth/register', this.userData).subscribe({
      next: (response) => {
        alert('Registro exitoso');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        alert('Error en el registro');
        console.error('Detalles del error:', err);

        // Manejar errores específicos, si se desean detalles adicionales
        if (err.status === 400) {
          alert('Hay un problema con los datos enviados. Verifica la información.');
        } else if (err.status === 500) {
          alert('Error en el servidor. Intenta nuevamente más tarde.');
        }
      }
    });
  }
}