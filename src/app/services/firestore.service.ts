import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs';
import * as moment from 'moment' ;

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {

  constructor(private firestore: AngularFirestore) { }

// Crear un cliente con ID autogenerado
addCliente(cliente: { nombre: string, rut: string, correo: string, telefono: string }, tipoPrestado: string, numeroRodado: string): Promise<string> {
  return this.firestore.collection('Cliente').add(cliente)  // Firestore generará un ID único
    .then((docRef) => {
      // Actualiza el documento con el ID generado
      return docRef.update({ id: docRef.id }).then(() => docRef.id);
    })
    .then((idCliente) => {
      // Crea el préstamo
      return this.addPrestamo({
        tipoPrestado: tipoPrestado,
        fecha: new Date(),
        idCliente: idCliente,
        nombreCliente: cliente.nombre,
        rutCliente: cliente.rut,
        devuelto: false,
        numeroRodado: numeroRodado
      }).then(() => idCliente);  // Asegúrate de devolver el ID del cliente
    })
    .then((idCliente) => {
      // Agrega el historial
      return this.addHistorial({
        idCliente: idCliente, // Aquí debería ir el ID del cliente recién creado
        nombreCliente: cliente.nombre,
        rutCliente: cliente.rut,
        fecha: new Date(),
        numeroRodado: numeroRodado,
        devuelto: false
      }).then(() => {
        console.log('Historial creado con éxito FIRESTORE 1');
        return idCliente;
      });
    })
    .then((idCliente) => {
      // Agregar contador histórico
      // Primero, obtener los valores actuales de sillas y coches según el tipoPrestado
      let sillas = 0;
      let coches = 0;

      if (tipoPrestado === 'Silla de ruedas') {
        sillas = 1;  // Incrementar sillas prestadas
      } else if (tipoPrestado === 'Coche') {
        coches = 1;  // Incrementar coches prestados
      }

      // Agregar el contador histórico con la fecha actual y los valores de sillas y coches
      return this.addContadorHistorico({
        fecha: new Date(),
        sillas: sillas,
        coches: coches
      }).then(() => {
        console.log('Contador histórico actualizado con éxito');
        return idCliente; // Devuelve el ID del cliente para su uso posterior
      });
    })
    .catch((error) => {
      console.error('Error al crear el cliente o historial: ', error);
      throw error;
    });
}




//Crear un Prestamo
  addPrestamo(prestamo: {tipoPrestado: string,  fecha: Date, idCliente: string, nombreCliente: string, rutCliente:string,  devuelto: boolean, numeroRodado:string}): Promise<void> {
    return this.firestore.collection('Prestamo').add(prestamo).then(() => {
      console.log('Prestamo creado con éxito'); // Si se crea correctamente, se muestra en consola para depuración
    }).catch((error) => {
      console.log('Error al crear el prestamo: ', error); // Si ocurre un error, se muestra en consola para depuración
    });
  }

  addHistorial(historial: {idCliente: string, nombreCliente: string, rutCliente:string, fecha: Date, numeroRodado: string, devuelto: boolean}): Promise<void> {
    return this.firestore.collection('Historial').add(historial).then(() => {
      console.log('Historial creado con éxito FIRESTORE 2'); // Si se crea correctamente, se muestra en consola para depuración
    }).catch((error) => {
      console.log('Error al crear el historial: ', error); // Si ocurre un error, se muestra en consola para depuración
    });
  }

  addContadorHistorico(contadorHistorico: {fecha: Date, sillas:number, coches:number}): Promise<void> {
    return this.firestore.collection('ContadorHistorico').add(contadorHistorico).then(() => {
      console.log('Contador histórico creado con éxito'); // Si se crea correctamente, se muestra en consola para depuración
    }).catch((error) => {
      console.log('Error al crear el contador histórico: ', error); // Si ocurre un error, se muestra en consola para depuración
    });
  }

  // Obtener todos los clientes
  getClientes(): Observable<any[]> {
    return this.firestore.collection('Cliente').valueChanges({idField: 'id'});
  }

  // Obtener todos los prestamos
  getPrestamos(): Observable<any[]> {
    return this.firestore.collection('Prestamo').valueChanges({idField: 'id'});
  }

  getHistorial() {
    return this.firestore.collection('Historial').snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data() as { [key: string]: any };
        const docId = a.payload.doc.id;
        return { docId, ...data }; // Incluye el ID del documento junto con los datos
      }))
    );
  }
  

  getContadorHistorico(): Observable<any[]> {
    return this.firestore.collection('ContadorHistorico').valueChanges({idField: 'id'});
  }

  // Función para buscar un cliente
  buscarCliente(rut: string): Observable<any> {
    // Realiza la consulta en Firestore para buscar un cliente por su rut
    return this.firestore.collection('Cliente', ref => ref.where('rut', '==', rut)).valueChanges({ idField: 'id' }).pipe(
      // Mapea el resultado a un único objeto
      map(clientes => clientes.length ? clientes[0] : null)
    );
  }

  // Función para actualizar un cliente existente
  updateCliente(id: string, clienteActualizado: any) {
    return this.firestore.collection('Cliente').doc(id).update(clienteActualizado); // Actualiza el cliente en Firestore
  }
  updateHistorial(id:string, historialActualizado: any){
    return this.firestore.collection('Historial').doc(id).update(historialActualizado);
  }

  // Función para eliminar un cliente
  deleteClientePrestamo(idCliente: string) {
  this.firestore.collection('Prestamo').get().subscribe((snapshot) => {
    snapshot.docs.forEach((doc) => { // Itera sobre los documentos de la colección
      const prestamoData : any =  doc.data(); // Obtiene los datos del préstamo
      if (prestamoData.idCliente === idCliente) { // Si el ID del cliente coincide con el ID del préstamo
        this.firestore.collection('Prestamo').doc(doc.id).delete().then(() => {
          console.log('Préstamo eliminado con éxito'); // Si se elimina correctamente, se muestra en consola para depuración
        }).catch((error) => {
          console.error('Error al eliminar el préstamo:', error); // Si ocurre un error, se muestra en consola para depuración
        });
      }
    });
  });
}

  
}
