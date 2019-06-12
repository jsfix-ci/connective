import { PinMap } from '../pin/pin-map';
import { PinLike } from '../pin/pin-like';
import { Pin } from '../pin/pin';

import { InputNotInSignatureError,
        OutputNotInSignatureError } from './errors/signature-mismatch.error';
import { Signature } from './signature';


export class Agent {
  private _inputs: PinMap;
  private _outputs: PinMap;

  constructor(readonly signature: Signature) {
    this._inputs = new PinMap(label => this.createInput(label));
    this._outputs = new PinMap(label => this.createOutput(label));
  }

  public in(label: string) { return this._inputs.get(label); }
  public out(label: string) { return this._outputs.get(label); }

  public get inputs(): PinMap { return this._inputs; }
  public get outputs(): PinMap { return this._outputs; }

  public clear(): this {
    this._inputs.clear();
    this._outputs.clear();
    return this;
  }

  protected checkInput(label: string) {
    if (!this.signature.inputs.includes(label))
      throw new InputNotInSignatureError(label, this.signature);
  }

  protected checkOutput(label: string) {
    if (!this.signature.outputs.includes(label))
      throw new OutputNotInSignatureError(label, this.signature);
  }

  protected createInput(label: string): PinLike {
    this.checkInput(label);
    return new Pin();
  }

  protected createOutput(label: string): PinLike {
    this.checkOutput(label);
    return new Pin();
  }
}
