import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateAppointmentDto {
  @IsDateString()
  appointmentDateTime: Date;

  @IsString()
  @IsOptional()
  note?: string;

  @IsString()
  @IsOptional()
  channel?: string;

  @IsInt()
  patientId: number;

  @IsInt()
  doctorId: number;

  @IsInt()
  serviceId: number;

  @IsInt()
  roomId: number;

  @IsInt()
  chairId: number;

  @IsString()
  status: string;
}