import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { IngresarPageRoutingModule } from './ingresar-routing.module';

import { IngresarPage } from './ingresar.page';

import { FirestoreModuloModule } from 'src/app/modules/firestore-modulo/firestore-modulo.module';

import { ReactiveFormsModule } from '@angular/forms';

import { RutFormateoDirective } from 'src/app/directives/rut-formateo.directive';



@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    IngresarPageRoutingModule,
    FirestoreModuloModule,
    ReactiveFormsModule,
    RutFormateoDirective,
  ],
  declarations: [IngresarPage]
})
export class IngresarPageModule {}
