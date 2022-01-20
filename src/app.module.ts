import { Module } from '@nestjs/common';
import { CarsController } from './cars/cars.controller';
import { CarService } from './cars/cars.services';

@Module({
  imports: [],
  controllers: [CarsController],
  providers: [CarService],
})
export class AppModule {}
