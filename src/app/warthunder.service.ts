import {Injectable} from '@angular/core';
import {Observable } from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {Message} from './message';
import {map} from 'rxjs/operators';
import {Instruments} from './instruments';

@Injectable({
  providedIn: 'root'
})
export class WarthunderService {
  constructor(private http: HttpClient) { }

  getState(): Observable<any> {
    const url = localStorage.getItem('endpoint') || 'http://localhost:8111';
    return this.http.get(url + '/state').pipe(
      map((data: any) => {
          const ias = data['IAS, km/h'];
          const vs = data['Vy, m/s'];
          const vsInKm = vs * (18 / 5);
          const climbAngle = Math.atan(vsInKm / ias) * (180 / Math.PI);
          return {
            altitude: data['H, m'],
            ias,
            tas: data['TAS, km/h'],
            verticleSpeed: vs,
            pitch: data['AoA, deg'],
            throttle: data['throttle 1, %'],
            climbAngle: Math.round(climbAngle),
            radiator: data['radiator 1, %'],
            oilTemp: data['oil temp 1, C'],
            waterTemp: data['water temp 1, C']
          } as Instruments;
        }
      )
    );
  }

  getIndicators(): Observable<any> {
    const url = localStorage.getItem('endpoint') || 'http://localhost:8111';
    return this.http.get(url + '/indicators').pipe(
      map((data: any) => {
          const bearingText = this.degToCompass(Math.round(data.compass));
          return {
            bearing: Math.round(data.compass),
            bearingReading: bearingText,
            propPitch: Math.round(data.prop_pitch_min),
            manifoldPressure: Math.round(data.manifold_pressure),
            valid: data.valid
          } as Instruments;
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

  getHudMessages(lastEvtId: number, lastDmgId: number): Observable<any> {
    const url = localStorage.getItem('endpoint') || 'http://localhost:8111';
    return this.http.get(url + '/hudmsg?lastEvt=' + lastEvtId + '&lastDmg=' + lastDmgId).pipe(
      map((data: any) => {
        return data.damage.map((message: any) => {
          return {
            id: message.id,
            msg: message.msg
          } as Message;
        });
      })
    );
  }

  degToCompass(num: any): any {
    const val = (num / 22.5) + .5;
    const arr = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return arr[Math.round((val % 16))];
  }
}
