import { Injectable } from '@angular/core';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WolfpackserverService {
  // @ts-ignore
  public socket: WebSocket;
  public socketIsOpen = 1;

  constructor() { }

  connectToSocket(url: string): Observable<any> {
    this.socket = new WebSocket(url, 'echo-protocol');

    return new Observable(
      observer => {

        this.socket.onmessage = (event) =>
          observer.next(event.data);

        this.socket.onerror = (event) => observer.error(event);

        this.socket.onclose = (event) => observer.complete();

        return () =>
          this.socket.close(1000, 'The user disconnected');
      }
    );
  }

  sendMessage(message: string): string {
    if (this.socket.readyState === this.socketIsOpen) {
      this.socket.send(message);
      return `Sent to server ${message}`;
    } else {
      return 'Message was not sent - the socket is closed';
    }
  }
}

