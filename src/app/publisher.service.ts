import {Injectable} from '@angular/core';
import {Observable } from 'rxjs';
import {environment} from '../environments/environment';
export const WS_SUB_ENDPOINT = environment.wsSubEndpoint;
export const WS_PUB_ENDPOINT = environment.wsPubEndpoint;

@Injectable({
  providedIn: 'root'
})
export class PublisherService {
  // @ts-ignore
  public socket: WebSocket;
  public socketIsOpen = 1;

  constructor() { }

  createObservableSocket(url: string): Observable<any> {
    this.socket = new WebSocket(url);

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
