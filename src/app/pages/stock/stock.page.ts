import { Component, OnInit } from '@angular/core';

import { FirestoreModuloModule } from 'src/app/modules/firestore-modulo/firestore-modulo.module';
import { FirestoreService } from 'src/app/services/firestore.service';


@Component({
  selector: 'app-stock',
  templateUrl: './stock.page.html',
  styleUrls: ['./stock.page.scss'],
})
export class StockPage implements OnInit {
  prestamos_actuales : any[] = [];
  clienteSeleccionado: string = '';
  numeroCliente : number = 0;
  clientes : any[] = [];


  constructor(private firestoreModule: FirestoreModuloModule, private firestoreService:FirestoreService ) { }

  ngOnInit() {
    this.getPrestamos();
  }

  getPrestamos(){
    this.firestoreService.getPrestamos().subscribe((prestamos: any) => {
      this.prestamos_actuales = prestamos;
      console.log(this.prestamos_actuales);
    });

    this.firestoreService.getClientes().subscribe((clientes: any) => {
      this.clientes = clientes;
    });
  }



  onClienteChange(event: any ) {
    this.clienteSeleccionado = event.detail.value;
    console.log('Cliente seleccionado:', this.clienteSeleccionado);
    const cliente = this.clientes.find(cliente => cliente.rut === this.clienteSeleccionado);
    this.numeroCliente = cliente ? cliente.telefono : '';
  }

}
