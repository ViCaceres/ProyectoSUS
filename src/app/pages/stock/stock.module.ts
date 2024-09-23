import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { StockPageRoutingModule } from './stock-routing.module';

import { StockPage } from './stock.page';

import { FirestoreModuloModule } from 'src/app/modules/firestore-modulo/firestore-modulo.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    StockPageRoutingModule,
    FirestoreModuloModule
  ],
  declarations: [StockPage]
})
export class StockPageModule {}
