import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DevolucionPageRoutingModule } from './devolucion-routing.module';

import { DevolucionPage } from './devolucion.page';

import { FirestoreModuloModule } from 'src/app/modules/firestore-modulo/firestore-modulo.module';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DevolucionPageRoutingModule,
    FirestoreModuloModule,
  ],
  declarations: [DevolucionPage]
})
export class DevolucionPageModule {}
