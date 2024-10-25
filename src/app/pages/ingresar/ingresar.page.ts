import { Component, OnInit, ViewChild } from '@angular/core';
import { FirestoreService } from 'src/app/services/firestore.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { RutFormateoDirective } from 'src/app/directives/rut-formateo.directive';
import { find } from 'rxjs';

import { ModalController } from '@ionic/angular';


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
      rut: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      telefono: [ //Teléfono con formato nacional
        '+56',
        [Validators.required, Validators.pattern('^(\\+?[0-9]{9,12})$')],
      ],
      numeroRodado: ['', Validators.required],
      tipoPrestado: [this.selectedOption, Validators.required], // Define el valor inicial
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
      const rut_raw = this.rutFormateoDirective.getRawValue().toUpperCase();
      const rut = this.formatRut(rut_raw);

      // Extraer los valores del formulario
      const { nombre, correo, telefono } = this.clienteForm.value;
      const tipoPrestado = this.clienteForm.get('tipoPrestado')?.value;
      const numeroRodado = this.clienteForm.get('numeroRodado')?.value;

      // Crear un objeto cliente para enviarlo
      const cliente = { nombre, rut, correo, telefono };

      // Buscar si el cliente ya existe
      const clienteExistente = this.clientes.find((c) => c.rut === rut);
      
      // Si el cliente ya existe
      if (clienteExistente) {

        // Verificar si los datos del cliente han sido modificados
        const datosModificados = 
          clienteExistente.nombre !== nombre ||
          clienteExistente.correo !== correo ||
          clienteExistente.telefono !== telefono;
        
        // Verificar si el cliente tiene un préstamo activo
        const prestamoActivo = this.prestamos.some(
          (prestamo) => prestamo.idCliente === clienteExistente.id && !prestamo.devuelto // Si el cliente tiene un préstamo activo
        );

        // Si tiene un préstamo activo, mostrar error
        if (prestamoActivo) {
          this.presentToast('Cliente ya tiene un préstamo activo', 'danger');
        } else {
          // Si no tiene un préstamo activo, agregar el préstamo
          if (datosModificados) {
            // Si los datos del cliente han sido modificados, mostrar alerta
            this.alertController.create({
              header: '¿Desea modificar los datos del cliente?',
              message: 'Se modificarán los datos del cliente y se creará un nuevo préstamo',
              buttons: [
                { // Botón de cancelar
                  text: 'Cancelar',
                  role: 'cancel',
                  cssClass: 'secondary',
                },
                { // Botón de aceptar
                  text: 'Aceptar',
                  handler: () => {
                    // Actualizar los datos del cliente y agregar el préstamo
                    for(let i=0; i<this.clientes.length; i++){ //Recorrer los clientes
                      if(this.clientes[i].rut == clienteExistente.rut){ //Si el rut del cliente es igual al rut del cliente existente
                        this.firestoreService.updateCliente(this.clientes[i].id, cliente); //Actualizar el cliente con los nuevos datos
                      }
                    }
                    
                    // Agregar el préstamo
                    this.firestoreService
                    .addPrestamo({
                      tipoPrestado: tipoPrestado,
                      fecha: new Date(), // Fecha actual
                      idCliente: clienteExistente.id, // ID del cliente existente
                      nombreCliente: cliente.nombre,
                      rutCliente: cliente.rut,
                      devuelto: false,
                      numeroRodado: numeroRodado,
                    })
                    .then(() => {
                      this.presentToast('Préstamo ingresado con éxito', 'success');
                      this.clienteForm.reset();
                      this.router.navigate(['/inicio']);
                    });
                  },
                },
              ],
            }).then((alert) => {
              alert.present();
            });
            
  
          }
          // Si los datos del cliente no han sido modificados, agregar solamente el préstamo
          else{
            this.firestoreService
            .addPrestamo({
              tipoPrestado: tipoPrestado,
              fecha: new Date(),
              idCliente: clienteExistente.id,
              nombreCliente: cliente.nombre,
              rutCliente: cliente.rut,
              devuelto: false,
              numeroRodado: numeroRodado,
            })
            .then(() => {
              this.presentToast('Préstamo ingresado con éxito', 'success');
              this.clienteForm.reset();
              this.router.navigate(['/inicio']);
            });
          }
          
        }
      } else {
        // Si el cliente no existe, agregar el cliente y el préstamo
        this.firestoreService
          .addCliente(cliente, tipoPrestado, numeroRodado)
          .then((nuevoCliente) => {
            this.presentToast('Cliente ingresado con éxito', 'success');
            this.clienteForm.reset();
            this.router.navigate(['/inicio']);
          })
          .catch((error) => {
            this.presentToast('Error al crear el cliente', 'danger');
            console.error(error);
          });
      }
    } else { // Si el formulario no es válido
      this.presentToast('Complete todos los campos', 'danger');
    }
  }

  //Función para buscar un cliente
  buscarCliente() {
    // Formatear el RUT antes de buscar
    const rut_raw = this.rutFormateoDirective.getRawValue().toUpperCase();
    const rut = this.formatRut(rut_raw);

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

  // Función para formatear el RUT
  formatRut(rut: string): string {
    // Eliminar caracteres no numéricos, excepto la letra K
    rut = rut.replace(/[^0-9kK]/g, '');
    // Separar el dígito verificador
    const rutPart = rut.slice(0, -1);
    // Extraer el dígito verificador
    const dvPart = rut.slice(-1);
    // Formatear el RUT con puntos y guión
    return `${rutPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dvPart}`;
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
