import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {EMPTY, Observable, of} from 'rxjs';
import {map} from 'rxjs/operators';
import {Instruments, Message} from './app.component';

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
            } as Instruments;
      }
    )
    );
  }

  getIndicators(): Observable<any> {
    const url = localStorage.getItem('endpoint') || 'http://localhost:8111';
    return this.http.get(url + '/indicators').pipe(
      map((data: any) => {
          const bearingText = degToCompass(Math.round(data.compass));
          return {
            bearing: Math.round(data.compass),
            bearing_text: bearingText,
            prop_pitch: Math.round(data.prop_pitch_min),
            manifold_pressure: Math.round(data.manifold_pressure),
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
          return instrument as Instruments;
        })
      );
    }
    return EMPTY;
  }
}

function degToCompass(num: any): any {
  const val = (num / 22.5) + .5;
  const arr = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return arr[Math.round((val % 16))];
}
