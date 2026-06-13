import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHealth() {
    return {
      name: 'Zamindar Plus API',
      status: 'ok',
    };
  }
}
