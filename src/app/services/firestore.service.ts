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
addCliente(cliente: { nombre: string, rut: string }): Promise<void> {
  return this.firestore.collection('Cliente').add(cliente)  // Firestore generará un ID único
    .then((docRef) => {
      console.log('Cliente creado con éxito con ID:', docRef.id);
      this.addPrestamo({tipoPrestado: 'Carro', fecha: new Date(), idCliente: docRef.id, nombreCliente: cliente.nombre, devuelto: false});
    })
    .catch((error) => {
      console.error('Error al crear el cliente: ', error);
    });
}


//Crear un Prestamo
  addPrestamo(prestamo: {tipoPrestado: string,  fecha: Date, idCliente: string, nombreCliente: string,  devuelto: boolean}): Promise<void> {
    return this.firestore.collection('Prestamo').add(prestamo).then(() => {

      console.log('Prestamo creado con éxito');
    }).catch((error) => {
      console.log('Error al crear el prestamo: ', error);
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

  buscarCliente(rut: string): Observable<any> {
    return this.firestore.collection('Cliente', ref => ref.where('rut', '==', rut)).valueChanges({ idField: 'id' }).pipe(
      // Mapea el resultado a un único objeto
      map(clientes => clientes.length ? clientes[0] : null)
    );
  }
  
}
