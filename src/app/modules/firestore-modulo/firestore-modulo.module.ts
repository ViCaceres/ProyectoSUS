import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { FirestoreDataComponent } from 'src/app/components/firestore-data/firestore-data.component';
import { ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [ FirestoreDataComponent ],
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule
  ],
  exports: [FirestoreDataComponent]
})
export class FirestoreModuloModule { }
