import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonRefresher,
  IonRefresherContent
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-sobre-nosotros',
  templateUrl: './sobre-nosotros.page.html',
  styleUrls: ['./sobre-nosotros.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonRefresher,
    IonRefresherContent,
    CommonModule,
    FormsModule
  ]
})
export class SobreNosotrosPage implements OnInit {

  // Información de la empresa HomeCheck
  companyName: string = 'HomeCheck';
  description: string = 'HomeCheck es una empresa especializada en el manejo integral de residencias, enfocada en brindar soluciones eficientes para la administración, supervisión y mantenimiento de inmuebles. Nuestro objetivo es simplificar la vida de propietarios y residentes, ofreciendo herramientas que faciliten la gestión de sus propiedades.';
  mission: string = 'Facilitar y optimizar la gestión de inmuebles a través de tecnologías innovadoras y un equipo comprometido, brindando transparencia, seguridad y confianza en la administración de residencias.';
  vision: string = 'Convertirnos en la plataforma líder en el sector de la administración de residencias, reconocida por la calidad de nuestro servicio, la innovación de nuestras soluciones y la satisfacción de nuestros clientes. Buscamos revolucionar el mercado inmobiliario transformando la manera en que se gestionan las propiedades.';
  contactInfo: string = '¿Quieres saber más sobre HomeCheck? Escríbenos o síguenos en nuestras redes sociales.';

  // Arreglo para manejar dinámicamente las secciones
  aboutItems: Array<{ title: string, content: string }> = [];

  constructor() { }

  ngOnInit() {
    this.aboutItems = [
      { title: '¿Quiénes somos?', content: this.description },
      { title: 'Nuestra Misión', content: this.mission },
      { title: 'Nuestra Visión', content: this.vision },
      { title: 'Contacto', content: `${this.contactInfo}<br /><a href="mailto:contacto@homecheck.com">contacto@homecheck.com</a>` }
    ];
  }

  // Función para refrescar el contenido (pull-to-refresh)
  doRefresh(event: any) {
    // Simulación de actualización de contenido
    setTimeout(() => {
      event.target.complete();
    }, 1500);
  }
}
