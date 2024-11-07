import { Component, OnInit, ViewChild } from '@angular/core';
import { FirestoreService } from 'src/app/services/firestore.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { RutFormateoDirective } from 'src/app/directives/rut-formateo.directive';
import { find } from 'rxjs';

import { ModalController } from '@ionic/angular';
import * as moment from 'moment';


@Component({
  selector: 'app-ingresar',
  templateUrl: './ingresar.page.html',
  styleUrls: ['./ingresar.page.scss'],
})
export class IngresarPage implements OnInit {
  //Inicializaciones de variables y formularios

  @ViewChild(RutFormateoDirective) rutFormateoDirective!: RutFormateoDirective;

  clientes: any[] = [];
  prestamos: any[] = [];
  clienteForm: FormGroup;
  selectedOption: string;
  isChecked: boolean = false; // Variable para el checkbox



  constructor(
    private firestoreService: FirestoreService,
    private fb: FormBuilder,
    private alertController: AlertController,
    private toastController: ToastController,
    private router: Router,
    private modalController: ModalController,
  ) {
    this.selectedOption = 'Silla de Ruedas'; // Valor por defecto
    this.clienteForm = this.fb.group({
      nombre: ['', Validators.required],
      rut: [''],
      correo: ['', [Validators.required, Validators.email]],
      telefono: [ //Teléfono con formato nacional
        '',
        [Validators.required, Validators.pattern('^(\\+?[0-9]{9,12})$')],
      ],
      numeroRodado: ['', Validators.required],
      tipoPrestado: [this.selectedOption, Validators.required], // Define el valor inicial
      isChecked: [false]
    });
  }

  //Función al iniciar la página
  ngOnInit() {
    //Suscripción al cambio de valor del select
    this.clienteForm.get('tipoPrestado')?.valueChanges.subscribe((value) => {
      this.selectedOption = value;
    });

    this.firestoreService.getClientes().subscribe((clientes) => {
      this.clientes = clientes;
      
    });

    this.firestoreService.getPrestamos().subscribe((prestamos) => {
      this.prestamos = prestamos;
    });

    this.checkboxChange();
  }

  //Función al cambiar el valor del select
  onSegmentChange(event: any) {
    this.selectedOption = event.detail.value;
    this.clienteForm.get('tipoPrestado')?.setValue(this.selectedOption);
  }

