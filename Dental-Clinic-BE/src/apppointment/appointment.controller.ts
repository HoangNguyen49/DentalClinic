import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { Appointment } from '../entities/appointment.entity';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

/**
 * DTO cho query GET /appointments
 * - date: chuỗi ISO hoặc 'YYYY-MM-DD' (optional)
 * - doctorId: number (optional)
 * Lưu ý: bật ValidationPipe({ transform: true }) ở app.module để Transform hoạt động.
 */
class GetAppointmentsQueryDto {
  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  doctorId?: number;
}

/**
 * AppointmentController
 * - POST /appointments: tạo lịch hẹn
 * - GET  /appointments: lấy tất cả hoặc lọc theo ngày/bác sĩ qua query
 */
@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  /**
   * Tạo appointment mới
   */
  @Post()
  create(@Body() dto: CreateAppointmentDto): Promise<Appointment> {
    return this.appointmentService.create(dto);
  }

  /**
   * Lấy danh sách appointments
   * - Nếu có query.date -> lọc theo ngày (và optional doctorId)
   * - Nếu không có date -> trả về toàn bộ (mặc định sort DESC trong service)
   *
   * Ví dụ:
   *   GET /appointments
   *   GET /appointments?date=2025-08-15
   *   GET /appointments?date=2025-08-15&doctorId=3
   */
  @Get()
  getAllOrByDate(
    @Query() query: GetAppointmentsQueryDto,
  ): Promise<Appointment[]> {
    const { date, doctorId } = query;
    if (date) {
      return this.appointmentService.findAllByDate(date, doctorId);
    }
    return this.appointmentService.findAll();
  }
}
