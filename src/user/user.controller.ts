import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { UserService } from './user.service';



@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  // @Post('create-admin')
  // async createAdmin(
  //   @Body(new ZodValidationPipe(CreateUserSchema)) payload: TUser,
  // ) {
  //   const res = await this.userService.createAdmin(payload);

  //   return sendResponse({
  //     statusCode: HttpStatus.CREATED,
  //     success: true,
  //     message: 'Admin created successfully',
  //     data: res,
  //   });
  // }
}
