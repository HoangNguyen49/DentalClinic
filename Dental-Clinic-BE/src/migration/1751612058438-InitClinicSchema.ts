import { MigrationInterface, QueryRunner } from "typeorm";

export class InitClinicSchema1751612058438 implements MigrationInterface {
    name = 'InitClinicSchema1751612058438'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "Departments" ("DepartmentId" int NOT NULL IDENTITY(1,1), "DepartmentName" nvarchar(255) NOT NULL, CONSTRAINT "PK_019a0ca51fbb01619d572d81a25" PRIMARY KEY ("DepartmentId"))`);
        await queryRunner.query(`CREATE TABLE "Services" ("ServiceId" int NOT NULL IDENTITY(1,1), "ServiceName" nvarchar(255) NOT NULL, "Description" nvarchar(255) NOT NULL, "Price" decimal NOT NULL, "Duration" int NOT NULL, "CreatedAt" datetime2 NOT NULL CONSTRAINT "DF_ec1c708f94a7bb635ffb32b4698" DEFAULT getdate(), "UpdatedAt" datetime2 NOT NULL CONSTRAINT "DF_a30280a32a0b450464b7e3db080" DEFAULT getdate(), CONSTRAINT "PK_056b5413a2fc3327153335be1a4" PRIMARY KEY ("ServiceId"))`);
        await queryRunner.query(`CREATE TABLE "MedicalRecordImages" ("ImageId" int NOT NULL IDENTITY(1,1), "ImageUrl" nvarchar(255) NOT NULL, "Description" nvarchar(255), "RecordId" int NOT NULL, "CreatedAt" datetime2 NOT NULL CONSTRAINT "DF_b72b90655c427a1091be9198b75" DEFAULT getdate(), "medicalRecordRecordId" int, CONSTRAINT "PK_e1b18895c5969fe897509793974" PRIMARY KEY ("ImageId"))`);
        await queryRunner.query(`CREATE TABLE "MedicalRecords" ("RecordId" int NOT NULL IDENTITY(1,1), "Diagnosis" nvarchar(255) NOT NULL, "TreatmentPlan" nvarchar(255) NOT NULL, "Note" nvarchar(255), "RecordDate" datetime NOT NULL, "PatientId" int NOT NULL, "DoctorId" int NOT NULL, "ServiceId" int NOT NULL, "CreatedAt" datetime2 NOT NULL CONSTRAINT "DF_49baa0747b6ff9ef39dfb15881f" DEFAULT getdate(), "UpdatedAt" datetime2 NOT NULL CONSTRAINT "DF_5891ca92082a7739e60a5ff953c" DEFAULT getdate(), "patientPatientId" int, "doctorUserId" int, "serviceServiceId" int, CONSTRAINT "PK_18554c33b0b055e60b96fb7e4eb" PRIMARY KEY ("RecordId"))`);
        await queryRunner.query(`CREATE TABLE "Payments" ("PaymentId" int NOT NULL IDENTITY(1,1), "Amount" decimal NOT NULL, "PaymentMethod" nvarchar(255) NOT NULL, "PaymentDate" datetime NOT NULL, "Note" nvarchar(255), "InvoiceId" int NOT NULL, "invoiceInvoiceId" int, CONSTRAINT "PK_d10fba14179731739d4c81a08ab" PRIMARY KEY ("PaymentId"))`);
        await queryRunner.query(`CREATE TABLE "Invoices" ("InvoiceId" int NOT NULL IDENTITY(1,1), "TotalAmount" decimal NOT NULL, "PaidAmount" decimal NOT NULL, "PaymentStatus" nvarchar(255) NOT NULL, "PaymentMethod" nvarchar(255) NOT NULL, "InvoiceDate" datetime NOT NULL, "PatientId" int NOT NULL, "AppointmentId" int NOT NULL, "CreatedAt" datetime2 NOT NULL CONSTRAINT "DF_46d7b2ec5e1771d627944bcbf77" DEFAULT getdate(), "UpdatedAt" datetime2 NOT NULL CONSTRAINT "DF_b54995542b8f16ad57fa05e7707" DEFAULT getdate(), "patientPatientId" int, "appointmentAppointmentId" int, CONSTRAINT "PK_21112007dbf6e5fe16a7ccadadc" PRIMARY KEY ("InvoiceId"))`);
        await queryRunner.query(`CREATE TABLE "CrmCampaigns" ("CampaignId" int NOT NULL IDENTITY(1,1), "CampaignName" nvarchar(255) NOT NULL, "Description" nvarchar(255) NOT NULL, "StartDate" datetime NOT NULL, "EndDate" datetime NOT NULL, "Status" nvarchar(255) NOT NULL, CONSTRAINT "PK_4a0bd790076d7d0d57cbcc88cd6" PRIMARY KEY ("CampaignId"))`);
        await queryRunner.query(`CREATE TABLE "CrmLogs" ("LogId" int NOT NULL IDENTITY(1,1), "Channel" nvarchar(255) NOT NULL, "Status" nvarchar(255) NOT NULL, "SentAt" datetime NOT NULL, "CampaignId" int NOT NULL, "PatientId" int NOT NULL, "campaignCampaignId" int, "patientPatientId" int, CONSTRAINT "PK_8ae767df48db622c70f45fa70fc" PRIMARY KEY ("LogId"))`);
        await queryRunner.query(`CREATE TABLE "Patients" ("PatientId" int NOT NULL IDENTITY(1,1), "FullName" nvarchar(255) NOT NULL, "Gender" nvarchar(255) NOT NULL, "DateOfBirth" datetime NOT NULL, "Phone" nvarchar(255) NOT NULL, "Email" nvarchar(255) NOT NULL, "Address" nvarchar(255) NOT NULL, "Note" nvarchar(255), "CreatedAt" datetime2 NOT NULL CONSTRAINT "DF_9c93cdff9760a1aeffbb348e9f8" DEFAULT getdate(), "UpdatedAt" datetime2 NOT NULL CONSTRAINT "DF_35f86eedd96339799264172d1dd" DEFAULT getdate(), CONSTRAINT "PK_4c4eb825cd82eb9f5440831e488" PRIMARY KEY ("PatientId"))`);
        await queryRunner.query(`CREATE TABLE "Chairs" ("ChairId" int NOT NULL IDENTITY(1,1), "ChairNumber" nvarchar(255) NOT NULL, "RoomId" int NOT NULL, "roomRoomId" int, CONSTRAINT "PK_4aca85770128937e4214f5ec659" PRIMARY KEY ("ChairId"))`);
        await queryRunner.query(`CREATE TABLE "Rooms" ("RoomId" int NOT NULL IDENTITY(1,1), "RoomName" nvarchar(255) NOT NULL, "IsPrivate" bit NOT NULL, "NumberOfChairs" int NOT NULL, CONSTRAINT "PK_4fb6d03863d369a15659b2957b2" PRIMARY KEY ("RoomId"))`);
        await queryRunner.query(`CREATE TABLE "Products" ("ProductId" int NOT NULL IDENTITY(1,1), "ProductName" nvarchar(255) NOT NULL, "Category" nvarchar(255) NOT NULL, "QuantityInStock" int NOT NULL, "Unit" nvarchar(255) NOT NULL, "Price" decimal NOT NULL, "CreatedAt" datetime2 NOT NULL CONSTRAINT "DF_303a08027af2771527d9380759c" DEFAULT getdate(), "UpdatedAt" datetime2 NOT NULL CONSTRAINT "DF_404de7f33915527ff6ce21373b6" DEFAULT getdate(), CONSTRAINT "PK_5fb01991b1b726954a6230c9747" PRIMARY KEY ("ProductId"))`);
        await queryRunner.query(`CREATE TABLE "ProductUsage" ("UsageId" int NOT NULL IDENTITY(1,1), "QuantityUsed" int NOT NULL, "UsedAt" datetime NOT NULL, "ProductId" int NOT NULL, "AppointmentId" int NOT NULL, "productProductId" int, "appointmentAppointmentId" int, CONSTRAINT "PK_6aab89c2c8d8e828fa348d5d8a6" PRIMARY KEY ("UsageId"))`);
        await queryRunner.query(`CREATE TABLE "Appointments" ("AppointmentId" int NOT NULL IDENTITY(1,1), "AppointmentDateTime" datetime NOT NULL, "Status" nvarchar(255) NOT NULL, "Note" nvarchar(255), "Channel" nvarchar(255), "PatientId" int NOT NULL, "DoctorId" int NOT NULL, "ServiceId" int NOT NULL, "RoomId" int NOT NULL, "ChairId" int NOT NULL, "CreatedAt" datetime2 NOT NULL CONSTRAINT "DF_d3d56e24f826242ec9c8f3adbf8" DEFAULT getdate(), "UpdatedAt" datetime2 NOT NULL CONSTRAINT "DF_29ee862b4615ecd27b00ad91ade" DEFAULT getdate(), "patientPatientId" int, "doctorUserId" int, "serviceServiceId" int, "roomRoomId" int, "chairChairId" int, CONSTRAINT "PK_701074a382d120959ffab717c59" PRIMARY KEY ("AppointmentId"))`);
        await queryRunner.query(`CREATE TABLE "Attendance" ("AttendanceId" int NOT NULL IDENTITY(1,1), "CheckInTime" datetime NOT NULL, "CheckOutTime" datetime NOT NULL, "IsOvertime" bit NOT NULL, "Note" nvarchar(255), "UserId" int NOT NULL, "userUserId" int, CONSTRAINT "PK_86c00d119f7d43c2409dbcde0bf" PRIMARY KEY ("AttendanceId"))`);
        await queryRunner.query(`CREATE TABLE "Logs" ("LogId" int NOT NULL IDENTITY(1,1), "Action" nvarchar(255) NOT NULL, "TableName" nvarchar(255) NOT NULL, "RecordId" int NOT NULL, "ActionTime" datetime NOT NULL, "UserId" int NOT NULL, "userUserId" int, CONSTRAINT "PK_354598c0ca42ad4e4a7781d0e76" PRIMARY KEY ("LogId"))`);
        await queryRunner.query(`CREATE TABLE "Users" ("UserId" int NOT NULL IDENTITY(1,1), "FullName" nvarchar(255) NOT NULL, "Username" nvarchar(255) NOT NULL, "PasswordHash" nvarchar(255) NOT NULL, "Email" nvarchar(255) NOT NULL, "Phone" nvarchar(255), "Role" nvarchar(255) NOT NULL, "AvatarUrl" nvarchar(255), "DepartmentId" int, "CreatedAt" datetime2 NOT NULL CONSTRAINT "DF_0aacbc61aa36d6a82383817a94d" DEFAULT getdate(), "UpdatedAt" datetime2 NOT NULL CONSTRAINT "DF_ed41b76bd60b64a976d388b6f33" DEFAULT getdate(), "departmentDepartmentId" int, CONSTRAINT "UQ_a842ddfeb687f3df0f862ca73ea" UNIQUE ("Username"), CONSTRAINT "UQ_884fdf47515c24dbbf6d89c2d84" UNIQUE ("Email"), CONSTRAINT "PK_aedbd821ea6272148b6a8f18ae6" PRIMARY KEY ("UserId"))`);
        await queryRunner.query(`ALTER TABLE "MedicalRecordImages" ADD CONSTRAINT "FK_22140dccfa30821e7493b01e452" FOREIGN KEY ("medicalRecordRecordId") REFERENCES "MedicalRecords"("RecordId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "MedicalRecords" ADD CONSTRAINT "FK_515c515bd47711e7ca9de748d42" FOREIGN KEY ("patientPatientId") REFERENCES "Patients"("PatientId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "MedicalRecords" ADD CONSTRAINT "FK_4d042be57439515b6388428b26f" FOREIGN KEY ("doctorUserId") REFERENCES "Users"("UserId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "MedicalRecords" ADD CONSTRAINT "FK_a958ddaa5f1a4e2f28014e7bc5e" FOREIGN KEY ("serviceServiceId") REFERENCES "Services"("ServiceId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Payments" ADD CONSTRAINT "FK_75198d5a07020ab405bfcac0bdf" FOREIGN KEY ("invoiceInvoiceId") REFERENCES "Invoices"("InvoiceId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Invoices" ADD CONSTRAINT "FK_aa59c195be883525d2fd33117fd" FOREIGN KEY ("patientPatientId") REFERENCES "Patients"("PatientId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Invoices" ADD CONSTRAINT "FK_5d60e417ce94a5cfee3f52bb113" FOREIGN KEY ("appointmentAppointmentId") REFERENCES "Appointments"("AppointmentId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "CrmLogs" ADD CONSTRAINT "FK_1ef4fc30108e5b0fce9fbbdb7fe" FOREIGN KEY ("campaignCampaignId") REFERENCES "CrmCampaigns"("CampaignId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "CrmLogs" ADD CONSTRAINT "FK_586a26d98ff658ca9ee36e02541" FOREIGN KEY ("patientPatientId") REFERENCES "Patients"("PatientId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Chairs" ADD CONSTRAINT "FK_1763148c1dc64b455817649d25d" FOREIGN KEY ("roomRoomId") REFERENCES "Rooms"("RoomId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ProductUsage" ADD CONSTRAINT "FK_4ce33125b3a7a42f3ceac3c38a1" FOREIGN KEY ("productProductId") REFERENCES "Products"("ProductId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ProductUsage" ADD CONSTRAINT "FK_33a7e0c2eed4d36a1ac082278dd" FOREIGN KEY ("appointmentAppointmentId") REFERENCES "Appointments"("AppointmentId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Appointments" ADD CONSTRAINT "FK_2318f7d5e34d0d426ae6b55a732" FOREIGN KEY ("patientPatientId") REFERENCES "Patients"("PatientId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Appointments" ADD CONSTRAINT "FK_562bae8f3066d1027f556f39327" FOREIGN KEY ("doctorUserId") REFERENCES "Users"("UserId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Appointments" ADD CONSTRAINT "FK_0358ad11d2582610752ceb72754" FOREIGN KEY ("serviceServiceId") REFERENCES "Services"("ServiceId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Appointments" ADD CONSTRAINT "FK_8de7bb87244bdeb84e816915db5" FOREIGN KEY ("roomRoomId") REFERENCES "Rooms"("RoomId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Appointments" ADD CONSTRAINT "FK_d80d0e0c7db5427523fde8db5d0" FOREIGN KEY ("chairChairId") REFERENCES "Chairs"("ChairId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Attendance" ADD CONSTRAINT "FK_91c345896e690bca047585fde1b" FOREIGN KEY ("userUserId") REFERENCES "Users"("UserId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Logs" ADD CONSTRAINT "FK_3edfe888f16414dc33b671c06df" FOREIGN KEY ("userUserId") REFERENCES "Users"("UserId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Users" ADD CONSTRAINT "FK_f6a78d2ce28935986754f5baa6e" FOREIGN KEY ("departmentDepartmentId") REFERENCES "Departments"("DepartmentId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Users" DROP CONSTRAINT "FK_f6a78d2ce28935986754f5baa6e"`);
        await queryRunner.query(`ALTER TABLE "Logs" DROP CONSTRAINT "FK_3edfe888f16414dc33b671c06df"`);
        await queryRunner.query(`ALTER TABLE "Attendance" DROP CONSTRAINT "FK_91c345896e690bca047585fde1b"`);
        await queryRunner.query(`ALTER TABLE "Appointments" DROP CONSTRAINT "FK_d80d0e0c7db5427523fde8db5d0"`);
        await queryRunner.query(`ALTER TABLE "Appointments" DROP CONSTRAINT "FK_8de7bb87244bdeb84e816915db5"`);
        await queryRunner.query(`ALTER TABLE "Appointments" DROP CONSTRAINT "FK_0358ad11d2582610752ceb72754"`);
        await queryRunner.query(`ALTER TABLE "Appointments" DROP CONSTRAINT "FK_562bae8f3066d1027f556f39327"`);
        await queryRunner.query(`ALTER TABLE "Appointments" DROP CONSTRAINT "FK_2318f7d5e34d0d426ae6b55a732"`);
        await queryRunner.query(`ALTER TABLE "ProductUsage" DROP CONSTRAINT "FK_33a7e0c2eed4d36a1ac082278dd"`);
        await queryRunner.query(`ALTER TABLE "ProductUsage" DROP CONSTRAINT "FK_4ce33125b3a7a42f3ceac3c38a1"`);
        await queryRunner.query(`ALTER TABLE "Chairs" DROP CONSTRAINT "FK_1763148c1dc64b455817649d25d"`);
        await queryRunner.query(`ALTER TABLE "CrmLogs" DROP CONSTRAINT "FK_586a26d98ff658ca9ee36e02541"`);
        await queryRunner.query(`ALTER TABLE "CrmLogs" DROP CONSTRAINT "FK_1ef4fc30108e5b0fce9fbbdb7fe"`);
        await queryRunner.query(`ALTER TABLE "Invoices" DROP CONSTRAINT "FK_5d60e417ce94a5cfee3f52bb113"`);
        await queryRunner.query(`ALTER TABLE "Invoices" DROP CONSTRAINT "FK_aa59c195be883525d2fd33117fd"`);
        await queryRunner.query(`ALTER TABLE "Payments" DROP CONSTRAINT "FK_75198d5a07020ab405bfcac0bdf"`);
        await queryRunner.query(`ALTER TABLE "MedicalRecords" DROP CONSTRAINT "FK_a958ddaa5f1a4e2f28014e7bc5e"`);
        await queryRunner.query(`ALTER TABLE "MedicalRecords" DROP CONSTRAINT "FK_4d042be57439515b6388428b26f"`);
        await queryRunner.query(`ALTER TABLE "MedicalRecords" DROP CONSTRAINT "FK_515c515bd47711e7ca9de748d42"`);
        await queryRunner.query(`ALTER TABLE "MedicalRecordImages" DROP CONSTRAINT "FK_22140dccfa30821e7493b01e452"`);
        await queryRunner.query(`DROP TABLE "Users"`);
        await queryRunner.query(`DROP TABLE "Logs"`);
        await queryRunner.query(`DROP TABLE "Attendance"`);
        await queryRunner.query(`DROP TABLE "Appointments"`);
        await queryRunner.query(`DROP TABLE "ProductUsage"`);
        await queryRunner.query(`DROP TABLE "Products"`);
        await queryRunner.query(`DROP TABLE "Rooms"`);
        await queryRunner.query(`DROP TABLE "Chairs"`);
        await queryRunner.query(`DROP TABLE "Patients"`);
        await queryRunner.query(`DROP TABLE "CrmLogs"`);
        await queryRunner.query(`DROP TABLE "CrmCampaigns"`);
        await queryRunner.query(`DROP TABLE "Invoices"`);
        await queryRunner.query(`DROP TABLE "Payments"`);
        await queryRunner.query(`DROP TABLE "MedicalRecords"`);
        await queryRunner.query(`DROP TABLE "MedicalRecordImages"`);
        await queryRunner.query(`DROP TABLE "Services"`);
        await queryRunner.query(`DROP TABLE "Departments"`);
    }

}