  //Función para mostrar un mensaje emergente
  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000, // Duración en milisegundos (2 segundos)
      position: 'top', // Puedes cambiar la posición ('bottom', 'middle', 'top')
      color: color, // Puedes elegir el color ('danger', 'warning', etc.)
    });
    toast.present();
  }

  //Función al enviar el formulario
  onSubmit() {
    if (this.clienteForm.valid) {
      // Formatear el RUT antes de enviar
      let rut : string;

      if(this.clienteForm.get('isChecked')?.value ){
        rut = this.clienteForm.get('rut')?.value;
      }
      else{
      
      const rut_raw = this.rutFormateoDirective.getRawValue().toUpperCase();
      rut = this.formatRut(rut_raw);
      
      }

      if(rut){
        this.manejoSubmit(rut);
      }else{
        this.presentToast('Ingrese un rut válido', 'danger');
      }


      
    } else { // Si el formulario no es válido
      this.showValidationErrors();

    }
  }

  manejoSubmit(rut: string) {
    const { nombre, correo, telefono } = this.clienteForm.value;
    const tipoPrestado = this.clienteForm.get('tipoPrestado')?.value;
    const numeroRodado = this.clienteForm.get('numeroRodado')?.value;

    const cliente = { nombre, rut, correo, telefono };

    const clienteExistente = this.clientes.find((c) => c.rut === rut);

    if (clienteExistente) {
        const datosModificados = 
            clienteExistente.nombre !== nombre ||
            clienteExistente.correo !== correo ||
            clienteExistente.telefono !== telefono;

        const prestamoActivo = this.prestamos.some(
            (prestamo) => prestamo.idCliente === clienteExistente.id && !prestamo.devuelto
        );

        if (prestamoActivo) {
            this.presentToast('Cliente ya tiene un préstamo activo', 'danger');
        } else {
            if (datosModificados) {
                this.alertController.create({
                    header: '¿Desea modificar los datos del cliente?',
                    message: 'Se modificarán los datos del cliente y se creará un nuevo préstamo',
                    buttons: [
                        {
                            text: 'Cancelar',
                            role: 'cancel',
                            cssClass: 'secondary',
                        },
                        {
                            text: 'Aceptar',
                            handler: () => {
                                this.firestoreService.updateCliente(clienteExistente.id, cliente)
                                    .then(() => {
                                        this.agregarPrestamo(clienteExistente.id, cliente, tipoPrestado, numeroRodado);
                                        this.agregarHistorial(clienteExistente.id, cliente, numeroRodado);
                                        this.agregarContadorHistorico(tipoPrestado);
                                    })
                                    .then(() => {
                                        this.presentToast('Préstamo agregado con éxito', 'success');
                                        this.clienteForm.reset();
                                        this.router.navigate(['/inicio']);
                                    })
                                    .catch((error) => {
                                        this.presentToast('Error al agregar préstamo', 'danger');
                                        console.error(error);
                                    });
                            },
                        },
                    ],
                }).then((alert) => {
                    alert.present();
                });
            } else {
                this.agregarPrestamo(clienteExistente.id, cliente, tipoPrestado, numeroRodado)
                    .then(() => {
                        this.presentToast('Préstamo agregado con éxito', 'success');
                        this.agregarHistorial(clienteExistente.id, cliente, numeroRodado);
                        this.agregarContadorHistorico(tipoPrestado);
                        this.clienteForm.reset();
                        this.router.navigate(['/inicio']);
                    })
                    .catch((error) => {
                        this.presentToast('Error al agregar préstamo', 'danger');
                        console.error(error);
                    });
            }
        }
    } else {
        
        this.firestoreService.addCliente(cliente, tipoPrestado, numeroRodado)
            .then((nuevoClienteId) => {
                this.presentToast('Cliente ingresado con éxito', 'success');
            })
            .then(() => {
                this.clienteForm.reset();
                this.router.navigate(['/inicio']);
            })
            .catch((error) => {
                this.presentToast('Error al crear el cliente', 'danger');
                console.error(error);
            });
    }
}


agregarPrestamo(idCliente: string, cliente: any, tipoPrestado: string, numeroRodado: string) {
    return this.firestoreService.addPrestamo({
        tipoPrestado: tipoPrestado,
        fecha: new Date(),
        idCliente: idCliente,
        nombreCliente: cliente.nombre,
        rutCliente: cliente.rut,
        devuelto: false,
        numeroRodado: numeroRodado,
    }).then(() => {
        this.presentToast('Préstamo ingresado con éxito', 'success');
    });
}

agregarHistorial(idCliente: string, cliente: any, numeroRodado: string) {
    this.firestoreService.addHistorial({
        idCliente: idCliente,
        nombreCliente: cliente.nombre,
        rutCliente: cliente.rut,
        fecha: new Date(),
        numeroRodado: numeroRodado,
        devuelto: false
    }).then(() => {
        console.log('Historial creado con éxito');
    }).catch(error => {
        console.error('Error al crear el historial:', error);
    });
}

