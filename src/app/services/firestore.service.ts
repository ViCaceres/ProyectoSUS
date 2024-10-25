import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {

  constructor(private firestore: AngularFirestore) { }

// Crear un cliente con ID autogenerado
addCliente(cliente: { nombre: string, rut: string,correo:string,telefono:string}, tipoPrestado:string, numeroRodado:string): Promise<void> {
  return this.firestore.collection('Cliente').add(cliente)  // Firestore generará un ID único
    .then((docRef) => {
      return docRef.update({id: docRef.id}) // Actualiza el documento con el ID generado
      .then(() => { // Si se actualiza correctamente, se crea el préstamo
        return this.addPrestamo({
          tipoPrestado: tipoPrestado, 
          fecha: new Date(), 
          idCliente: docRef.id, 
          nombreCliente: cliente.nombre,
          rutCliente: cliente.rut, 
          devuelto: false, 
          numeroRodado: numeroRodado
        });
      })
    }) 
    .catch((error) => { // Si ocurre un error, se muestra en consola para depuración
      console.error('Error al crear el cliente: ', error);
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


  // Obtener todos los clientes
  getClientes(): Observable<any[]> {
    return this.firestore.collection('Cliente').valueChanges({idField: 'id'});
  }

  // Obtener todos los prestamos
  getPrestamos(): Observable<any[]> {
    return this.firestore.collection('Prestamo').valueChanges({idField: 'id'});
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
