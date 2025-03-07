import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.page').then( m => m.RegisterPage)
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then( m => m.HomePage)
  },  {
    path: 'contactos',
    loadComponent: () => import('./pages/contactos/contactos.page').then( m => m.ContactosPage)
  },
  {
    path: 'sobre-nosotros',
    loadComponent: () => import('./pages/sobre-nosotros/sobre-nosotros.page').then( m => m.SobreNosotrosPage)
  },
  {
    path: 'inquilinos',
    loadComponent: () => import('./pages/inquilinos/inquilinos.page').then( m => m.InquilinosPage)
  },
  {
    path: 'facturas',
    loadComponent: () => import('./pages/facturas/facturas.page').then( m => m.FacturasPage)
  },
  {
    path: 'viviendas',
    loadComponent: () => import('./pages/viviendas/viviendas.page').then( m => m.ViviendasPage)
  },


];
