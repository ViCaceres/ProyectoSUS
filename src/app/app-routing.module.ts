import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { FirestoreDataComponent } from './components/firestore-data/firestore-data.component';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
  },
  {
    path: '',
    redirectTo: 'inicio',
    pathMatch: 'full'
  },
  {
    path: 'firestore-data',
    component: FirestoreDataComponent
  },
  {
    path: 'inicio',
    loadChildren: () => import('./pages/inicio/inicio.module').then( m => m.InicioPageModule)
  },
  {
    path: 'ingresar',
    loadChildren: () => import('./pages/ingresar/ingresar.module').then( m => m.IngresarPageModule)
  },
  {
    path: 'devolucion',
    loadChildren: () => import('./pages/devolucion/devolucion.module').then( m => m.DevolucionPageModule)
  },
  {
    path: 'stock',
    loadChildren: () => import('./pages/stock/stock.module').then( m => m.StockPageModule)
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
