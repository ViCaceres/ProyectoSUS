import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import { FirestoreModuloModule } from 'src/app/modules/firestore-modulo/firestore-modulo.module';
import { FirestoreService } from 'src/app/services/firestore.service';

import { AlertController, ToastController } from '@ionic/angular';

import { Router } from '@angular/router';

@Component({
  selector: 'app-devolucion',
  templateUrl: './devolucion.page.html',
  styleUrls: ['./devolucion.page.scss'],
})
export class DevolucionPage implements OnInit {
  @ViewChild('signatureCanvas') signatureCanvas!: ElementRef<HTMLCanvasElement>;
  

  private ctx!: CanvasRenderingContext2D;
  private drawing = false;

  
  clientes: any[] = [];
  clienteSeleccionado: string = '';
  historial : any[] = [];

  constructor(private firestoreModule: FirestoreModuloModule, private firestoreService:FirestoreService, private alertController: AlertController, private toastController:ToastController, private router:Router) { }

  ngOnInit() {
    this.getClientes();
  }

  // Inicialización del canvas
  ngAfterViewInit() {
    this.ctx = this.signatureCanvas.nativeElement.getContext('2d')!;
    this.ctx.strokeStyle = '#000'; // Color del trazo
    this.ctx.lineWidth = 2; // Grosor del trazo

    // Soporte para ratón
    this.signatureCanvas.nativeElement.addEventListener('mousedown', this.startDrawing.bind(this));
    this.signatureCanvas.nativeElement.addEventListener('mousemove', this.draw.bind(this));
    this.signatureCanvas.nativeElement.addEventListener('mouseup', this.stopDrawing.bind(this));
    this.signatureCanvas.nativeElement.addEventListener('mouseleave', this.stopDrawing.bind(this));

     // Soporte para toque
  this.signatureCanvas.nativeElement.addEventListener('touchstart', this.startDrawing.bind(this));
  this.signatureCanvas.nativeElement.addEventListener('touchmove', this.draw.bind(this));
  this.signatureCanvas.nativeElement.addEventListener('touchend', this.stopDrawing.bind(this));
  this.signatureCanvas.nativeElement.addEventListener('touchcancel', this.stopDrawing.bind(this));
  }

  getClientes(){
    this.firestoreService.getPrestamos().subscribe((clientes: any) => {
      this.clientes = clientes;
      this.ordenarPrestamos();
    });

    this.firestoreService.getHistorial().subscribe((historial: any) => {
      this.historial = historial;
    });
  }
  
  ordenarPrestamos(){
    this.clientes.sort((a, b) => a.numeroRodado - b.numeroRodado);
  }

  // Función al seleccionar un cliente
  onClienteChange(event: any) {
    this.clienteSeleccionado = event.detail.value;

  }

  // Función para mostrar un mensaje emergente
  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000, // Duración en milisegundos (2 segundos)
      position: 'top', // Puedes cambiar la posición ('bottom', 'middle', 'top')
      color: color, // Puedes elegir el color ('danger', 'warning', etc.)
    });
    toast.present();
  }

  // Función para iniciar el dibujo
  startDrawing(event: MouseEvent | TouchEvent) {
    this.drawing = true;
    const rect = this.signatureCanvas.nativeElement.getBoundingClientRect();
    const x = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const y = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;
    this.ctx.beginPath();
    this.ctx.moveTo(x - rect.left, y - rect.top);
  }

  // Función al dibujar
  draw(event: MouseEvent | TouchEvent) {
    if (!this.drawing) return;
  const rect = this.signatureCanvas.nativeElement.getBoundingClientRect();
  const x = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
  const y = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;
  this.ctx.lineTo(x - rect.left, y - rect.top);
  this.ctx.stroke();
  }

  // Función al dejar de dibujar
  stopDrawing() {
    this.drawing = false;
    this.ctx.closePath();
  }

  // Función para limpiar el canvas
  clearCanvas() {
    this.ctx.clearRect(0, 0, this.signatureCanvas.nativeElement.width, this.signatureCanvas.nativeElement.height);
  }

  // Función para guardar la firma y eliminar el cliente seleccionado
  saveSignature() {
    if (this.clienteSeleccionado === '') {
      this.presentToast('Selecciona un cliente', 'danger');
      return;
    }
    else{
      this.firestoreService.deleteClientePrestamo(this.clienteSeleccionado);
      for(let i = 0; i < this.historial.length; i++){
        if(this.historial[i].idCliente === this.clienteSeleccionado){
          this.firestoreService.updateHistorial(this.historial[i].docId, {devuelto: true}).then(()=>{
            console.log('Historial actualizado con éxito');
          }).catch((error) => {
            console.error('Error al actualizar el historial: ', error);
          });
        }
      }
      this.presentToast('Devolución realizada con éxito', 'success');
      this.router.navigate(['/inicio']);
      // Limpiar canvas
      this.clearCanvas();
      this.getClientes();
  }
    }
    
  

}
