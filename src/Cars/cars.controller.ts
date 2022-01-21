import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { CarService } from './cars.services';
import { OrderMonth } from './dto/orderMonth.dto';
import { RezerveCarsDto as ReserveCarsDto } from './dto/reserveCars.dto';
@ApiTags('cars')
@Controller()
export class CarsController {
  constructor(private readonly carService: CarService) {}

  @Post('order')
  @ApiBody({ type: OrderMonth })
  getOrder(@Body() orderMonth: OrderMonth) {
    return this.carService.orderMonth(orderMonth);
  }

  @Post('check')
  @ApiBody({ type: ReserveCarsDto })
  getHello(@Body() reserveCarsDto: ReserveCarsDto) {
    return this.carService.getStatus(
      reserveCarsDto.carId,
      reserveCarsDto.dateStart,
      reserveCarsDto.dateEnd,
    );
  }

  @Post('reserve')
  @ApiBody({ type: ReserveCarsDto })
  postHello(@Body() reserveCarsDto: ReserveCarsDto) {
    //console.log(reservecarsdto)
    return this.carService.reserveCar(
      reserveCarsDto.carId,
      reserveCarsDto.dateStart,
      reserveCarsDto.dateEnd,
    );
  }
}
