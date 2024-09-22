import { Component, OnInit } from '@angular/core';
import { FirestoreService } from 'src/app/services/firestore.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-firestore-data',
  templateUrl: './firestore-data.component.html',
  styleUrls: ['./firestore-data.component.scss'],
})
export class FirestoreDataComponent  implements OnInit {
  clientes: any[] = [];
  prestamos: any[] = [];
  clienteForm: FormGroup = new FormGroup({});
  cliente:any;

  constructor(private firestoreService: FirestoreService, private fb:FormBuilder) { }

  ngOnInit() {
    this.createForm();
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

  addCliente(){
    const nuevoCliente = {nombre:'Felipe', rut:'20690939-0'};
    this.firestoreService.addCliente(nuevoCliente);
    
  }


  createForm(){
    this.clienteForm = this.fb.group({
      nombre: ['', Validators.required],
      rut: ['', Validators.required]
    });
  }
  onSubmit(){
    if(this.clienteForm.valid){
      const cliente = this.clienteForm.value;
      this.firestoreService.addCliente(cliente)
      .then(() => {
        this.clienteForm.reset();
        this.loadClientes();
      });
      }
    }

    buscarCliente() {
      const rut = this.clienteForm.get('rut')?.value;
      if (rut) {
        this.firestoreService.buscarCliente(rut).subscribe((cliente: any) => {
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





