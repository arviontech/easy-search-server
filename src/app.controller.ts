import { Controller, Get } from "@nestjs/common";


@Controller()
export class AppController {
    @Get()
    root() {
        return {
            code: 200,
            success: true,
            message: 'Welcome to Easy Search server',
        }
    }
}