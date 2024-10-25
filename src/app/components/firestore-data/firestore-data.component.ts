import { Component, OnInit } from '@angular/core';
import { FirestoreService } from 'src/app/services/firestore.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-firestore-data',
  templateUrl: './firestore-data.component.html',
  styleUrls: ['./firestore-data.component.scss'],
})
export class FirestoreDataComponent  implements OnInit {
  //Inicializaciones de variables y formularios
  clientes: any[] = [];
  prestamos: any[] = [];
  clienteForm: FormGroup = new FormGroup({});
  cliente:any;

  constructor(private firestoreService: FirestoreService, private fb:FormBuilder) { }

  ngOnInit() {
    this.loadClientes();
    this.loadPrestamos();
  }

  loadClientes() {
    this.firestoreService.getClientes().subscribe((data) => {
      this.clientes = data;
    });
  }

  loadPrestamos() {
    this.firestoreService.getPrestamos().subscribe((data) => {
      this.prestamos = data.map(prestamo => ({
        ...prestamo,
        fecha: prestamo.fecha.toDate()
      }))
    });
  }



    buscarCliente() {
      const rut = this.clienteForm.get('rut')?.value;
      //Si hay un rut en el formulario, se busca el cliente
      if (rut) {
        this.firestoreService.buscarCliente(rut).subscribe((cliente: any) => {
          //Si se encuentra el cliente, se actualizan los campos del formulario
          if (cliente) {
            this.clienteForm.patchValue({
              nombre: cliente.nombre,
              rut: cliente.rut
            });
          } else {
            // Manejar el caso en que no se encuentra el cliente
            this.clienteForm.reset(); // Opcionalmente limpiar el formulario
            alert('Cliente no encontrado');
          }
        });
      }
    }



}





