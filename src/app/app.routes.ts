import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

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
  },
  {
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

  {
    path: 'login-inquilinos',
    loadComponent: () => import('./pages/login-inquilinos/login-inquilinos.page').then( m => m.LoginInquilinosPage)
  },
  {
    path: 'homepage-inquilinos',
    loadComponent: () => import('./pages/homepage-inquilinos/homepage-inquilinos.page').then( m => m.HomepageInquilinosPage)
  },
  {
    path: 'inquilino-profile/:id',
    loadComponent: () => import('./pages/inquilino-profile/inquilino-profile.page').then( m => m.InquilinoProfilePage)
  },
  {
    path: 'ganancias',
    loadComponent: () => import('./pages/ganancias/ganancias.page').then( m => m.GananciasPage)
  },
  {
    path: 'facturas-admin',
    loadComponent: () => import('./pages/facturas-admin/facturas-admin.page').then( m => m.FacturasAdminPage)
  },
  {
    path: 'admin-home',
    loadComponent: () => import('./pages/admin-home/admin-home.page').then( m => m.AdminHomePage)
  },



];
