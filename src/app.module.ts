import { Module } from '@nestjs/common';
import { ApiController } from './api.controller';
import { DisplayService } from './display.service';
import { DisplayGateway } from './display.gateway';
import { StudentRepository } from './students.repository';
import { SqliteStudentRepository } from './sqlite-student.repository';

@Module({
  controllers: [ApiController],
  providers: [
    DisplayService,
    DisplayGateway,
    // Ovdje zamijeni implementaciju kad se spajamo na FER-ovu bazu
    { provide: StudentRepository, useClass: SqliteStudentRepository },
  ],
})
export class AppModule {}
