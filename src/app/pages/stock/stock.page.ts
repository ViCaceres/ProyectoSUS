import { Component, OnInit } from '@angular/core';

import { FirestoreModuloModule } from 'src/app/modules/firestore-modulo/firestore-modulo.module';
import { FirestoreService } from 'src/app/services/firestore.service';

import * as moment from 'moment'; //Necesario para el manejo de fechas

@Component({
  selector: 'app-stock',
  templateUrl: './stock.page.html',
  styleUrls: ['./stock.page.scss'],
})
export class StockPage implements OnInit {
  // Inicialización de variables
  prestamos_actuales : any[] = [];
  clienteSeleccionado: string = '';
  numeroCliente : number = 0;
  clientes : any[] = [];
  fechaPrestamo : any = null;


  constructor(private firestoreModule: FirestoreModuloModule, private firestoreService:FirestoreService ) { }

  // Método que se ejecuta al iniciar la vista
  ngOnInit() {
    this.getPrestamos();
  }

  // Método para obtener los prestamos actuales, y también obtiene clientes
  getPrestamos(){
    this.firestoreService.getPrestamos().subscribe((prestamos: any) => {
      this.prestamos_actuales = prestamos;
    });

    this.firestoreService.getClientes().subscribe((clientes: any) => {
      this.clientes = clientes;
    });
  }

  // Método que se ejecuta al seleccionar un cliente
  onClienteChange(event: any ) {
    // Se obtiene el rut del cliente seleccionado
    this.clienteSeleccionado = event.detail.value;
    // Se busca el cliente seleccionado y se obtiene su número de teléfono
    const cliente = this.clientes.find(cliente => cliente.rut === this.clienteSeleccionado);
    // Se busca el préstamo del cliente seleccionado y se obtiene la fecha en la cuál se realizó
    const prestamo = this.prestamos_actuales.find(prestamo => prestamo.rutCliente === this.clienteSeleccionado);
    // Se asigna el número de teléfono y la fecha en la cuál se realizó el préstamo a las variables correspondientes
    this.numeroCliente = cliente ? cliente.telefono : '';
    this.fechaPrestamo = prestamo ? prestamo.fecha : null;
    
    // Se formatea la fecha en el formato correspondiente para que sea legible
    if(this.fechaPrestamo){
      this.fechaPrestamo = moment(this.fechaPrestamo.toDate()).format('DD/MM/YYYY HH:mm:ss'); // Formato de fecha y hora
    }
    
  }




}
