import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import {Observable, of, throwError} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {State, Indicators, Message, TeamInstrument} from './app.component';
import { EMPTY } from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class WarthunderService {
  constructor(private http: HttpClient) { }

  /**
   * Handle Http operation that failed.
   * Let the app continue.
   * @param operation - name of the operation that failed
   * @param result - optional value to return as the observable result
   */
  private handleError<T>(operation = 'operation', result?: T): (error: any) => Observable<T> {
    return (error: any): Observable<T> => {

      console.error(error); // log to console instead

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

  getState(): Observable<any> {
    const url = localStorage.getItem('endpoint') || 'http://localhost:8111';
    return this.http.get(url + '/state').pipe(
      map((data: any) => {
            const ias = data['IAS, km/h'];
            const tas = data['TAS, km/h'];
            const vs = data['Vy, m/s'];
            const vsInKm = vs * (18 / 5);
            const climbAngle = Math.atan(vsInKm / ias) * (180 / Math.PI);
            return {
              altitude: data['H, m'],
              indicated_air_speed: ias,
              true_air_speed: data['TAS, km/h'],
              vertical_speed: vs,
              pitch: data['AoA, deg'],
              throttle: data['throttle 1, %'],
              climb_angle: Math.round(climbAngle),
              radiator: data['radiator 1, %'],
              valid: data.valid
            } as State;
      }
    )
    );
  }

  getIndicators(): Observable<any> {
    const url = localStorage.getItem('endpoint') || 'http://localhost:8111';
    return this.http.get(url + '/indicators').pipe(
      map((data: any) => {
          return {
            bearing: Math.round(data.compass),
            prop_pitch: Math.round(data.prop_pitch_min),
            manifold_pressure: Math.round(data.manifold_pressure),
            valid: data.valid
          } as Indicators;
        }
      )
    );
  }

  getGameChat(lastId: number): Observable<any> {
    const url = localStorage.getItem('endpoint') || 'http://localhost:8111';
    return this.http.get(url + '/gamechat?lastId=' + lastId).pipe(
      map((data: any) => {
        return data.map((message: any) => {
          return {
            id: message.id,
            msg: message.msg,
            sender: message.sender,
            enemy: message.enemy,
            mode: message.mode,
          } as Message;
        });
      })
    );
  }

  uploadData(playerName: string, uploadObject: any): void {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    uploadObject = {telemetry: uploadObject};
    const url = localStorage.getItem('squadMembersEndpoint');
    if (url !== null) {
      this.http.post(url + '/players/' + encodeURIComponent(playerName),
        JSON.stringify(uploadObject), httpOptions).subscribe(
        (val) => {},
        response => {
          console.log('POST call in error', response);
        },
        () => {});
    }
  }

  getAllPlayers(): Observable<any> {
    const url = localStorage.getItem('squadMembersEndpoint');
    if (url !== null) {
      return this.http.get(url + '/players/').pipe(
        map((player: any) => {
          return player;
        })
      );
    }
    return EMPTY;
  }

  pullPlayerData(playerName: string): Observable<any> {
    const url = localStorage.getItem('squadMembersEndpoint');
    if (url !== null) {
      return this.http.get(url + '/players/' + playerName).pipe(
        map((instrument: any) => {
          return {
            playerName: playerName,
            bearing: instrument.bearing,
            prop_pitch: instrument.prop_pitch,
            manifold_pressure: instrument.manifold_pressure,
            altitude: instrument.altitude,
            indicated_air_speed: instrument.indicated_air_speed,
            true_air_speed: instrument.true_air_speed,
            vertical_speed: instrument.vertical_speed,
            pitch: instrument.pitch,
            throttle: instrument.throttle,
            climb_angle: instrument.climb_angle,
            radiator: instrument.radiator,
            valid: instrument.valid
          } as TeamInstrument;
        })
      );
    }
    return EMPTY;
  }
}