agregarContadorHistorico(tipoPrestado: string) {
    let sillas = 0;
    let coches = 0;

    if (tipoPrestado === 'Silla de Ruedas') {
        sillas = 1;
    } else if (tipoPrestado === 'Coche') {
        coches = 1;
    }

    return this.firestoreService.addContadorHistorico({
        fecha: new Date(),
        sillas: sillas,
        coches: coches,
    }).then(() => {
        console.log('Contador histórico actualizado con éxito');
    }).catch(error => {
        console.error('Error al actualizar el contador histórico:', error);
    });
}


  //Función para buscar un cliente
  buscarCliente() {
    let rut = '';
    // Formatear el RUT antes de buscar
    if(this.isChecked){
      rut = this.clienteForm.get('rut')?.value;
    }
    else{
      const rut_raw = this.rutFormateoDirective.getRawValue().toUpperCase();
      rut = this.formatRut(rut_raw);
    }
    // Buscar el cliente en la base de datos
    if (rut) {

      this.firestoreService.buscarCliente(rut).subscribe((cliente: any) => {
        if (cliente) {
          // Mostrar los datos del cliente en el formulario si se encuentra en la BD
          this.clienteForm.patchValue({
            nombre: cliente.nombre,
            rut: cliente.rut,
            correo: cliente.correo,
            telefono: cliente.telefono,
          });
          // Mostrar mensaje de éxito
          this.presentToast('Cliente encontrado', 'success');
        } else { // Si no se encuentra el cliente
          this.clienteForm.reset(); // Limpiar el formulario si no se encuentra
          this.presentToast('Cliente no encontrado', 'danger'); // Mostrar mensaje de error
        }
      });
    } else { // Si el RUT no es válido
      this.presentToast('Ingrese un rut válido', 'danger');
    }
  }

  showValidationErrors() {
    let messages: string[] = [];

    // Iterar sobre los controles del formulario
    Object.keys(this.clienteForm.controls).forEach(key => {
        const control = this.clienteForm.get(key);
        if (control?.invalid) {
            if (control.errors?.['required']) {
                messages.push(`El campo ${key} es obligatorio.`);
            }
            if (control.errors?.['email']) {
                messages.push(`Ingrese un correo electrónico válido.`);
            }
            if (control.errors?.['pattern']) {
                messages.push(`El formato de ${key} es incorrecto.`);
            }
            if (control.errors?.['minlength']) {
                messages.push(`El campo ${key} debe tener al menos ${control.errors['minlength'].requiredLength} caracteres.`);
            }
            if (control.errors?.['maxlength']) {
                messages.push(`El campo ${key} no puede exceder ${control.errors['maxlength'].requiredLength} caracteres.`);
            }
        }
    });

    if (messages.length > 0) {
        this.presentToast(messages.join(' '), 'danger');
    } else {
        this.presentToast('Complete todos los campos', 'danger');
    }
} 


  // Función para formatear el RUT
  formatRut(rut: string): string {
    if(this.isChecked){
      console.log('FORMATEO RUT ', rut);
      return rut;
    }else{

          // Eliminar caracteres no numéricos, excepto la letra K
    rut = rut.replace(/[^0-9kK]/g, '');
    // Separar el dígito verificador
    const rutPart = rut.slice(0, -1);
    // Extraer el dígito verificador
    const dvPart = rut.slice(-1);
    // Formatear el RUT con puntos y guión
    return `${rutPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dvPart}`;
    }
    

  }

  checkboxChange(){
    this.isChecked = this.clienteForm.get('isChecked')?.value;

    const rutControl = this.clienteForm.get('rut');


    if(this.isChecked == false){
      rutControl?.setValidators([Validators.maxLength(12), Validators.required]);
    }
    else{
    }

    rutControl?.updateValueAndValidity();

  }

  // Función para mostrar los términos y condiciones
  async terminosCondiciones() {
    this.alertController.create({
      header: 'Términos y Condiciones',
      message: `
        Al hacer clic en "Aceptar", usted acepta los términos y condiciones de uso.
        Los datos ingresados en este formulario serán almacenados en una base de datos segura.
        Los datos personales serán utilizados únicamente para el registro de préstamos.
      `,
      buttons: [
        { // Botón de cancelar
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondarys',
        },
        { // Botón de aceptar
          text: 'Aceptar',
        },
      ],
    }).then((alert) => {
      alert.present();
    });
  }

}
