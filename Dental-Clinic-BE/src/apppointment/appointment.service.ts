import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Appointment } from '../entities/appointment.entity';
import { Repository, MoreThanOrEqual, LessThan } from 'typeorm';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
  ) {}

  /**
   * Tạo appointment mới từ DTO
   * - Lưu ý: nếu DTO chỉ truyền id cho quan hệ (doctorId, patientId...)
   *   bạn có thể map sang object { id } thay vì cần load full entity.
   */
  async create(createDto: CreateAppointmentDto): Promise<Appointment> {
    // Khởi tạo entity từ DTO (TypeORM sẽ gán field tương ứng)
    const appointment = this.appointmentRepo.create(createDto);
    return await this.appointmentRepo.save(appointment);
  }

  /**
   * Lấy danh sách lịch hẹn theo ngày (UTC-safe)
   * - date: chuỗi ISO hoặc 'YYYY-MM-DD'
   * - doctorId: lọc theo bác sĩ (tuỳ cấu trúc entity, ở đây giả định quan hệ: appointment.doctor)
   * - Trả về kèm các quan hệ: doctor, patient, service, room, chair
   *
   * Ghi chú:
   * - Dùng khoảng [startOfDay, nextStartOfDay) để không dính inclusive-inclusive của Between.
   * - Tránh tạo new Date(date) mơ hồ timezone; ta chuẩn hoá về 00:00:00 local của date đầu vào.
   */
  async findAllByDate(date: string, doctorId?: number): Promise<Appointment[]> {
    // 1) Parse ngày đầu vào
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    // 2) Tính mốc đầu ngày và đầu ngày kế tiếp theo local time
    const start = new Date(parsed);
    start.setHours(0, 0, 0, 0);

    const next = new Date(start);
    next.setDate(start.getDate() + 1);

    // 3) Xây where động, chú ý filter theo quan hệ doctor nếu có
    const where: any = {
      appointmentDateTime: MoreThanOrEqual(start),
      // < nextStartOfDay để không ăn trùm 00:00:00 ngày sau
      // (tách ra 2 điều kiện vì Between là inclusive-inclusive)
      // TypeORM chỉ nhận 1 operator/field -> tách thành AND trong mảng where
    };

    // TypeORM không hỗ trợ 2 operator trên 1 field cùng lúc trong 1 object,
    // nên ta sẽ dùng 'where: [ ... ]' để AND hai điều kiện thời gian.
    const whereTimeA = { ...where };
    const whereTimeB = {
      appointmentDateTime: LessThan(next),
    };

    // Thêm filter doctor nếu có (giả định quan hệ ManyToOne: appointment.doctor)
    const doctorFilter = doctorId ? { doctor: { doctorId } } : {};

    return await this.appointmentRepo.find({
      where: [
        { ...whereTimeA, ...doctorFilter },
        { ...whereTimeB, ...doctorFilter },
      ],
      relations: ['doctor', 'patient', 'service', 'room', 'chair'],
      order: { appointmentDateTime: 'ASC' },
    });
  }

  /**
   * Lấy tất cả lịch hẹn (mặc định sort mới nhất trước)
   */
  async findAll(): Promise<Appointment[]> {
    return await this.appointmentRepo.find({
      relations: ['doctor', 'patient', 'service', 'room', 'chair'],
      order: { appointmentDateTime: 'DESC' },
    });
  }
}
