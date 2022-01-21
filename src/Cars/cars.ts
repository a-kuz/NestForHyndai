import { ApiProperty } from '@nestjs/swagger';

export class Car {
  @ApiProperty()
  ID: number;
  @ApiProperty()
  IDcar: number;
  @ApiProperty()
  DateStart: Date;
  @ApiProperty()
  DateEnd: Date;

  constructor(ID: number, IDcar: number, DateStart: Date, DateEnd: Date) {
    this.ID = ID;
    this.IDcar = IDcar;
    this.DateStart = DateStart;
    this.DateEnd = DateEnd;
  }
}
