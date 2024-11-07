import { Component, OnInit, ViewChild,ElementRef } from '@angular/core';

import { FirestoreModuloModule } from 'src/app/modules/firestore-modulo/firestore-modulo.module';
import { FirestoreService } from 'src/app/services/firestore.service';
import { IonModal } from '@ionic/angular';
import { OverlayEventDetail } from '@ionic/core/components';
import { AlertController, ToastController } from '@ionic/angular';


import * as moment from 'moment'; //Necesario para el manejo de fechas
import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

Chart.register(ChartDataLabels);


@Component({
  selector: 'app-stock',
  templateUrl: './stock.page.html',
  styleUrls: ['./stock.page.scss'],
})
export class StockPage implements OnInit {
  @ViewChild('modal_kpi') confirmationModal!: IonModal;
  @ViewChild('modalContenidoPDF', { static: false }) modalContenidoPDF!: ElementRef;


  // Inicialización de variables
  prestamos_actuales : any[] = [];
  historial: any[] = [];
  clienteSeleccionado: string = '';
  numeroCliente : number = 0;
  clientes : any[] = [];
  contadorSillas : number = 0;
  contadorCoches : number = 0;
  fechaActual : any = null;
  fechaPrestamo : any = null;
  image: string = "../../../assets/Arauco_solo_logo.png"
  searchText = '';
  searchDate = '';
  prestamosFiltro : any[] = [];

  flagPrestamos = 'actual';
  isCalendarVisible: boolean = false; // Variable para controlar la visibilidad del calendario
  telefonos : {[id:string]:string} = {}; // Objeto que almacena los teléfonos de los clientes


  dataPrestamo : any[] = [];
  contadorHistorico : any[] = [];

  chartInstance: Chart<'doughnut', number[], string> | null = null; // Ajuste de tipo
  chartInstance2: Chart | null = null; // Referencia al gráfico


  



  constructor(private firestoreModule: FirestoreModuloModule, private firestoreService:FirestoreService, private toastController: ToastController, public alertController: AlertController) {

    
    
  } 

  // Método que se ejecuta al iniciar la vista
  ngOnInit() {
    this.getPrestamos();
    this.fechaActual = moment().format('DD/MM/YYYY');
    this.searchDate = moment().format('DD/MM/YYYY');

    const fechaActual = moment().format('YYYY-MM-DD');
    this.searchDate = fechaActual;
    
  }

  


  toggleCalendar() {
    this.isCalendarVisible = !this.isCalendarVisible; // Cambia la visibilidad del calendario
  }

  cancel(){
    this.confirmationModal.dismiss(null, 'cancel');
  }
  confirm(){
    this.confirmationModal?.dismiss(confirm, 'confirm');
  }
  


  // Método para obtener los prestamos actuales, y también obtiene clientes
  getPrestamos(){
    this.firestoreService.getPrestamos().subscribe((prestamos: any) => {
      this.prestamos_actuales = prestamos;
      this.prestamosFiltro = this.prestamos_actuales
      this.dataPrestamo = this.prestamos_actuales;


    });

    this.firestoreService.getClientes().subscribe((clientes: any) => {
      this.clientes = clientes;
      this.clientes.forEach(cliente => {
        this.telefonos[cliente.id] = cliente.telefono ; // Asigna el teléfono al id del cliente
      });

    });

    this.firestoreService.getHistorial().subscribe((historial: any) => {
      this.historial = historial;
      this.filterPrestamos();
    });

    this.firestoreService.getContadorHistorico().subscribe((contadorHistorico: any) => {
      this.contadorHistorico = contadorHistorico;
      
      if(this.prestamos_actuales.length > 0 && this.historial.length > 0){
        this.filterPrestamos();
      }
        
      

    });

  }



