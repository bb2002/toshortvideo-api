import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return '조망간 editly 호출해서 실행결과 출력예정';
  }
}
