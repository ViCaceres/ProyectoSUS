import { Component, OnInit } from '@angular/core';
import { FirestoreService } from 'src/app/services/firestore.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-ingresar',
  templateUrl: './ingresar.page.html',
  styleUrls: ['./ingresar.page.scss'],
})
export class IngresarPage implements OnInit {

  clientes: any[] = [];
  prestamos: any[] = [];
  clienteForm: FormGroup;
  selectedOption: string;

  constructor(private firestoreService: FirestoreService, private fb: FormBuilder, private alertController: AlertController) {
    this.selectedOption = 'Silla de Ruedas'; // Valor por defecto
    this.clienteForm = this.fb.group({
      nombre: ['', Validators.required],
      rut: ['', Validators.required],
      correo: ['', Validators.required],
      telefono: ['', Validators.required],
      numeroRodado: ['', Validators.required],
      tipoPrestado: [this.selectedOption, Validators.required], // Define el valor inicial
    });
  }

  ngOnInit() {
    this.clienteForm.get('tipoPrestado')?.valueChanges.subscribe(value => {
      this.selectedOption = value;
    });
  }

  onSegmentChange(event: any) {
    this.selectedOption = event.detail.value;
    this.clienteForm.get('tipoPrestado')?.setValue(this.selectedOption);
  }

  onSubmit() {
    if (this.clienteForm.valid) {
      const cliente = this.clienteForm.value;
      console.log(cliente);
      // Implementa la lógica para enviar el formulario
      /* this.firestoreService.addCliente(cliente)
        .then(() => {
          this.clienteForm.reset();
        }); */
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

  async terminosCondiciones() {
    const alert = await this.alertController.create({
      header: 'Términos y Condiciones',
      message: 'Aquí van tus términos y condiciones...',
      buttons: ['OK']
    });

    await alert.present();
  }


}