    filterPrestamos() {
      this.contadorCoches = 0;
      this.contadorSillas = 0;

      if(!this.searchDate){
        this.prestamosFiltro = this.prestamos_actuales;
        return;
      }
      const fechaSeleccionada = moment(this.searchDate).startOf('day');
      const fechaActual = moment().startOf('day');
      let fechaPrestamoTimestamp : any;


      
      if(moment(fechaSeleccionada).isBefore(fechaActual)){ 
        this.flagPrestamos = 'menor';
      }
      else if(moment(fechaSeleccionada).isAfter(fechaActual)){
        this.flagPrestamos = 'mayor';
      }
      else if(moment(fechaSeleccionada).isSame(fechaActual)){
        this.flagPrestamos = 'actual';
      }
      

      this.prestamosFiltro = this.historial.filter(historial => {
        fechaPrestamoTimestamp = historial.fecha;
        const fechaPrestamo = fechaPrestamoTimestamp.toDate(); // Esto convierte el timestamp a un objeto Date
        this.dataPrestamo = this.prestamosFiltro; //Prestamos pendientes según día.

        const matchesFecha = moment(fechaPrestamo).isSame(fechaSeleccionada, 'day');
        const matchesSearchText = historial.nombreCliente.toLowerCase().includes(this.searchText.toLowerCase());
        const numeroRodado= historial.numeroRodado.includes(this.searchText);
        if(matchesFecha && matchesSearchText){
        return matchesFecha && matchesSearchText ;
        }
        else if (matchesFecha && numeroRodado){
          return matchesFecha && numeroRodado;
        }

      })
      for(let i=0; i < this.contadorHistorico.length; i++){
        const fechaHistorial = moment(this.contadorHistorico[i].fecha.toDate()).startOf('day');
        if(fechaHistorial.isSame(fechaSeleccionada, 'day')){
          this.contadorSillas += this.contadorHistorico[i].sillas;
          this.contadorCoches += this.contadorHistorico[i].coches;
        }
      }


      this.dataPrestamo = this.prestamosFiltro;
      this.KPIdata(this.dataPrestamo);


    }






    getTelefono(id: string): string {
      const cliente = this.clientes.find(cliente => cliente.id === id);
  
      if (!cliente) {
          return ''; // Retorna un string vacío si no se encuentra el cliente
      }
  
      return cliente.telefono || ''; // Devuelve el teléfono o un string vacío si no tiene
  }
  

  

  formatDate(fecha: any): string {
    return moment(fecha.toDate()).format('DD/MM/YYYY HH:mm:ss');
  }


  
  buscarCliente(event: any){
    this.searchText = event.target.value;
    
  }


  
  totalPrestamos : number = 0;
  prestamosActivos : number = 0;
  prestamosFinalizados : number = 0;
  clienteUnico :Set<string> = new Set();
  horaPeak : string = '';
  horaYcantidad : {hora: number, cantidad: number}[] = [{hora: 0, cantidad: 0}];
  prestamosUltimoMes : number = 0;  
  fechaSeleccionada : any = null;

