import { Injectable } from '@nestjs/common';
import { Car } from './cars';
import { client } from './connectDB';
import { OrderMonth } from './dto/orderMonth.dto';
import { req as Requests } from './Request';
@Injectable()
export class CarService {
  private readonly car: Car = new Car(
    0,
    0,
    new Date('2022-01-01'),
    new Date('2022-01-03'),
  );
  //The method checks the existence of the table, via a query
  private async checkTable() {
    return client
      .query(Requests.find((e) => e.req == 'Check creation'))
      .catch(async (e) => {
        if (e.table == undefined) {
          await this.createTable();
        }
      });
  }
  //The method creates a table with a query
  private async createTable() {
    client
      .query(Requests.find((e) => e.req == 'Create tableCars'))
      .catch((e) => {
        console.log(e);
        throw new Error(e);
      });
  }
  private async checkTablePrice() {
    return await client
      .query(Requests.find((e) => e.req == 'Check Table Price'))
      .then(async (res) => {
        if (Object.values(res.rows[0])[0] == 0) {
          return await this.fillTablePrice();
        }
      })
      .catch(async (e) => {
        if (e.table == undefined) {
          return await this.createTablePrice().then(async () => {
            return await this.fillTablePrice();
          });
        }
      });
  }
  //The method creates a table with a query
  private async createTablePrice() {
    return await client
      .query(Requests.find((e) => e.req == 'Create TablePrice'))
      .then((res) => {
        return res;
      })
      .catch((e) => {
        console.log('err create' + e);
        throw new Error(e);
      });
  }
  private async fillTablePrice() {
    return await client
      .query(Requests.find((e) => e.req == 'Fill Table Price'))
      .catch((e) => {
        console.log(e);
        throw new Error(e);
      });
  }
  //The method makes select records from the table and if there is a record, then there is a session, and the car is busy
  private async checkCar(IDcar: number, DateStart: Date, DateEnd: Date) {
    return await client
      .query(
        Requests.find((e) => e.req == 'Check car'),
        [IDcar, DateStart, DateEnd],
      )
      .then((res) => {
        if (Object.values(res.rows[0])[0] == 0) {
          return { err: false, errtext: '', rezerve: false };
        } else {
          return { err: false, errtext: '', rezerve: true };
        }
      })
      .catch((e) => {
        throw new Error(e);
      });
  }
  //The method reserves the car, makes an insert if the car is not occupied and the session satisfies the conditions
  async reserveCar(
    IDcar: number,
    DateStart: Date,
    DateEnd: Date,
  ): Promise<string> {
    if (!this.checkid(IDcar)) {
      return 'The identification car is specified more than there is in the park';
    }
    const d = this.convertDate(DateStart, DateEnd);
    DateStart = d.DateStart;
    DateEnd = d.DateEnd;
    console.log(IDcar);
    console.log(typeof IDcar);
    if (DateStart < DateEnd) {
      if ((+DateEnd - +DateStart) / (60 * 60 * 24 * 1000) > 30) {
        return 'It is not possible to reserve for more than 30 days';
      }
      if (DateStart.getDay() > 0 && DateStart.getDay() < 6) {
        return await this.getStatusCar(IDcar, DateStart, DateEnd).then(
          async (res) => {
            let Price: number;
            await this.calcPrise(DateStart, DateEnd).then((price) => {
              Price = price;
            });
            switch (res) {
              case false:
                return await this.isReserved(
                  IDcar,
                  DateStart,
                  DateEnd,
                  Price,
                ).then((res) => {
                  if (res) {
                    return (
                      'I have reserved a car, everything is fine.Rental price: ' +
                      Price
                    );
                  }
                });
              case true:
                return 'The car has already been reserved, choose another car or dates.';
            }
          },
        );
      } else {
        return 'The beginning or end of the lease should fall on weekdays';
      }
    } else {
      return 'Dates are not correctly selected';
    }
  }
  //Method for insert to table
  private async isReserved(
    IDcar: number,
    DateStart: Date,
    DateEnd: Date,
    Price: number,
  ): Promise<boolean> {
    return await client
      .query(
        Requests.find((e) => e.req == 'Rezerve car'),
        [IDcar, DateStart, DateEnd, Price],
      )
      .then(() => {
        return true;
      })
      .catch((err) => {
        console.log(err);
        throw new Error(err);
      });
  }
  //Method for getting the status of the car, reserved or not
  async getStatus(IDcar: number, DateStart: Date, DateEnd: Date) {
    if (!this.checkid(IDcar)) {
      return 'The identification car is specified more than there is in the park';
    }
    const d = this.convertDate(DateStart, DateEnd);
    DateStart = d.DateStart;
    DateEnd = d.DateEnd;
    let Price: number;
    if (DateStart < DateEnd) {
      if ((+DateEnd - +DateStart) / (60 * 60 * 24 * 1000) > 30) {
        return 'It is not possible to reserve for more than 30 days';
      }
      if (DateStart.getDay() > 0 && DateStart.getDay() < 6) {
        return await this.getStatusCar(IDcar, DateStart, DateEnd).then(
          async (res) => {
            await this.calcPrise(DateStart, DateEnd).then((price) => {
              Price = price;
            });
            switch (res) {
              case false:
                return 'Not Rezerv. Rental price: ' + Price;
              case true:
                return 'Rezerv';
            }
          },
        );
      } else {
        return 'The beginning or end of the lease should fall on weekdays';
      }
    } else {
      return 'Dates are not correctly selected';
    }
  }
  //The upper method for checking the status
  private async getStatusCar(IDcar: number, DateStart: Date, DateEnd: Date) {
    if (!client._connected) {
      client.connect();
    }
    await this.checkTable().catch((err) => {
      throw new Error(err);
    });
    await this.checkTablePrice().catch((err) => {
      throw new Error(err);
    });
    return await this.checkCar(IDcar, DateStart, DateEnd).then((res) => {
      return res.rezerve;
    });
  }
  //Method for calculating rental days
  private async calcPrise(DateStart: Date, DateEnd: Date) {
    const day = (+DateEnd - +DateStart) / (60 * 60 * 24 * 1000);
    return await this.sumPrice(day);
  }
  //Method for calculating the rental cost
  private async sumPrice(countday: number) {
    return await client
      .query(
        Requests.find((e) => e.req == 'Sum Price'),
        [countday],
      )
      .then((res) => {
        return res.rows[0].sum;
      })
      .catch((err) => {
        console.log(err);
        throw new Error(err);
      });
  }
  //Method for converting a date from a string or from a number
  private convertDate(DateStart: Date, DateEnd: Date) {
    if (
      typeof DateStart === 'string' ||
      typeof DateStart === 'number' ||
      typeof DateEnd === 'string' ||
      typeof DateEnd === 'number'
    ) {
      DateStart = new Date(DateStart);
      DateEnd = new Date(DateEnd);
    }
    return { DateStart: DateStart, DateEnd: DateEnd };
  }
  private checkid(idcar: number): boolean {
    return idcar < 5 && idcar >= 0; //Checking the machine ID
  }
  //Top method for reports
  async orderMonth(_ordermonth: OrderMonth) {
    if (!client._connected) {
      client.connect(); //Connecting to the database
    }
    await this.checkTable() //Table validation method
      .catch((err) => {
        throw new Error(err);
      });
    await this.checkTablePrice().catch((err) => {
      throw new Error(err);
    });
    let Month;
    if (
      typeof _ordermonth.Month === 'string' ||
      typeof _ordermonth.Month === 'number'
    ) {
      Month = new Date(_ordermonth.Month);
    }
    if (_ordermonth.all) {
      return this.orderMonth2(Month);
    } else {
      return this.orderMonthId(_ordermonth.IDCar, Month);
    }
  }
  //Method for reporting the average car load by id for the month
  async orderMonthId(idcar: number, month: Date) {
    console.log(month);
    if (!this.checkid(idcar)) {
      return 'The identification car is specified more than there is in the park';
    }
    const req = Requests.find((e) => e.req == 'Order month');
    req.text = req.text.replace('1=1', '"IDCar" = $2');
    return await client
      .query(req, [month, idcar])
      .then((res) => {
        let _res;
        if (res.rows.length > 0) {
          _res = res.rows[0];
        } else {
          _res = { [req.ret[0]]: idcar, [req.ret[1]]: 0 };
        }
        return _res;
      })
      .catch((err) => {
        console.log(err);
        throw new Error(err);
      });
  }
  //Method for reporting the average load of all cars for the month ?????? 
  async orderMonth2(month: Date) {
    const req = Requests.find((e) => e.req == 'Order month');
    req.text = req.text.replace('"IDCar" = $2', '1=1');
    return await client
      .query(req, [month])
      .then((res) => {
        let _res;
        if (res.rows.length > 0) {
          _res = res.rows;
        } else {
          _res = { [req.ret[1]]: 0 };
        }
        return _res;
      })
      .catch((err) => {
        console.log(err);
        throw new Error(err);
      });
  }
}
