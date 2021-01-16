import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Observable, of, throwError} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {State, Indicators, Message} from './app.component';

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
    console.log('Fetching State');
    return this.http.get('http://localhost:8111/state').pipe(
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
              climb_angle: climbAngle,
              radiator: data['radiator 1, %'],
              valid: data.valid
            } as State;
      }
    )
    );
  }

  getIndicators(): Observable<any> {
    console.log('Fetching Indicators');
    return this.http.get('http://localhost:8111/indicators').pipe(
      map((data: any) => {
          return {
            bearing: data.compass,
            prop_pitch: data.prop_pitch_min,
            manifold_pressure: data.manifold_pressure,
            valid: data.valid
          } as Indicators;
        }
      )
    );
  }

  getGameChat(lastId: number): Observable<any> {
    console.log('Fetching GameChat');
    return this.http.get('http://localhost:8111/gamechat?lastId=' + lastId).pipe(
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
}