  //KPI DATOS
  KPIdata(prestamos: any){  {
    this.totalPrestamos = prestamos.length;
    this.prestamosActivos = 0;
    this.prestamosFinalizados = 0;
    this.clienteUnico.clear();
    let prestamosPorHora: {[id:string]: number } = {};
    this.fechaSeleccionada= moment(this.searchDate).format('DD/MM/YYYY');
    this.prestamosUltimoMes = 0;

    let mesInicio = moment(this.searchDate).subtract('month').startOf('month');
    let mesFin = moment(this.searchDate).subtract('month').endOf('month');

    const finMes = moment(this.searchDate).clone().endOf('month');
    if(moment(this.searchDate).isSame(finMes, 'day')){
      this.historial.forEach((historial: any) => {
        const fechaPrestamo = moment(historial.fecha.toDate()).startOf('day');
        if(fechaPrestamo.isBetween(mesInicio, mesFin, 'day', '[]')){
          this.prestamosUltimoMes++;
          console.log(this.prestamosUltimoMes);
        }
      });
      
    }
    else{

    }
      


    prestamos.forEach((prestamo: any) => {
      if(prestamo.devuelto === false){
        this.prestamosActivos++;
      }
      else if(prestamo.devuelto === true){
        this.prestamosFinalizados++;
      }
      this.clienteUnico.add(prestamo.idCliente); //Clienteunico.size = cantidad de clientes unicos


      const hora = moment(prestamo.fecha.toDate()).format('HH');

      prestamosPorHora[hora] = (prestamosPorHora[hora] || 0) + 1;


      
      
      

      
    });

    this.horaYcantidad = Object.entries(prestamosPorHora).map(([hora, cantidad]) => ({hora: parseInt(hora), cantidad}));

    if(Object.keys(prestamosPorHora).length > 0){
      const horaFormato = Object.keys(prestamosPorHora).map(hora => {
        const hour = Number(hora) % 12 || 12; //Convierte la hora a formato 12 horas
        const ampm = Number(hora) < 12 ? 'AM' : 'PM';
        return `${hour} ${ampm}`;
      });

      this.horaPeak = horaFormato.reduce((a,b,index) =>
        prestamosPorHora[Object.keys(prestamosPorHora)[index]] > prestamosPorHora[Object.keys(prestamosPorHora).find(h => h.includes(b)) || ''] ? a : b
      );
    }else{
      this.horaPeak = 'No hay datos';
    }


    

      

  }}

  

  generatePDF(){
    if(this.flagPrestamos === 'actual' || this.flagPrestamos === 'menor'){
      const element = this.modalContenidoPDF.nativeElement;

      html2canvas(element).then((canvas) =>{
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height],
        });

        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`Stock ${this.fechaSeleccionada}.pdf`);
      }).catch(err => {
        console.error('Error al generar PDF', err);
      });
    }
    else if(this.flagPrestamos === 'mayor'){
      this.presentToast('No se puede generar un PDF de una fecha futura', 'danger');
    }

    
    
  }

  chart(){
    const ctx = document.getElementById('myChart') as HTMLCanvasElement | null;
    
    if(this.chartInstance){
      this.chartInstance.destroy();
    }

    if (ctx) {
      this.chartInstance=new Chart<'doughnut',number[],string>(ctx, {
      type: 'doughnut',
      data:{
        labels: ['Préstamos Activos', 'Prestamo Finalizados'],
        datasets: [{
          label: 'Préstamos',
          data: [this.prestamosActivos, this.prestamosFinalizados],
          backgroundColor: [
            '#0093d5',
            '#003b5c'
          ],
          borderWidth: 1
        }]
    },
    options:{
      plugins:{
        
          datalabels:{
            anchor: 'center',
            align: 'center',
            formatter:(value) => value.toString(),
            color: 'white',
          }

      }


    }

  });
  }
}

//Hora y cantidad de prestamos
  chart2(){
    const ctx2 = document.getElementById('fechaYcantidad') as HTMLCanvasElement | null;
    
    if(this.chartInstance2){
      this.chartInstance2.destroy();
    }

    if (ctx2) {
      this.chartInstance2=new Chart(ctx2, {
      type: 'bar',
      data:{
        labels: this.horaYcantidad.map(horaYcantidad => {
          const hour = horaYcantidad.hora % 12 || 12; //Convierte la hora a formato 12 horas
          const ampm = horaYcantidad.hora < 12 ? 'AM' : 'PM';
          return `${hour} ${ampm}`;
          
        }),
        datasets: [
          {
            label: 'Cantidad de prestamos por Hora',
            data: this.horaYcantidad.map(horaYcantidad => horaYcantidad.cantidad),
          }
        ]
    },
    options:{
      scales: {
        y: {
          ticks: {
            callback : function(value){
              return Number.isInteger(value) ? value : null;
            }
          }}
        }
    } 
  });

    }}


  ionModalDidPresent(){
    this.chart();
    this.chart2();

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

}
