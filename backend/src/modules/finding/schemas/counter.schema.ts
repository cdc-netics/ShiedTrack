import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

/**
 * Patrón "Counters" de MongoDB: un documento por clave lógica (campo `id`)
 * con secuencia numérica (`seq`) incrementada de forma atómica vía findOneAndUpdate.
 */
@Schema({ collection: "counters" })
export class Counter extends Document {
  /** Clave única del contador (ej. findings:<tenantId>:VULN:2026) */
  @Prop({ required: true, unique: true })
  id!: string;

  @Prop({ required: true, default: 0 })
  seq!: number;
}

export const CounterSchema = SchemaFactory.createForClass(Counter);
