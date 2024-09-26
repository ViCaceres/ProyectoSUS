import { Component, OnInit, ViewChild } from '@angular/core';
import { FirestoreService } from 'src/app/services/firestore.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { RutFormateoDirective } from 'src/app/directives/rut-formateo.directive';

@Component({
  selector: 'app-ingresar',
  templateUrl: './ingresar.page.html',
  styleUrls: ['./ingresar.page.scss'],
})
export class IngresarPage implements OnInit {
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
    private router: Router
  ) {
    this.selectedOption = 'Silla de Ruedas'; // Valor por defecto
    this.clienteForm = this.fb.group({
      nombre: ['', Validators.required],
      rut: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      telefono: [
        '',
        [Validators.required, Validators.pattern('^[0-9]{9,12}$')],
      ],
      numeroRodado: ['', Validators.required],
      tipoPrestado: [this.selectedOption, Validators.required], // Define el valor inicial
    });
  }

  ngOnInit() {
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

  onSegmentChange(event: any) {
    this.selectedOption = event.detail.value;
    this.clienteForm.get('tipoPrestado')?.setValue(this.selectedOption);
  }

  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000, // Duración en milisegundos (2 segundos)
      position: 'top', // Puedes cambiar la posición ('bottom', 'middle', 'top')
      color: color, // Puedes elegir el color ('danger', 'warning', etc.)
    });
    toast.present();
  }

  onSubmit() {
    if (this.clienteForm.valid) {
      const rut_raw = this.rutFormateoDirective.getRawValue().toUpperCase();
      const rut = this.formatRut(rut_raw);

      const { nombre, correo, telefono } = this.clienteForm.value;
      const tipoPrestado = this.clienteForm.get('tipoPrestado')?.value;
      const numeroRodado = this.clienteForm.get('numeroRodado')?.value;

      const cliente = { nombre, rut, correo, telefono };

      const clienteExistente = this.clientes.find((c) => c.rut === rut);
      
      // Si el cliente ya existe
      if (clienteExistente) {

        const datosModificados = 
          clienteExistente.nombre !== nombre ||
          clienteExistente.correo !== correo ||
          clienteExistente.telefono !== telefono;
        
        if (datosModificados) {
          this.firestoreService.updateCliente(clienteExistente.id, cliente)
        }

        const prestamoActivo = this.prestamos.some(
          (prestamo) => prestamo.idCliente === clienteExistente.id && !prestamo.devuelto
        );

        // Si tiene un préstamo activo, mostrar error
        if (prestamoActivo) {
          this.presentToast('Cliente ya tiene un préstamo activo', 'danger');
        } else {
          // Si no tiene un préstamo activo, agregar el préstamo
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
    } else {
      this.presentToast('Complete todos los campos', 'danger');
    }
  }

  buscarCliente() {
    const rut_raw = this.rutFormateoDirective.getRawValue().toUpperCase();
    const rut = this.formatRut(rut_raw);

    if (rut) {
      this.firestoreService.buscarCliente(rut).subscribe((cliente: any) => {
        if (cliente) {
          this.clienteForm.patchValue({
            nombre: cliente.nombre,
            rut: cliente.rut,
            correo: cliente.correo,
            telefono: cliente.telefono,
          });
          this.presentToast('Cliente encontrado', 'success');
        } else {
          this.clienteForm.reset(); // Limpiar el formulario si no se encuentra
          this.presentToast('Cliente no encontrado', 'danger');
        }
      });
    } else {
      this.presentToast('Ingrese un rut válido', 'danger');
    }
  }

  formatRut(rut: string): string {
    rut = rut.replace(/[^0-9kK]/g, '');
    const rutPart = rut.slice(0, -1);
    const dvPart = rut.slice(-1);
    return `${rutPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dvPart}`;
  }

  async terminosCondiciones() {
    const alert = await this.alertController.create({
      header: 'Términos y Condiciones',
      message: 'Aquí van tus términos y condiciones...',
      buttons: ['OK'],
    });

    await alert.present();
  }
}
