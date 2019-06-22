import { Observable, merge } from 'rxjs';

import { PinLike } from './pin-like';
import { Connectible } from './connectible';


export class Pin extends Connectible {
  protected isLocked(observable: Observable<any> | undefined) {
    return observable !== undefined;
  }

  protected shouldResolve(_: PinLike[], observable: Observable<any> | undefined) {
    return observable === undefined;
  }

  protected resolve(inbound: PinLike[]): Observable<any> {
    return (inbound.length == 1)?
      inbound[0].observable:
      merge(...inbound.map(pin => pin.observable));
  }
}


export default function() { return new Pin(); }
